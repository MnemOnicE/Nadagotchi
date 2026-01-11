import { Nadagotchi } from './Nadagotchi.js';
import { PersistenceManager } from './PersistenceManager.js';
import { Calendar } from './Calendar.js';
import { EventManager } from './EventManager.js';
import { WorldClock } from './WorldClock.js';
import { WeatherSystem } from './WeatherSystem.js';
import { SkyManager } from './SkyManager.js';
import { LightingManager } from './LightingManager.js';
import { AchievementManager } from './AchievementManager.js';
import { EventKeys } from './EventKeys.js';
import { Config } from './Config.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';
import { ItemDefinitions } from './ItemData.js';
import { RoomDefinitions } from './RoomDefinitions.js';

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
    }

    /**
     * Phaser lifecycle method called once, before the scene is created.
     * Used to load all necessary assets like images, spritesheets, and audio.
     */
    preload() {
        // Assets are now handled by PreloaderScene.js
    }

    /**
     * Phaser lifecycle method called once, after `preload`.
     * Sets up game objects, initializes systems, launches the UI scene, and registers event listeners.
     * @param {object} [data] - Optional data object passed from another scene.
     * @param {object} [data.newPetData] - Data for creating a new pet, typically from the BreedingScene.
     */
    create(data) {
        // --- World Systems Initialization (Pre-Visuals) ---
        this.persistence = new PersistenceManager();
        const loadedCalendar = this.persistence.loadCalendar();
        this.calendar = new Calendar(loadedCalendar);
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

        // --- Indoor Backgrounds (Wallpaper/Flooring) ---
        // Will be initialized in renderLocation / changeRoom
        this.wallpaperLayer = this.add.tileSprite(400, 200, 800, 400, 'wallpaper_default').setVisible(false).setDepth(0);
        this.flooringLayer = this.add.tileSprite(400, 500, 800, 200, 'flooring_default').setVisible(false).setDepth(0);

        this.ground = this.add.graphics().setDepth(0);
        // Drawing handled in resize

        // --- Pet Initialization ---
        const loadedPet = this.persistence.loadPet();

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

        if (!loadedPet && !(data && data.newPetData)) {
             this.persistence.savePet(this.nadagotchi);
        }

        // Expose for verification/testing
        window.mainScene = this;

        // --- Settings Initialization ---
        const savedSettings = this.persistence.loadSettings();
        this.gameSettings = {
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

        // --- Final Setup ---
        this.resize({ width: this.scale.width, height: this.scale.height });
        this.skyManager.update(); // Initial draw
        this.loadFurniture();
    }

    /**
     * Updates the wallpaper texture and saves the configuration.
     * @param {string} key - The new texture key.
     */
    updateWallpaper(key) {
        if (this.wallpaperLayer) {
            this.wallpaperLayer.setTexture(key);
        }
    }

    /**
     * Updates the flooring texture and saves the configuration.
     * @param {string} key - The new texture key.
     */
    updateFlooring(key) {
        if (this.flooringLayer) {
            this.flooringLayer.setTexture(key);
        }
    }

    /**
     * Cleans up event listeners and resources when the scene shuts down.
     */
    shutdown() {
        if (this.game) {
            this.game.events.off(EventKeys.UI_ACTION, this.handleUIActionBound);
            this.game.events.off(EventKeys.UPDATE_SETTINGS, this.handleUpdateSettingsBound);
            this.game.events.off(EventKeys.WORK_RESULT, this.handleWorkResultBound);
            this.game.events.off(EventKeys.SCENE_COMPLETE, this.handleSceneCompleteBound);
        }
        this.scale.off('resize', this.resize, this);
        if (this.autoSaveTimer) this.autoSaveTimer.remove();

        // Clean up placement listeners if active
        if (this.isPlacementMode) {
             if (this._placementMoveHandler) this.input.off('pointermove', this._placementMoveHandler);
             if (this._placementDownHandler) this.input.off('pointerdown', this._placementDownHandler);
        }
    }

    /**
     * The core game loop, called every frame.
     * Updates game state, systems, and visuals.
     * @param {number} time - The current time in milliseconds.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        const dayPassed = this.worldClock.update(delta);
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

            this.eventManager.update();
        }

        // UPDATE properties, DO NOT reassign object
        this.worldState.time = this.worldClock.getCurrentPeriod();
        this.worldState.weather = this.weatherSystem.getCurrentWeather();
        this.worldState.activeEvent = this.eventManager.getActiveEvent();
        this.worldState.season = this.calendar.season;

        // Update Managers
        this.skyManager.update();

        // Apply game speed multiplier to delta time
        const simDelta = delta * (this.gameSettings.gameSpeed || 1.0);
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

        // Resize Wallpaper/Flooring
        if (this.wallpaperLayer) {
            this.wallpaperLayer.setSize(width, gameHeight - 100); // Floor is 100px high
            this.wallpaperLayer.setPosition(width / 2, (gameHeight - 100) / 2);
        }
        if (this.flooringLayer) {
            this.flooringLayer.setSize(width, 100);
            this.flooringLayer.setPosition(width / 2, gameHeight - 50); // Center of bottom 100px
        }

        // Redraw Ground relative to new gameHeight
        if (this.ground) {
             this.ground.clear();
             this.ground.fillStyle(0x228B22, 1);
             this.ground.fillRect(0, gameHeight - 100, width, 100);
        }

        // Reposition Interactive Objects relative to new gameHeight
        // Ensure they are visible above the dashboard
        // Adjusted to -70 to prevent overlap with top items (at Y=250) in the compressed gameHeight
        if (this.craftingTable) this.craftingTable.setPosition(80, gameHeight - 70);
        if (this.npcScout) this.npcScout.setPosition(width - 150, gameHeight - 70);
        if (this.npcVillager) this.npcVillager.setPosition(150, gameHeight / 2);

        // Update Plant/Bookshelf (pinned to top/corners, mostly fine but check X)
        if (this.plant) this.plant.setPosition(width - 80, 250);

        // Reposition Transition Objects
        // House -> Garden (Center-Left)
        if (this.houseObj) {
            this.houseObj.setPosition(100, gameHeight - 80);
        }
        // Door -> Indoor (Right Side)
        if (this.doorObj) this.doorObj.setPosition(width - 50, gameHeight - 130);

        // Resize Room Doors
        this._refreshRoomDoors();

    }

    /**
     * Switches the view to 'INDOOR'.
     */
    enterHouse() {
        this.location = 'INDOOR';
        this.currentRoom = 'Entryway';
        this.changeRoom('Entryway');
        SoundSynthesizer.instance.playChime();
        this.showNotification("Welcome Home!", '#FFFFFF');
    }

    /**
     * Switches the view to 'GARDEN'.
     */
    exitHouse() {
        this.location = 'GARDEN';
        this.renderLocation();
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
        const def = RoomDefinitions[roomId];

        // 1. Update Backgrounds
        // Check homeConfig for this room
        // Ensure config exists
        if (!this.nadagotchi.homeConfig.rooms[roomId]) {
             this.nadagotchi.homeConfig.rooms[roomId] = {
                 wallpaper: def.defaultWallpaper,
                 flooring: def.defaultFlooring,
                 wallpaperItem: 'Default',
                 flooringItem: 'Default'
             };
        }
        const config = this.nadagotchi.homeConfig.rooms[roomId];
        this.updateWallpaper(config.wallpaper);
        this.updateFlooring(config.flooring);

        // 2. Render
        this.renderLocation();

        // 3. Navigation Doors
        this._refreshRoomDoors();

        this.showNotification(`${def.name}`, '#FFFFFF');
    }

    _refreshRoomDoors() {
        // Clear existing doors
        if (this.roomDoors) {
            this.roomDoors.forEach(d => d.destroy());
        }
        this.roomDoors = [];

        if (this.location !== 'INDOOR') return;

        const def = RoomDefinitions[this.currentRoom];
        const connections = def.connections;

        // Create navigation targets
        connections.forEach((targetId, index) => {
            const isUnlocked = this.nadagotchi.isRoomUnlocked(targetId);

            // Simple placement logic: Spaced out at the top
            // Width/Height available via cameras
            const w = this.cameras.main.width;
            const h = this.cameras.main.height;
            const x = (w / (connections.length + 1)) * (index + 1);
            const y = 80;

            if (isUnlocked) {
                const door = this.add.text(x, y, `Go to\n${RoomDefinitions[targetId].name}`, {
                     backgroundColor: '#333', padding: { x: 5, y: 5 }, align: 'center', fontFamily: 'VT323, Arial'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                door.on('pointerdown', () => this.changeRoom(targetId));
                this.roomDoors.push(door);
            } else {
                // Locked Door Logic
                // Find Deed Name
                // In a real app, maybe add 'Deed' to RoomDef or loop ItemDefs.
                // Hardcoding mapping for speed/simplicity as logic is in InventorySystem reverse-lookup.
                // Or show "Locked"
                const door = this.add.text(x, y, `Locked\n${RoomDefinitions[targetId].name}\n(Needs Deed)`, {
                     backgroundColor: '#555', color: '#AAA', padding: { x: 5, y: 5 }, align: 'center', fontFamily: 'VT323, Arial'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                // Add Padlock Icon/Emoji?
                // Visual feedback on click
                door.on('pointerdown', () => {
                    this.showNotification(`Locked! Requires Deed.`, '#FF0000');
                    SoundSynthesizer.instance.playFailure();
                });
                this.roomDoors.push(door);
            }
        });
    }

    /**
     * Updates the visibility of world objects based on the current location.
     */
    renderLocation() {
        const isIndoor = this.location === 'INDOOR';

        // 1. Backgrounds
        this.skyManager.setVisible(!isIndoor); // Hide Sky Indoors
        if (this.ground) this.ground.setVisible(!isIndoor);

        if (this.wallpaperLayer) this.wallpaperLayer.setVisible(isIndoor);
        if (this.flooringLayer) this.flooringLayer.setVisible(isIndoor);

        // 2. Transition Objects
        if (this.houseObj) this.houseObj.setVisible(!isIndoor);
        if (this.doorObj) this.doorObj.setVisible(isIndoor && this.currentRoom === 'Entryway'); // Only exit from Entryway

        // 3. Furniture (Indoor Only - Per Room)
        // Hide ALL placed furniture first
        Object.values(this.placedFurniture).flat().forEach(item => {
            if (item.sprite) item.sprite.setVisible(false);
        });

        if (isIndoor) {
            // Show furniture for CURRENT ROOM
            const roomFurniture = this.placedFurniture[this.currentRoom] || [];
            roomFurniture.forEach(item => {
                if (item.sprite) item.sprite.setVisible(true);
            });
        }

        // Toggle pre-placed furniture (Only visible in Entryway? Or assume Garden specific?)
        // Bookshelf/Plant/Crafting Table are currently "Global Indoor" or "Entryway" items in legacy logic.
        // Let's make them visible only in "Entryway" for now to keep them somewhere.
        const isEntryway = isIndoor && this.currentRoom === 'Entryway';
        if (this.bookshelf) this.bookshelf.setVisible(isEntryway);
        if (this.plant) this.plant.setVisible(isEntryway);
        if (this.craftingTable) this.craftingTable.setVisible(isEntryway);

        // 4. NPCs (Garden Only)
        if (this.npcScout) this.npcScout.setVisible(!isIndoor);
        if (this.npcArtisan) this.npcArtisan.setVisible(!isIndoor);
        if (this.npcVillager) this.npcVillager.setVisible(!isIndoor);

        // 5. Navigation Doors (Refresh visibility)
        if (!isIndoor) {
             this.roomDoors.forEach(d => d.destroy());
             this.roomDoors = [];
        } else {
            // Refresh called in changeRoom usually, but if we just toggle Garden->Indoor
            // we need to ensure they are there.
            if (this.roomDoors.length === 0) this._refreshRoomDoors();
        }

        // 6. Quest Indicators (Garden Only)
        Object.values(this.questIndicators).forEach(i => i.setVisible(false)); // Hide all first
        if (!isIndoor) {
             this.updateQuestIndicators(); // Refresh valid ones
        }
    }

    /**
     * Checks if a career has just been unlocked and displays a temporary visual notification.
     */
    checkCareerUnlock() {
        if (this.nadagotchi.newCareerUnlocked && !this.careerUnlockedNotified) {
            this.careerUnlockedNotified = true;
            this.showNotification(`Career Unlocked: ${this.nadagotchi.newCareerUnlocked}!`, '#FFD700');
            this.nadagotchi.newCareerUnlocked = null; // Clear the flag in the 'brain'
        }
    }

    /**
     * Displays a temporary notification text in the center of the game view.
     * @param {string} text - The text to display.
     * @param {string} [color='#FFD700'] - The color of the text.
     */
    showNotification(text, color = '#FFD700') {
        const gameHeight = this.cameras.main.height;
        const notificationText = this.add.text(this.cameras.main.width / 2, gameHeight / 2 - 50, text,
            { fontFamily: 'VT323, Arial', fontSize: '24px', color: color, backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 15, y: 10 } }
        ).setOrigin(0.5);

        this.tweens.add({ targets: notificationText, alpha: { from: 0, to: 1 }, duration: 500, yoyo: true, hold: 2500, onComplete: () => notificationText.destroy() });
    }

    /**
     * Updates the pet's sprite frame and animation to reflect its current mood.
     * Only triggers updates when the mood actually changes to prevent jitter.
     */
    updateSpriteMood() {
        if (this.currentMood !== this.nadagotchi.mood) {
            this.currentMood = this.nadagotchi.mood;
            // Map game moods to sprite frames:
            // Happy (0), Angry (1), Tired/Sad (2), Content/Neutral (3)
            const moodMap = { 'happy': 0, 'angry': 1, 'sad': 2, 'neutral': 3 };
            this.sprite.setFrame(moodMap[this.currentMood] ?? 3);
            this.startIdleAnimation(this.currentMood);
        }
    }

    /**
     * Starts a procedural idle animation based on the pet's mood and archetype.
     * Uses Phaser Tweens to create life-like movement.
     * @param {string} mood - The current mood ('happy', 'sad', 'angry', 'neutral').
     */
    startIdleAnimation(mood) {
        // Kill existing tweens on the sprite to prevent conflicts
        this.tweens.killTweensOf(this.sprite);

        // Fix for "Movement Warp" bug: Use the sprite's CURRENT position as the base
        const baseX = this.sprite.x;
        const baseY = this.sprite.y;

        // Reset properties to base state (except position)
        this.sprite.setScale(4);
        this.sprite.setAngle(0);
        this.sprite.setAlpha(1);

        const archetype = this.nadagotchi.dominantArchetype;

        if (mood === 'happy') {
            // Archetype-Specific Happy Animations
            if (archetype === 'Adventurer') {
                 // Jump and Shake (Excitement)
                 this.tweens.add({
                    targets: this.sprite,
                    y: baseY - 20,
                    angle: { from: -5, to: 5 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                 });
            } else if (archetype === 'Nurturer') {
                 // Gentle Sway / Swell with pride
                 this.tweens.add({
                    targets: this.sprite,
                    scaleX: 4.3,
                    scaleY: 3.7,
                    angle: { from: -2, to: 2 },
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                 });
            } else if (archetype === 'Mischievous') {
                 // Fast Jitter/Flip
                 this.tweens.add({
                    targets: this.sprite,
                    x: { from: baseX - 5, to: baseX + 5 },
                    scaleY: { from: 4, to: 3.5 }, // Squash
                    duration: 100,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Bounce.easeInOut'
                 });
            } else if (archetype === 'Intellectual') {
                 // Hover (Sine Wave)
                 this.tweens.add({
                    targets: this.sprite,
                    y: baseY - 10,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                 });
            } else if (archetype === 'Recluse') {
                 // Subtle, content bounce
                 this.tweens.add({
                    targets: this.sprite,
                    y: baseY - 5,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                 });
            } else {
                // Default Happy Hop
                this.tweens.add({
                    targets: this.sprite,
                    y: baseY - 15,
                    scaleY: 3.8,
                    scaleX: 4.2,
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                 });
            }

        } else if (mood === 'sad') {
             if (archetype === 'Recluse') {
                 // Fade / Shrink slightly
                 this.tweens.add({
                     targets: this.sprite,
                     alpha: 0.7,
                     scaleX: 3.8,
                     scaleY: 3.8,
                     duration: 1000,
                     yoyo: true,
                     repeat: -1
                 });
             } else {
                 // Default Sad Sway
                this.tweens.add({
                    targets: this.sprite,
                    angle: { from: -5, to: 5 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
             }
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

    /**
     * Checks for and triggers spontaneous, "proactive" behaviors based on the pet's state.
     */
    checkProactiveBehaviors() {
        if (this.thoughtBubble.visible || this.exploreBubble.visible) return;

        if (this.nadagotchi.mood === 'happy' && this.nadagotchi.dominantArchetype === 'Adventurer' && Phaser.Math.Between(1, 750) === 1) {
            this.exploreBubble.setVisible(true);
            this.time.delayedCall(2000, () => this.exploreBubble.setVisible(false));
        }
    }

    /**
     * Updates autonomous pet movement when Indoors.
     * @param {number} time - Current game time.
     */
    updatePetMovement(time) {
        // Only move autonomously if Indoors
        if (this.location !== 'INDOOR') {
            this.isMoving = false;
            return;
        }

        // Do not interrupt existing movement
        if (this.isMoving) return;

        // Check cooldown
        if (time < this.nextMoveTime) return;

        // Movement Trigger Chance (approx 1% per frame if cooldown passed)
        // Mood affects frequency: Happy/Energetic pets move more
        let chance = 100; // Base 1 in 100
        if (this.nadagotchi.mood === 'happy') chance = 50;
        if (this.nadagotchi.mood === 'sad') chance = 300; // Lethargic

        if (Phaser.Math.Between(1, chance) === 1) {
            const width = this.cameras.main.width;
            // Pick a random spot within room bounds (leaving 50px buffer)
            const targetX = Phaser.Math.Between(50, width - 50);
            this.walkTo(targetX);
        }
    }

    /**
     * Commands the pet to walk to a specific X coordinate.
     * @param {number} targetX - The target X coordinate.
     */
    walkTo(targetX) {
        this.isMoving = true;

        // Kill idle animations
        this.tweens.killTweensOf(this.sprite);

        // Determine direction
        const currentX = this.sprite.x;
        const distance = Math.abs(targetX - currentX);
        const direction = targetX > currentX ? 1 : -1;

        // Flip sprite to face direction
        // Default sprite faces Right. if direction is -1 (Left), flipX = true.
        this.sprite.setFlipX(direction < 0);

        // Ensure vertical position is correct for walking (slightly lower than idle bounce?)
        // Let's stick to the current Y or the calculated floor Y
        const dashboardHeight = Math.floor(this.scale.height * Config.UI.DASHBOARD_HEIGHT_RATIO);
        const gameHeight = this.scale.height - dashboardHeight;
        const centerY = gameHeight / 2;

        // Reset scale/rotation from idle anims
        this.sprite.setAngle(0);
        this.sprite.setScale(4);
        this.sprite.y = centerY;

        // Bobbing animation while walking
        const bobTween = this.tweens.add({
            targets: this.sprite,
            y: centerY - 5,
            duration: 150,
            yoyo: true,
            repeat: -1
        });

        // Movement Tween
        const speed = 0.1; // pixels per ms
        const duration = distance / speed;

        this.tweens.add({
            targets: this.sprite,
            x: targetX,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.isMoving = false;
                bobTween.stop();
                this.sprite.y = centerY; // Reset Y
                this.nextMoveTime = this.time.now + Phaser.Math.Between(2000, 5000); // Wait 2-5s before next move

                // Resume idle with updated position
                if (this.currentMood) this.startIdleAnimation(this.currentMood);
            }
        });
    }

    /**
     * Toggles placement mode for furniture items.
     * @param {?string} item - The name of the item to place, or null to exit placement mode.
     */
    togglePlacementMode(item) {
        this.isPlacementMode = !this.isPlacementMode;
        this.selectedFurniture = this.isPlacementMode ? item : null;

        if (this.isPlacementMode) {
            // Ensure decoration mode is OFF when entering new placement mode to avoid conflicts
            if (this.isDecorationMode) this.toggleDecorationMode();

            this.placementIndicator = this.add.graphics();
            this.placementIndicator.lineStyle(2, 0xff0000, 1);
            this.placementIndicator.strokeRect(0, 0, 64, 64);

            this.showNotification(`Placing: ${item}. Click item to pick up.`, '#00FFFF');

            // Store references to handlers so they can be removed specifically
            this._placementMoveHandler = (pointer) => {
                if (this.placementIndicator) {
                    this.placementIndicator.setPosition(pointer.x - 32, pointer.y - 32);
                }
            };
            this._placementDownHandler = (pointer) => {
                // Block if we just handled a sprite click (Pickup)
                if (this.blockPlacement) {
                    this.blockPlacement = false;
                    return;
                }

                this.game.events.emit(EventKeys.UI_ACTION, EventKeys.PLACE_FURNITURE, { x: pointer.x, y: pointer.y });
            };

            this.input.on('pointermove', this._placementMoveHandler);
            this.input.on('pointerdown', this._placementDownHandler);
        } else {
            if (this.placementIndicator) {
                this.placementIndicator.destroy();
                this.placementIndicator = null;
            }
            // Safely remove only our specific listeners
            if (this._placementMoveHandler) {
                this.input.off('pointermove', this._placementMoveHandler);
                this._placementMoveHandler = null;
            }
            if (this._placementDownHandler) {
                this.input.off('pointerdown', this._placementDownHandler);
                this._placementDownHandler = null;
            }
        }
    }

    /**
     * Toggles the "Decoration Mode" which allows moving existing furniture.
     */
    toggleDecorationMode() {
        this.isDecorationMode = !this.isDecorationMode;

        if (this.isDecorationMode) {
            this.showNotification("DECORATION MODE: Drag to Move", '#00FFFF');
            this.input.setDefaultCursor('move');
        } else {
            this.showNotification("Exited Decoration Mode", '#00FFFF');
            this.input.setDefaultCursor('default');
            this.saveFurniture(); // Save positions on exit
        }

        // Update interactivity of all placed furniture (in current room)
        const roomFurniture = this.placedFurniture[this.currentRoom] || [];
        roomFurniture.forEach(item => {
            if (item.sprite) {
                if (this.isDecorationMode) {
                    item.sprite.setTint(0xDDDDDD);
                    this.input.setDraggable(item.sprite);
                } else {
                    item.sprite.clearTint();
                    this.input.setDraggable(item.sprite, false);
                }
            }
        });
    }

    /**
     * Places the selected furniture item at the specified coordinates.
     * @param {number} x - The x-coordinate for the furniture.
     * @param {number} y - The y-coordinate for the furniture.
     */
    placeFurniture(x, y) {
        if (!this.isPlacementMode || !this.selectedFurniture) return;

        // Prevent placement in the dashboard area (bottom 25%)
        if (y > this.cameras.main.height) {
            this.showNotification("Can't place here!", '#FF0000');
            SoundSynthesizer.instance.playFailure();
            return;
        }

        if (this.nadagotchi.placeItem(this.selectedFurniture)) {
            const furnitureKey = this.selectedFurniture.toLowerCase().replace(' ', '_');
            const newFurniture = this.createPlacedFurnitureSprite(x, y, furnitureKey, this.selectedFurniture);

            if (!this.placedFurniture[this.currentRoom]) {
                 this.placedFurniture[this.currentRoom] = [];
            }
            this.placedFurniture[this.currentRoom].push({ key: this.selectedFurniture, x: x, y: y, sprite: newFurniture });
            this.saveFurniture();

            SoundSynthesizer.instance.playChime();
            this.togglePlacementMode(null);
        } else {
            // Should not happen if UI filtered correctly, but just in case
            this.togglePlacementMode(null);
        }
    }

    /**
     * Creates a sprite for placed furniture with interaction logic (Pickup/Interact).
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {string} textureKey - Texture key.
     * @param {string} itemName - The inventory item name.
     * @returns {Phaser.GameObjects.Sprite} The created sprite.
     */
    createPlacedFurnitureSprite(x, y, textureKey, itemName) {
        const sprite = this.add.sprite(x, y, textureKey).setInteractive({ useHandCursor: true }).setDepth(5);

        // Add drag listeners to support Decoration Mode
        sprite.on('drag', (pointer, dragX, dragY) => {
            if (this.isDecorationMode) {
                // Bound check
                const maxY = this.cameras.main.height - 32;
                sprite.x = dragX;
                sprite.y = Math.min(dragY, maxY);
            }
        });

        sprite.on('dragend', () => {
            if (this.isDecorationMode) {
                // Update the stored position in the array
                // Find in CURRENT ROOM
                const roomList = this.placedFurniture[this.currentRoom];
                if (roomList) {
                    const entry = roomList.find(f => f.sprite === sprite);
                    if (entry) {
                        entry.x = sprite.x;
                        entry.y = sprite.y;
                    }
                }
            }
        });

        sprite.on('pointerdown', (pointer) => {
            if (this.isPlacementMode) {
                // SIGNAL TO BLOCK SCENE CLICK
                this.blockPlacement = true;

                // PICK UP LOGIC
                sprite.destroy();

                const roomList = this.placedFurniture[this.currentRoom] || [];
                const index = roomList.findIndex(f => f.key === itemName && f.x === x && f.y === y); // Match original props? No, sprites can move.
                // Better to match by sprite instance
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
    saveFurniture() {
        const serializable = {};
        for (const [roomId, items] of Object.entries(this.placedFurniture)) {
            serializable[roomId] = items.map(f => ({ key: f.key, x: f.x, y: f.y }));
        }
        this.persistence.saveFurniture(serializable);
    }

    /**
     * Loads and renders previously placed furniture.
     */
    loadFurniture() {
        // loadFurniture returns { RoomID: [...] } now (via PersistenceManager migration)
        const loadedData = this.persistence.loadFurniture() || { "Entryway": [] };

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
