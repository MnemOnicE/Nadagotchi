import { Nadagotchi } from './Nadagotchi.js';
import { PersistenceManager } from './PersistenceManager.js';
import { Calendar } from './Calendar.js';
import { EventManager } from './EventManager.js';
import { WorldClock } from './WorldClock.js';
import { WeatherSystem } from './WeatherSystem.js';
import { SkyManager } from './SkyManager.js';
import { LightingManager } from './LightingManager.js';
import { WeatherParticleManager } from './WeatherParticleManager.js';
import { AchievementManager } from './AchievementManager.js';
import { EventKeys } from './EventKeys.js';
import { Config } from './Config.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';
import { ItemDefinitions } from './ItemData.js';
import { RoomDefinitions } from './RoomDefinitions.js';
import { ButtonFactory } from './ButtonFactory.js';
import { DebugConsole } from './DebugConsole.js';

/**
 * @fileoverview The primary game scene.
 * Manages the main game loop, world rendering, and coordination between systems.
 * Acts as the controller for the Nadagotchi entity and the environment.
 */

/**
 * @class MainScene
 * @extends Phaser.Scene
 * @classdesc
 * MainScene is the primary Phaser Scene for the Nadagotchi game.
 * It handles the visual representation of the pet, the environment, and core game logic loops.
 * It works in conjunction with UIScene, which handles all user interface elements.
 */
export class MainScene extends Phaser.Scene {
    /**
     * Creates an instance of MainScene.
     */
    constructor() {
        super({ key: 'MainScene' });
        /** @type {boolean} Whether the player is currently placing furniture. */
        this.isPlacementMode = false;
        /** @type {?string} The name of the furniture item currently selected for placement. */
        this.selectedFurniture = null;
        /** @type {object} Dictionary of furniture placed in each room. { RoomID: [{key, x, y, sprite?}] } */
        this.placedFurniture = {};
        /** @type {boolean} Whether the player is currently in decoration (edit/move) mode. */
        this.isDecorationMode = false;
        /** @type {?string} The career associated with the currently active minigame (for validation). */
        this.activeMinigameCareer = null;
        /** @type {?string} Tracks the current visual mood to optimize animation updates. */
        this.currentMood = null;
        /** @type {number} Time of the last UI stats update to throttle emissions. */
        this.lastStatsUpdate = -1000;

        // --- Housing System II State ---
        /** @type {string} Current view location: 'GARDEN' (default), 'INDOOR'. */
        this.location = 'GARDEN';
        /** @type {string} Current Room ID when location is INDOOR. */
        this.currentRoom = 'Entryway';
        // Note: homeConfig is now accessed via this.nadagotchi.homeConfig, not stored on scene

        // --- Indoor Navigation State ---
        /** @type {boolean} Whether the pet is currently moving autonomously. */
        this.isMoving = false;
        /** @type {number} Timestamp for the next autonomous move. */
        this.nextMoveTime = 0;

        /** @type {boolean} Flag indicating if async initialization is complete. */
        this.isReady = false;        this.calendar = new Calendar(loadedCalendar);
        this.eventManager = new EventManager(this.calendar);
        this.worldClock = new WorldClock(this);
        this.weatherSystem = new WeatherSystem(this);
        this.achievementManager = new AchievementManager(this.game);

        this.worldState = {
            time: this.worldClock.getCurrentPeriod(),
            weather: this.weatherSystem.getCurrentWeather(),
            activeEvent: this.eventManager.getActiveEvent(),
            season: this.calendar.season
        };

        // --- Visual Systems Initialization ---
        // Initialize SkyManager (creates skyTexture and image)
        this.skyManager = new SkyManager(this);
        this.weatherParticles = new WeatherParticleManager(this);

        // --- Indoor Backgrounds (Wallpaper/Flooring) ---
        // Will be initialized in renderLocation / changeRoom
        this.wallpaperLayer = this.add.tileSprite(400, 200, 800, 400, 'wallpaper_default').setVisible(false).setDepth(0);
        this.flooringLayer = this.add.tileSprite(400, 500, 800, 200, 'flooring_default').setVisible(false).setDepth(0);

        this.ground = this.add.graphics().setDepth(0);
        // Drawing handled in resize

        // --- Pet Initialization ---
        const loadedPet = await this.persistence.loadPet();
        if (data && data.newPetData) {
            // New Game: Pass null for loadedData to ensure defaults are used
            this.nadagotchi = new Nadagotchi(data.newPetData.dominantArchetype, null);
            // Assign name if passed
            if (data.newPetData.name) {
                this.nadagotchi.name = data.newPetData.name;
            }
        } else {
            // Resume Game or Default Fallback
            this.nadagotchi = new Nadagotchi('Adventurer', loadedPet);
        }

        // Initialize heavy async data (Journal, Recipes)
        await this.nadagotchi.init();

        if (!loadedPet && !(data && data.newPetData)) {
             await this.persistence.savePet(this.nadagotchi);        }

        // Expose for verification/testing
        window.mainScene = this;

        // --- Settings Initialization ---
        const savedSettings = await this.persistence.loadSettings();        this.gameSettings = {
            volume: Config.SETTINGS.DEFAULT_VOLUME,
            gameSpeed: Config.SETTINGS.DEFAULT_SPEED,
            ...savedSettings
        };

        /** @type {number} Timestamp of the last stats update emission to throttle UI refreshes. */
        this.lastStatsUpdateTime = -1000;


        // --- Transition Objects ---
        this.houseObj = this.add.sprite(0, 0, 'house_icon').setInteractive({ useHandCursor: true }).setVisible(false).setDepth(5)
            .on('pointerdown', () => this.enterHouse());

        this.doorObj = this.add.sprite(0, 0, 'door_icon').setInteractive({ useHandCursor: true }).setVisible(false).setDepth(5)
            .on('pointerdown', () => this.exitHouse());

        // Room Navigation Zones
        this.roomDoors = [];

        // --- Game Objects ---
        this.sprite = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'pet').setScale(4).setDepth(20);
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false).setDepth(21);
        this.exploreBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'explore_bubble').setVisible(false).setDepth(21);

        // --- Interactive Objects (Furniture & NPCs) ---
        // Initial positions; will be updated in resize
        // Adjusted initial Y positions to 250 to avoid overlapping with top-left/right UI text
        this.bookshelf = this.add.sprite(80, 250, 'bookshelf').setInteractive({ useHandCursor: true }).setDepth(5)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_BOOKSHELF));
        this.plant = this.add.sprite(this.scale.width - 80, 250, 'plant').setInteractive({ useHandCursor: true }).setDepth(5)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_PLANT));

        // Items anchored to bottom will be positioned in resize() to ensure they respect gameHeight
        this.craftingTable = this.add.sprite(80, 0, 'crafting_table').setInteractive({ useHandCursor: true }).setDepth(5)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.OPEN_CRAFTING_MENU));

        // Debris Group
        this.debrisGroup = this.add.group();

        // Add NPCs to the scene (Only visible in GARDEN)
        // Anchored to bottom, will be set in resize()
        this.npcScout = this.add.sprite(this.scale.width - 150, 0, 'npc_scout').setInteractive({ useHandCursor: true }).setDepth(10)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_SCOUT, 'Grizzled Scout'));

        // Anchored to top/center - Y adjusted to 250
        this.npcArtisan = this.add.sprite(this.scale.width / 2 + 100, 250, 'npc_artisan').setInteractive({ useHandCursor: true }).setDepth(10)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_ARTISAN, 'Master Artisan'));

        // Anchored to Center - Y adjusted to center of game view in resize()
        this.npcVillager = this.add.sprite(150, 0, 'npc_villager').setInteractive({ useHandCursor: true }).setDepth(10)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_VILLAGER, 'Sickly Villager'));

        // Special NPC: Traveling Merchant (Hidden by default)
        this.npcMerchant = this.add.sprite(0, 0, 'npc_merchant').setInteractive({ useHandCursor: true }).setDepth(15).setVisible(false)
            .on('pointerdown', () => this.handleMerchantInteraction());

        // Quest Indicators (!)
        this.questIndicators = {};
        ['npcScout', 'npcArtisan', 'npcVillager'].forEach(npcKey => {
             const indicator = this.add.text(0, 0, '!', { font: '40px Arial', color: '#FFFF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(100).setVisible(false);
             // Bobbing animation
             this.tweens.add({ targets: indicator, y: '-=10', duration: 800, yoyo: true, repeat: -1 });
             this.questIndicators[npcKey] = indicator;
        });


        // --- Post-FX & UI ---
        // Initialize LightingManager (creates lightTexture and image)
        this.lightingManager = new LightingManager(this);

        // Date Text removed - handled by UIScene Calendar Dropdown
        this.scene.launch('UIScene');

        // --- Timers and Event Listeners ---
        // Note: savePet(nadagotchi) now includes homeConfig internally
        this.autoSaveTimer = this.time.addEvent({ delay: 5000, callback: () => this.persistence.savePet(this.nadagotchi), loop: true });

        // Bind listeners to enable proper removal in shutdown
        this.handleUIActionBound = this.handleUIAction.bind(this);
        this.handleUpdateSettingsBound = this.handleUpdateSettings.bind(this);
        this.handleWorkResultBound = this.handleWorkResult.bind(this);
        this.handleSceneCompleteBound = this.handleSceneComplete.bind(this);

        this.game.events.on(EventKeys.UI_ACTION, this.handleUIActionBound);
        this.game.events.on(EventKeys.UPDATE_SETTINGS, this.handleUpdateSettingsBound);
        this.game.events.on(EventKeys.WORK_RESULT, this.handleWorkResultBound);
        this.game.events.on(EventKeys.SCENE_COMPLETE, this.handleSceneCompleteBound);
        this.scale.on('resize', this.resize, this);

        // --- Debug Console ---
        this.debugConsole = new DebugConsole(this);

        // --- Final Setup ---
        this.resize({ width: this.scale.width, height: this.scale.height });
        this.skyManager.update(); // Initial draw
        await this.loadFurniture();        this.renderDebris(); // Initial render of debris

        // --- Tutorial Trigger ---
        if (data && data.startTutorial) {
            this.time.delayedCall(500, () => {
                this.game.events.emit(EventKeys.START_TUTORIAL);
            });
        }

        // MARK AS READY
        this.isReady = true;        const dayPassed = this.worldClock.update(delta);
        if (dayPassed) {
            this.calendar.advanceDay();
            // Apply daily friendship decay
            if (this.nadagotchi.relationshipSystem) {
                this.nadagotchi.relationshipSystem.dailyUpdate();
            }

            // Generate Daily Quest
            if (this.nadagotchi.questSystem) {
                const newQuest = this.nadagotchi.questSystem.generateDailyQuest(this.calendar.season, this.weatherSystem.getCurrentWeather());
                if (newQuest) {
                    this.showNotification("New Daily Quest Available!", '#00FFFF');
                }
            }

            // Spawn Debris
            if (this.nadagotchi.debrisSystem) {
                this.nadagotchi.debrisSystem.spawnDaily(this.calendar.season, this.weatherSystem.getCurrentWeather());
                if (this.nadagotchi.stats.hunger < 50) this.nadagotchi.debrisSystem.spawnPoop(); // Simple rule
                this.renderDebris();
            }

            this.eventManager.update();
            this.checkMerchantVisibility();
        }

        // UPDATE properties, DO NOT reassign object
        this.worldState.time = this.worldClock.getCurrentPeriod();
        this.worldState.weather = this.weatherSystem.getCurrentWeather();
        this.worldState.activeEvent = this.eventManager.getActiveEvent();
        this.worldState.season = this.calendar.season;

        // Update Managers
        this.skyManager.update();
        this.weatherParticles.update(this.worldState.weather, this.worldState.season);

        // Apply game speed multiplier to delta time
        // FIX: Cap delta to prevent "Death Loop" on background resume
        const maxDelta = Config.GAME_LOOP.MAX_DELTA || 3600000;
        const cappedDelta = Math.min(delta, maxDelta);
        const simDelta = cappedDelta * (this.gameSettings.gameSpeed || 1.0);

        this.nadagotchi.live(simDelta, this.worldState);

        // OPTIMIZATION: Throttle stats updates to ~10Hz (every 100ms)
        // This prevents excessive UI rebuilding in UIScene while keeping the display responsive.
        if (time - this.lastStatsUpdate > Config.TIMING.UI_THROTTLE_MS) {
            // Include full world state for the new calendar dropdown
            const date = this.calendar.getDate();
            const fullState = {
                nadagotchi: this.nadagotchi,
                settings: this.gameSettings,
                world: {
                    timePeriod: this.worldState.time,
                    season: this.worldState.season,
                    day: date.day,
                    year: date.year,
                    weather: this.worldState.weather,
                    event: this.worldState.activeEvent
                }
            };
            this.game.events.emit(EventKeys.UPDATE_STATS, fullState);
            this.lastStatsUpdate = time;

            // Check for Quest Indicators periodically
            this.updateQuestIndicators();
        }

        this.updateSpriteMood();
        this.checkProactiveBehaviors();
        this.checkCareerUnlock();
        this.updatePetMovement(time);

        this.lightingManager.update();
    }

    updateQuestIndicators() {
        if (!this.nadagotchi.questSystem) return;

        const checkNPC = (npcName, indicatorKey) => {
             const hasQuest = this.nadagotchi.questSystem.hasNewQuest(npcName);
             const indicator = this.questIndicators[indicatorKey];
             const npcSprite = this[indicatorKey];

             // Only show if NPC is visible (i.e. we are in Garden)
             if (indicator && npcSprite && npcSprite.visible) {
                 indicator.setVisible(hasQuest);
                 indicator.setPosition(npcSprite.x, npcSprite.y - 60);
             } else if (indicator) {
                 indicator.setVisible(false);
             }
        };

        checkNPC('Grizzled Scout', 'npcScout');
        checkNPC('Master Artisan', 'npcArtisan');
        checkNPC('Sickly Villager', 'npcVillager');
    }

    /**
     * Handles actions dispatched from the UIScene.
     * @param {string} actionType - The type of action to handle (e.g., 'FEED', 'WORK', 'RETIRE').
     * @param {any} [data] - Optional data associated with the action.
     */
    handleUIAction(actionType, data) {
        if (this.isPlacementMode && actionType !== EventKeys.PLACE_FURNITURE) {
            this.togglePlacementMode(null); // Exit placement mode if another action is taken
        }

        switch (actionType) {
            case EventKeys.WORK:
                this.startWorkMinigame();
                break;
            case EventKeys.SWITCH_CAREER:
                if (this.nadagotchi.switchCareer(data)) {
                    SoundSynthesizer.instance.playChime();
                    this.showNotification(`Career Switched: ${data}`, '#00FF00');
                    // Force UI update
                    this.game.events.emit(EventKeys.UPDATE_STATS, { nadagotchi: this.nadagotchi, settings: this.gameSettings });
                } else {
                    SoundSynthesizer.instance.playFailure();
                }
                break;
            case EventKeys.RETIRE:
                this.scene.stop('UIScene');
                this.scene.start('BreedingScene', this.nadagotchi);
                break;
            case EventKeys.DECORATE:
                this.togglePlacementMode(data);
                break;
            case EventKeys.TOGGLE_DECORATION_MODE:
                this.toggleDecorationMode();
                break;
            case EventKeys.PLACE_FURNITURE:
                this.placeFurniture(data.x, data.y);
                break;
            case EventKeys.APPLY_HOME_DECOR: {
                // data IS the itemName string from UIScene
                // We pass currentRoom to ensure it applies to the correct context
                const result = this.nadagotchi.inventorySystem.applyHomeDecor(data, this.currentRoom);
                if (result.success) {
                    SoundSynthesizer.instance.playChime();
                    this.showNotification(result.message, '#00FF00');
                    if (result.type === 'WALLPAPER') {
                        this.updateWallpaper(result.assetKey);
                    } else if (result.type === 'FLOORING') {
                        this.updateFlooring(result.assetKey);
                    }
                } else {
                    SoundSynthesizer.instance.playFailure();
                    this.showNotification(result.message, '#FF0000');
                }
                break;
            }
            case EventKeys.INTERACT_SCOUT: {
                const result = this.nadagotchi.interact('Grizzled Scout');
                if (result) this.scene.get('UIScene').showDialogue('Grizzled Scout', result);
                break;
            }
            case EventKeys.INTERACT_ARTISAN: {
                const result = this.nadagotchi.interact('Master Artisan');
                if (result) this.scene.get('UIScene').showDialogue('Master Artisan', result);
                break;
            }
            case EventKeys.INTERACT_VILLAGER: {
                const result = this.nadagotchi.interact('Sickly Villager');
                if (result) this.scene.get('UIScene').showDialogue('Sickly Villager', result);
                break;
            }
            case EventKeys.INTERACT_BOOKSHELF:
                // Launch Study Minigame (Bookworm)
                this.scene.pause();
                this.scene.launch('StudyMinigameScene', { nadagotchi: this.nadagotchi });
                break;
            case EventKeys.PLAY:
                // Launch Dance Minigame
                this.scene.pause();
                this.scene.launch('DanceMinigameScene', { nadagotchi: this.nadagotchi });
                break;
            case 'PLAY_COMPLETE':
                // Handle result from Dance Minigame
                // data.score contains the score
                this.scene.stop('DanceMinigameScene'); // Ensure it's stopped
                this.nadagotchi.handleAction('PLAY'); // Trigger stats effect
                // Bonus based on score?
                if (data.score > 500) {
                    this.nadagotchi.stats.happiness += 10;
                    this.showNotification("Great Dancing!", "#FF00FF");
                }
                break;
            case 'STUDY_COMPLETE':
                // Handle result from Study Minigame
                this.scene.stop('StudyMinigameScene');
                this.nadagotchi.handleAction('STUDY'); // Trigger stats effect
                if (data.score > 5) { // 5 words
                     this.nadagotchi.skills.logic += 0.5;
                     this.showNotification("Brain Power Up!", "#00FFFF");
                }
                break;
            case EventKeys.INTERACT_PLANT:
            case EventKeys.OPEN_CRAFTING_MENU:
                // These specific cases fall through to default handler or are handled by sprite events directly emitting specific actions
                this.nadagotchi.handleAction(actionType, data);
                break;
            case EventKeys.EXPLORE:
                // Check if affordable first
                if (this.nadagotchi.stats.energy >= Config.ACTIONS.EXPEDITION.ENERGY_COST) {
                    // Perform action logic (Energy deduction, Archetype bonuses, Recipes)
                    // We must call this to trigger "Expectations" (Archetype behaviors)
                    this.nadagotchi.handleAction(EventKeys.EXPLORE);

                    this.scene.pause();
                    this.scene.launch('ExpeditionScene', {
                        nadagotchi: this.nadagotchi,
                        weather: this.worldState.weather,
                        biome: 'Forest' // Default for Garden expeditions
                    });
                } else {
                     this.showNotification("Too Tired for Expedition", '#FF0000');
                }
                break;
            default:
                this.nadagotchi.handleAction(actionType, data);
                break;
        }
    }

    /**
     * Handles updates to game settings (Volume, Speed).
     * @param {object} newSettings - Partial settings object (e.g., { gameSpeed: 2.0 }).
     */
    handleUpdateSettings(newSettings) {
        this.gameSettings = { ...this.gameSettings, ...newSettings };
        this.persistence.saveSettings(this.gameSettings);
    }

    /**
     * Handles the results from a completed work mini-game.
     * @param {object} data - The result data from the mini-game scene.
     * @param {boolean} data.success - Whether the mini-game was completed successfully.
     * @param {string} data.career - The career associated with the mini-game.
     * @param {string} [data.craftedItem] - The item that was crafted, if any.
     */
    handleSceneComplete(data) {
        if (data.type === 'EXPEDITION') {
            // Expedition logic is handled within the scene/system, we just need to ensure UI update
            this.game.events.emit(EventKeys.UPDATE_STATS, { nadagotchi: this.nadagotchi, settings: this.gameSettings });
        }
    }

    /**
     * Handles the results from a completed work mini-game.
     * @param {object} data - The result data from the mini-game scene.
     * @param {boolean} data.success - Whether the mini-game was completed successfully.
     * @param {string} data.career - The career associated with the mini-game.
     * @param {string} [data.craftedItem] - The item that was crafted, if any.
     */
    handleWorkResult(data) {
        // Security Check: Ensure the result comes from a valid, active minigame session.
        if (this.activeMinigameCareer !== data.career) {
            console.warn(`Security Alert: Received WORK_RESULT for '${data.career}' but expected '${this.activeMinigameCareer}'. Event ignored.`);
            return;
        }
        this.activeMinigameCareer = null; // Reset flag

        // Delegated logic to Nadagotchi (Core Business Logic)
        const summary = this.nadagotchi.completeWorkShift(data);
        if (!summary) return; // Should not happen given check above

        if (summary.success) {
            SoundSynthesizer.instance.playSuccess();
            if (summary.promoted) {
                this.showNotification("PROMOTION!!", '#00FF00');
            }
        } else {
            SoundSynthesizer.instance.playFailure();
        }
    }

    /**
     * Launches the appropriate work mini-game scene based on the pet's current career.
     */
    startWorkMinigame() {
        if (!this.nadagotchi.currentCareer) return;
        const careerToSceneMap = {
            'Innovator': { key: 'LogicPuzzleScene' },
            'Scout': { key: 'ScoutMinigameScene' },
            'Archaeologist': { key: 'ScoutMinigameScene', data: { careerName: 'Archaeologist' } },
            'Healer': { key: 'HealerMinigameScene' },
            'Artisan': { key: 'ArtisanMinigameScene' }
        };
        const sceneConfig = careerToSceneMap[this.nadagotchi.currentCareer];
        if (sceneConfig) {
            this.activeMinigameCareer = this.nadagotchi.currentCareer; // Set security flag
            this.scene.pause();
            this.scene.launch(sceneConfig.key, sceneConfig.data || {});
        }
    }

    /**
     * Handles window resize events to keep game elements centered and textures scaled correctly.
     * @param {object} gameSize - The new size of the game window.
     * @param {number} gameSize.width - The new width.
     * @param {number} gameSize.height - The new height.
     */
    resize(gameSize) {
        const { width, height } = gameSize;

        // --- VIEWPORT ADJUSTMENT FOR DASHBOARD ---
        // Reserve bottom portion for the UI Shell (matches UIScene layout)
        const dashboardHeight = Math.floor(height * Config.UI.DASHBOARD_HEIGHT_RATIO);
        const gameHeight = height - dashboardHeight;

        this.cameras.main.setSize(width, gameHeight);
        this.cameras.main.setViewport(0, 0, width, gameHeight);

        // Update elements to fit within the new gameHeight
        // Restart animation to recalculate center position for tweens
        if (this.currentMood) {
            this.startIdleAnimation(this.currentMood);
        } else {
            this.sprite.setPosition(width / 2, gameHeight / 2);
        }

        // Resize dynamic textures via managers
        if (this.skyManager) this.skyManager.resize(width, gameHeight);
        if (this.lightingManager) this.lightingManager.resize(width, gameHeight);
        if (this.weatherParticles) this.weatherParticles.resize(width, gameHeight);            const x = d.x * width;
            const y = d.y * height;

            const sprite = this.add.sprite(x, y, d.type).setInteractive({ useHandCursor: true }).setDepth(15);

            sprite.on('pointerdown', () => {
                const res = this.nadagotchi.cleanDebris(d.id);
                if (res.success) {
                    SoundSynthesizer.instance.playChime();
                    this.showNotification(res.message, '#00FF00');
                    sprite.destroy();
                    // Force UI update
                    this.game.events.emit(EventKeys.UPDATE_STATS, { nadagotchi: this.nadagotchi, settings: this.gameSettings });
                } else {
                    SoundSynthesizer.instance.playFailure();
                    this.showNotification(res.message, '#FF0000');
                }
            });

            this.debrisGroup.add(sprite);
        });
    }

    checkMerchantVisibility() {
        const event = this.eventManager.getActiveEvent();
        this.isMerchantActive = event && event.name === 'TravelingMerchant';
        if (this.npcMerchant) {
             this.npcMerchant.setVisible(this.isMerchantActive && this.location !== 'INDOOR');
        }
        if (this.isMerchantActive) {
            this.showNotification("A Traveling Merchant has arrived!", "#800080");
        }
    }

    handleMerchantInteraction() {
        // Simple Barter Dialog
        // In a full implementation, this would open a Shop UI.
        // For now, simple interaction: Trade 5 Berries for a Rare Candy?

        const hasBerries = (this.nadagotchi.inventory['Berries'] || 0) >= 5;

        const dialogue = {
             speaker: "Merchant",
             text: "Greetings. I seek rare fruits. I will trade a Rare Candy for 5 Berries.",
             choices: [
                 { text: "Trade (5 Berries)", action: () => {
                      if (hasBerries) {
                           this.nadagotchi.inventorySystem.removeItem('Berries', 5);
                           this.nadagotchi.inventorySystem.addItem('Rare Candy', 1);
                           SoundSynthesizer.instance.playSuccess();
                           this.showNotification("Traded!", '#FFFF00');
                      } else {
                           this.showNotification("Not enough Berries!", '#FF0000');
                      }
                 }},
                 { text: "Leave", action: null }
             ]
        };

        this.scene.get('UIScene').showDialogue('Merchant', dialogue.text, dialogue.choices);
    }

    /**
     * Switches the view to 'INDOOR'.
     */
    enterHouse() {
        this.location = 'INDOOR';
        this.currentRoom = 'Entryway';
        this.nadagotchi.location = 'Entryway'; // Sync location        this.renderLocation();
        SoundSynthesizer.instance.playChime();
        this.showNotification("To the Garden!", '#FFFFFF');
    }

    /**
     * Switches the current indoor room.
     * @param {string} roomId
     */
    changeRoom(roomId) {
        if (!RoomDefinitions[roomId]) return;

        // Save furniture for previous room (state is live in placedFurniture object, just ensuring persist call logic knows)
        // No explicit save needed here, PersistenceManager handles full object.

        this.currentRoom = roomId;
        this.nadagotchi.location = roomId; // Sync location             }
        } else if (mood === 'angry') {
             // Angry Shake
             this.tweens.add({
                 targets: this.sprite,
                 x: { from: baseX - 3, to: baseX + 3 },
                 duration: 50,
                 yoyo: true,
                 repeat: -1,
                 ease: 'Linear'
             });
        } else {
             // Neutral / Breathing
            this.tweens.add({
                targets: this.sprite,
                scaleY: 4.1, // Slight stretch up
                scaleX: 3.9, // Slight squash in
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

                const liveIndex = roomList.findIndex(f => f.sprite === sprite);

                if (liveIndex > -1) roomList.splice(liveIndex, 1);
                this.saveFurniture();

                this.nadagotchi.returnItemToInventory(itemName);

                this.selectedFurniture = itemName;
                this.showNotification(`Moving: ${itemName}`, '#00FFFF');
                SoundSynthesizer.instance.playChime();

            } else {
                this.game.events.emit(EventKeys.UI_ACTION, `INTERACT_${itemName.toUpperCase().replace(' ', '_')}`);
            }
        });

        return sprite;
    }

    /**
     * Persists the placed furniture data.
     * Serializes only the necessary data (key, x, y), stripping sprite references.
     */
    async saveFurniture() {        const serializable = {};
        for (const [roomId, items] of Object.entries(this.placedFurniture)) {
            serializable[roomId] = items.map(f => ({ key: f.key, x: f.x, y: f.y }));
        }
        await this.persistence.saveFurniture(serializable);    }

    /**
     * Loads and renders previously placed furniture.
     */
    async loadFurniture() {
        // loadFurniture returns { RoomID: [...] } now (via PersistenceManager migration)
        const loadedData = await this.persistence.loadFurniture() || { "Entryway": [] };
        // Clear object but keep reference
        this.placedFurniture = {};

        for (const [roomId, items] of Object.entries(loadedData)) {
            this.placedFurniture[roomId] = [];
            items.forEach(furniture => {
                const furnitureKey = furniture.key.toLowerCase().replace(' ', '_');
                // Create sprite but keep invisible initially
                const sprite = this.createPlacedFurnitureSprite(furniture.x, furniture.y, furnitureKey, furniture.key);
                sprite.setVisible(false); // Default invisible, renderLocation will show current room's
                this.placedFurniture[roomId].push({ key: furniture.key, x: furniture.x, y: furniture.y, sprite: sprite });
            });
        }

        // Trigger initial render to show Entryway furniture
        this.renderLocation();
    }
}
