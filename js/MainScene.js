import { Nadagotchi } from './Nadagotchi.js';
import { PersistenceManager } from './PersistenceManager.js';
import { Calendar } from './Calendar.js';
import { EventManager } from './EventManager.js';
import { WorldClock } from './WorldClock.js';
import { WeatherSystem } from './WeatherSystem.js';
import { EventKeys } from './EventKeys.js';
import { Config } from './Config.js';

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
        /** @type {Array<{key: string, x: number, y: number}>} List of furniture placed in the world. */
        this.placedFurniture = [];
        /** @type {?string} The career associated with the currently active minigame (for validation). */
        this.activeMinigameCareer = null;
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
        // Define frames for the generated pet texture
        const petTexture = this.textures.get('pet');
        if (petTexture && !petTexture.getFrameNames().includes('0')) {
             petTexture.add(0, 0, 0, 0, 16, 16);
             petTexture.add(1, 0, 16, 0, 16, 16);
             petTexture.add(2, 0, 32, 0, 16, 16);
             petTexture.add(3, 0, 48, 0, 16, 16);
        }

        // --- Environment Setup ---
        // Initialize textures with full size initially; resize will adjust them
        this.skyTexture = this.textures.createCanvas('sky', this.scale.width, this.scale.height);
        this.add.image(0, 0, 'sky').setOrigin(0);

        this.ground = this.add.graphics();
        // Drawing handled in resize

        // --- Pet Initialization ---
        this.persistence = new PersistenceManager();
        const loadedPet = this.persistence.loadPet();

        if (data && data.newPetData) {
            // New Game: Pass null for loadedData to ensure defaults are used
            this.nadagotchi = new Nadagotchi(data.newPetData.dominantArchetype, null);
        } else {
            // Resume Game or Default Fallback
            this.nadagotchi = new Nadagotchi('Adventurer', loadedPet);
        }

        if (!loadedPet && !(data && data.newPetData)) this.persistence.savePet(this.nadagotchi);

        // --- Settings Initialization ---
        const savedSettings = this.persistence.loadSettings();
        this.gameSettings = {
            volume: Config.SETTINGS.DEFAULT_VOLUME,
            gameSpeed: Config.SETTINGS.DEFAULT_SPEED,
            ...savedSettings
        };


        // --- World Systems Initialization ---
        const loadedCalendar = this.persistence.loadCalendar();
        this.calendar = new Calendar(loadedCalendar);
        this.eventManager = new EventManager(this.calendar);
        this.worldClock = new WorldClock(this);
        this.weatherSystem = new WeatherSystem(this);

        this.worldState = {
            time: this.worldClock.getCurrentPeriod(),
            weather: this.weatherSystem.getCurrentWeather(),
            activeEvent: this.eventManager.getActiveEvent(),
            season: this.calendar.season
        };

        this.stars = Array.from({ length: 100 }, () => ({ x: Math.random(), y: Math.random() }));

        // --- Game Objects ---
        this.sprite = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'pet').setScale(4);
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false);
        this.exploreBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'explore_bubble').setVisible(false);

        // --- Interactive Objects ---
        // Initial positions; will be updated in resize
        this.bookshelf = this.add.sprite(80, 80, 'bookshelf').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_BOOKSHELF));
        this.plant = this.add.sprite(this.scale.width - 80, 80, 'plant').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_PLANT));
        this.craftingTable = this.add.sprite(80, this.scale.height - 150, 'crafting_table').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.OPEN_CRAFTING_MENU));

        // Add NPCs to the scene
        this.npcScout = this.add.sprite(this.scale.width - 150, this.scale.height - 150, 'npc_scout').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_SCOUT, 'Grizzled Scout'));
        this.npcArtisan = this.add.sprite(this.scale.width / 2 + 100, 80, 'npc_artisan').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_ARTISAN, 'Master Artisan'));
        this.npcVillager = this.add.sprite(150, this.scale.height / 2, 'npc_villager').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_VILLAGER, 'Sickly Villager'));

        // --- Post-FX & UI ---
        this.lightTexture = this.textures.createCanvas('light', this.scale.width, this.scale.height);
        this.lightImage = this.add.image(0, 0, 'light').setOrigin(0).setBlendMode('MULTIPLY').setVisible(false);
        // FIX: Moved dateText to the top-right corner (origin 1,0) to avoid overlap with stats
        this.dateText = this.add.text(this.scale.width - 10, 10, '', { fontFamily: 'VT323, Arial', fontSize: '20px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 5, y: 3 } }).setOrigin(1, 0);
        this.scene.launch('UIScene');

        // --- Timers and Event Listeners ---
        this.time.addEvent({ delay: 5000, callback: () => this.persistence.savePet(this.nadagotchi), loop: true });
        this.game.events.on(EventKeys.UI_ACTION, this.handleUIAction, this);
        this.game.events.on(EventKeys.UPDATE_SETTINGS, this.handleUpdateSettings, this);
        this.game.events.on(EventKeys.WORK_RESULT, this.handleWorkResult, this);
        this.scale.on('resize', this.resize, this);

        // --- Final Setup ---
        this.resize({ width: this.scale.width, height: this.scale.height });
        this.updateDateText();
        this.drawSky();
        this.loadFurniture();

        // --- Tutorial Trigger ---
        if (data && data.startTutorial) {
            // Delay slightly to ensure UIScene is fully ready
            this.time.delayedCall(500, () => {
                this.game.events.emit(EventKeys.START_TUTORIAL);
            });
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
            this.eventManager.update();
            this.updateDateText();
        }

        this.worldState.time = this.worldClock.getCurrentPeriod();
        this.worldState.weather = this.weatherSystem.getCurrentWeather();
        this.worldState.season = this.calendar.season;
        this.drawSky();

        // Apply game speed multiplier to delta time
        const simDelta = delta * (this.gameSettings.gameSpeed || 1.0);
        this.nadagotchi.live(simDelta, this.worldState);

        this.game.events.emit(EventKeys.UPDATE_STATS, { nadagotchi: this.nadagotchi, settings: this.gameSettings });

        this.updateSpriteMood();
        this.checkProactiveBehaviors();
        this.checkCareerUnlock();

        if (this.worldState.time === "Night" || this.worldState.time === "Dusk") {
            this.drawLight();
            this.lightImage.setVisible(true);
        } else {
            this.lightImage.setVisible(false);
        }
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
            case EventKeys.RETIRE:
                this.scene.stop('UIScene');
                this.scene.start('BreedingScene', this.nadagotchi);
                break;
            case EventKeys.DECORATE:
                this.togglePlacementMode(data);
                break;
            case EventKeys.PLACE_FURNITURE:
                this.placeFurniture(data.x, data.y);
                break;
            case EventKeys.INTERACT_SCOUT: {
                const text = this.nadagotchi.interact('Grizzled Scout');
                this.scene.get('UIScene').showDialogue('Grizzled Scout', text);
                break;
            }
            case EventKeys.INTERACT_ARTISAN: {
                const text = this.nadagotchi.interact('Master Artisan');
                this.scene.get('UIScene').showDialogue('Master Artisan', text);
                break;
            }
            case EventKeys.INTERACT_VILLAGER: {
                const text = this.nadagotchi.interact('Sickly Villager');
                this.scene.get('UIScene').showDialogue('Sickly Villager', text);
                break;
            }
            case EventKeys.INTERACT_BOOKSHELF:
            case EventKeys.INTERACT_PLANT:
            case EventKeys.OPEN_CRAFTING_MENU:
                // These specific cases fall through to default handler or are handled by sprite events directly emitting specific actions
                this.nadagotchi.handleAction(actionType, data);
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
    handleWorkResult(data) {
        // Security Check: Ensure the result comes from a valid, active minigame session.
        if (this.activeMinigameCareer !== data.career) {
            console.warn(`Security Alert: Received WORK_RESULT for '${data.career}' but expected '${this.activeMinigameCareer}'. Event ignored.`);
            return;
        }
        this.activeMinigameCareer = null; // Reset flag

        let skillUp = '';
        if (data.success) {
            // Calculate happiness gain with diminishing returns based on current happiness
            const maxHappiness = this.nadagotchi.maxStats.happiness;
            const currentHappiness = this.nadagotchi.stats.happiness;
            // 25 base, scales down as you get closer to max. Min gain of 5.
            const happinessGain = Math.max(5, 25 * (1 - (currentHappiness / maxHappiness)));
            this.nadagotchi.stats.happiness += happinessGain;

            const calculateSkillGain = (currentLevel, baseGain) => {
                // Diminishing returns: Gain decreases as level increases.
                // Formula: Base * (20 / (20 + Level))
                return baseGain * (20 / (20 + currentLevel));
            };

            switch (data.career) {
                case 'Innovator':
                    skillUp = 'logic';
                    this.nadagotchi.skills.logic += calculateSkillGain(this.nadagotchi.skills.logic, 1.5);
                    break;
                case 'Scout':
                    skillUp = 'navigation';
                    this.nadagotchi.skills.navigation += calculateSkillGain(this.nadagotchi.skills.navigation, 1.5);
                    break;
                case 'Archaeologist':
                    skillUp = 'research & navigation';
                    this.nadagotchi.skills.research += calculateSkillGain(this.nadagotchi.skills.research, 1.0);
                    this.nadagotchi.skills.navigation += calculateSkillGain(this.nadagotchi.skills.navigation, 1.0);
                    break;
                case 'Healer':
                    skillUp = 'empathy';
                    this.nadagotchi.skills.empathy += calculateSkillGain(this.nadagotchi.skills.empathy, 1.5);
                    break;
                case 'Artisan':
                    skillUp = 'crafting';
                    this.nadagotchi.skills.crafting += calculateSkillGain(this.nadagotchi.skills.crafting, 1.5);
                    if (data.craftedItem) {
                        this.nadagotchi.handleAction(EventKeys.CRAFT_ITEM, data.craftedItem);
                    }
                    break;
            }
            this.nadagotchi.addJournalEntry(`I had a successful day at my ${data.career} job! My ${skillUp} skill increased.`);
        } else {
            this.nadagotchi.stats.happiness -= 10;
            this.nadagotchi.addJournalEntry(`I struggled at my ${data.career} job today. It was frustrating.`);
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
     * Procedurally draws the sky gradient and stars to a dynamic texture based on the time of day.
     */
    drawSky() {
        if (!this.skyTexture || !this.skyTexture.context) return;
        const daylightFactor = this.worldClock.getDaylightFactor();
        const nightTop = new Phaser.Display.Color(0, 0, 51);
        const nightBottom = new Phaser.Display.Color(0, 0, 0);
        const dawnTop = new Phaser.Display.Color(255, 153, 102);
        const dawnBottom = new Phaser.Display.Color(255, 204, 153);
        const dayTop = new Phaser.Display.Color(135, 206, 235);
        const dayBottom = new Phaser.Display.Color(173, 216, 230);

        let topColor, bottomColor;
        const period = this.worldClock.getCurrentPeriod();
        if (period === 'Dawn') {
            topColor = Phaser.Display.Color.Interpolate.ColorWithColor(nightTop, dawnTop, 1, daylightFactor);
            bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(nightBottom, dawnBottom, 1, daylightFactor);
        } else if (period === 'Dusk') {
            topColor = Phaser.Display.Color.Interpolate.ColorWithColor(dawnTop, nightTop, 1, 1 - daylightFactor);
            bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(dawnBottom, nightBottom, 1, 1 - daylightFactor);
        } else {
            topColor = (daylightFactor === 1) ? dayTop : nightTop;
            bottomColor = (daylightFactor === 1) ? dayBottom : nightBottom;
        }

        // Use the current size of the texture which matches the game viewport
        const width = this.skyTexture.width;
        const height = this.skyTexture.height;

        this.skyTexture.clear();
        const gradient = this.skyTexture.context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgba(${topColor.r}, ${topColor.g}, ${topColor.b}, 1)`);
        gradient.addColorStop(1, `rgba(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b}, 1)`);
        this.skyTexture.context.fillStyle = gradient;
        this.skyTexture.context.fillRect(0, 0, width, height);

        if (daylightFactor < 0.5) {
            this.skyTexture.context.fillStyle = `rgba(255, 255, 255, ${1 - (daylightFactor * 2)})`;
            this.stars.forEach(star => this.skyTexture.context.fillRect(star.x * width, star.y * height * 0.7, 1, 1));
        }

        this.skyTexture.refresh();
    }

    /**
     * Draws a radial gradient to a render texture to create a spotlight effect around the pet.
     */
    drawLight() {
        if (!this.lightTexture) return;
        this.lightTexture.clear();
        // Use the current size
        const width = this.lightTexture.width;
        const height = this.lightTexture.height;

        const gradient = this.lightTexture.context.createRadialGradient(this.sprite.x, this.sprite.y, 50, this.sprite.x, this.sprite.y, 150);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        this.lightTexture.context.fillStyle = gradient;
        this.lightTexture.context.fillRect(0, 0, width, height);
        this.lightTexture.refresh();
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
        // Reserve bottom 25% for the UI Shell (matches UIScene layout)
        const dashboardHeight = Math.floor(height * 0.25);
        const gameHeight = height - dashboardHeight;

        // Resize the Main Camera to only render in the top portion
        this.cameras.main.setSize(width, gameHeight);
        this.cameras.main.setViewport(0, 0, width, gameHeight);

        // Update elements to fit within the new gameHeight
        this.sprite.setPosition(width / 2, gameHeight / 2);

        // Resize dynamic textures to match the game view
        if (this.lightTexture) this.lightTexture.setSize(width, gameHeight);
        if (this.skyTexture) this.skyTexture.setSize(width, gameHeight);

        // Redraw Ground relative to new gameHeight
        if (this.ground) {
             this.ground.clear();
             this.ground.fillStyle(0x228B22, 1);
             this.ground.fillRect(0, gameHeight - 100, width, 100);
        }

        // Reposition Interactive Objects relative to new gameHeight
        if (this.craftingTable) this.craftingTable.setPosition(80, gameHeight - 150);
        if (this.npcScout) this.npcScout.setPosition(width - 150, gameHeight - 150);
        if (this.npcVillager) this.npcVillager.setPosition(150, gameHeight / 2);

        // Update Plant/Bookshelf (pinned to top/corners, mostly fine but check X)
        if (this.plant) this.plant.setPosition(width - 80, 80);

        // Update Date Text
        this.dateText.setPosition(width - 10, 10);

        this.drawSky();
        this.drawLight();
    }

    /**
     * Updates the text object that displays the current in-game date and any active events.
     */
    updateDateText() {
        const date = this.calendar.getDate();
        const activeEvent = this.eventManager.getActiveEvent();
        let text = `${date.season}, Day ${date.day}`;
        if (activeEvent) text += `\nEvent: ${activeEvent.description}`;
        this.dateText.setText(text);
    }

    /**
     * Checks if a career has just been unlocked and displays a temporary visual notification.
     */
    checkCareerUnlock() {
        if (this.nadagotchi.newCareerUnlocked && !this.careerUnlockedNotified) {
            this.careerUnlockedNotified = true;
            // Center in game view
            const gameHeight = this.cameras.main.height;
            const notificationText = this.add.text(this.cameras.main.width / 2, gameHeight / 2 - 50, `Career Unlocked: ${this.nadagotchi.newCareerUnlocked}!`,
                { fontFamily: 'VT323, Arial', fontSize: '24px', color: '#FFD700', backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 15, y: 10 } }
            ).setOrigin(0.5);

            this.tweens.add({ targets: notificationText, alpha: { from: 0, to: 1 }, duration: 500, yoyo: true, hold: 2500, onComplete: () => notificationText.destroy() });
            this.nadagotchi.newCareerUnlocked = null; // Clear the flag in the 'brain'
        }
    }

    /**
     * Updates the pet's sprite frame to reflect its current mood.
     */
    updateSpriteMood() {
        const moodMap = { 'happy': 0, 'neutral': 1, 'sad': 2, 'angry': 3 };
        this.sprite.setFrame(moodMap[this.nadagotchi.mood] ?? 1);
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
     * Toggles placement mode for furniture items.
     * @param {?string} item - The name of the item to place, or null to exit placement mode.
     */
    togglePlacementMode(item) {
        this.isPlacementMode = !this.isPlacementMode;
        this.selectedFurniture = this.isPlacementMode ? item : null;

        if (this.isPlacementMode) {
            this.placementIndicator = this.add.graphics();
            this.placementIndicator.lineStyle(2, 0xff0000, 1);
            this.placementIndicator.strokeRect(0, 0, 64, 64);
            this.input.on('pointermove', (pointer) => {
                this.placementIndicator.setPosition(pointer.x - 32, pointer.y - 32);
            });
            this.input.on('pointerdown', (pointer) => {
                this.game.events.emit(EventKeys.UI_ACTION, EventKeys.PLACE_FURNITURE, { x: pointer.x, y: pointer.y });
            });
        } else {
            if (this.placementIndicator) {
                this.placementIndicator.destroy();
                this.placementIndicator = null;
            }
            this.input.off('pointermove');
            this.input.off('pointerdown');
        }
    }

    /**
     * Places the selected furniture item at the specified coordinates.
     * @param {number} x - The x-coordinate for the furniture.
     * @param {number} y - The y-coordinate for the furniture.
     */
    placeFurniture(x, y) {
        if (!this.isPlacementMode || !this.selectedFurniture) return;

        if (this.nadagotchi.placeItem(this.selectedFurniture)) {
            const furnitureKey = this.selectedFurniture.toLowerCase().replace(' ', '_');
            const newFurniture = this.add.sprite(x, y, furnitureKey).setInteractive({ useHandCursor: true });
            newFurniture.on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, `INTERACT_${this.selectedFurniture.toUpperCase().replace(' ', '_')}`));

            this.placedFurniture.push({ key: this.selectedFurniture, x: x, y: y });
            this.saveFurniture();

            this.togglePlacementMode(null);
        } else {
            this.togglePlacementMode(null);
        }
    }

    /**
     * Persists the placed furniture data.
     */
    saveFurniture() {
        this.persistence.saveFurniture(this.placedFurniture);
    }

    /**
     * Loads and renders previously placed furniture.
     */
    loadFurniture() {
        this.placedFurniture = this.persistence.loadFurniture() || [];
        this.placedFurniture.forEach(furniture => {
            const furnitureKey = furniture.key.toLowerCase().replace(' ', '_');
            const newFurniture = this.add.sprite(furniture.x, furniture.y, furnitureKey).setInteractive({ useHandCursor: true });
            newFurniture.on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, `INTERACT_${furniture.key.toUpperCase().replace(' ', '_')}`));
        });
    }
}
