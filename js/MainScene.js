/**
 * @class MainScene
 * @extends Phaser.Scene
 * @classdesc
 * MainScene is the primary Phaser Scene for the Nadagotchi game.
 * It handles the visual representation of the pet, the environment, and core game logic loops.
 * It works in conjunction with UIScene, which handles all user interface elements.
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.isPlacementMode = false;
        this.selectedFurniture = null;
        this.placedFurniture = [];
    }

    /**
     * Phaser lifecycle method called once, before the scene is created.
     * Used to load all necessary assets like images, spritesheets, and audio.
     */
    preload() {
        this.load.spritesheet('pet', 'https://placehold.co/64x16/000000/ffffff.png?text=^_^', { frameWidth: 16, frameHeight: 16 });
        this.load.image('thought_bubble', 'https://placehold.co/32x32/ffffff/000000.png?text=!');
        this.load.image('explore_bubble', 'https://placehold.co/32x32/ffffff/000000.png?text=🔎');
        this.load.image('pixel', 'https://placehold.co/1x1/ffffff/ffffff.png');
        this.load.image('bookshelf', 'https://placehold.co/64x64/8B4513/ffffff.png?text=Books');
        this.load.image('fancy_bookshelf', 'https://placehold.co/64x64/D2691E/ffffff.png?text=Fancy+Books');
        this.load.image('plant', 'https://placehold.co/64x64/228B22/ffffff.png?text=Plant');
        this.load.image('crafting_table', 'https://placehold.co/64x64/A0522D/ffffff.png?text=Craft');
        this.load.image('npc_scout', 'https://placehold.co/48x48/704214/ffffff.png?text=Scout');
        this.load.image('npc_artisan', 'https://placehold.co/48x48/4682B4/ffffff.png?text=Artisan');
        this.load.image('npc_villager', 'https://placehold.co/48x48/6B8E23/ffffff.png?text=Villager');
    }

    /**
     * Phaser lifecycle method called once, after `preload`.
     * Sets up game objects, initializes systems, launches the UI scene, and registers event listeners.
     * @param {object} [data] - Optional data object passed from another scene.
     * @param {object} [data.newPetData] - Data for creating a new pet, typically from the BreedingScene.
     */
    create(data) {
        // --- Environment Setup ---
        // Initialize textures with full size initially; resize will adjust them
        this.skyTexture = this.textures.createCanvas('sky', this.scale.width, this.scale.height);
        this.add.image(0, 0, 'sky').setOrigin(0);

        this.ground = this.add.graphics();
        // Drawing handled in resize

        // --- Pet Initialization ---
        this.persistence = new PersistenceManager();
        const loadedPet = this.persistence.loadPet();
        this.nadagotchi = (data && data.newPetData)
            ? new Nadagotchi(data.newPetData.dominantArchetype, data.newPetData)
            : new Nadagotchi('Adventurer', loadedPet);
        if (!loadedPet && !(data && data.newPetData)) this.persistence.savePet(this.nadagotchi);


        // --- World Systems Initialization ---
        const loadedCalendar = this.persistence.loadCalendar();
        this.calendar = new Calendar(loadedCalendar);
        this.eventManager = new EventManager(this.calendar);
        this.worldClock = new WorldClock(this);
        this.weatherSystem = new WeatherSystem(this);

        this.worldState = {
            time: this.worldClock.getCurrentPeriod(),
            weather: this.weatherSystem.getCurrentWeather(),
            activeEvent: this.eventManager.getActiveEvent()
        };

        this.stars = Array.from({ length: 100 }, () => ({ x: Math.random(), y: Math.random() }));

        // --- Game Objects ---
        this.sprite = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'pet').setScale(4);
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false);
        this.exploreBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'explore_bubble').setVisible(false);

        // --- Interactive Objects ---
        // Initial positions; will be updated in resize
        this.bookshelf = this.add.sprite(80, 80, 'bookshelf').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_BOOKSHELF'));
        this.plant = this.add.sprite(this.scale.width - 80, 80, 'plant').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_PLANT'));
        this.craftingTable = this.add.sprite(80, this.scale.height - 150, 'crafting_table').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit('uiAction', 'OPEN_CRAFTING_MENU'));

        // Add NPCs to the scene
        this.npcScout = this.add.sprite(this.scale.width - 150, this.scale.height - 150, 'npc_scout').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_SCOUT', 'Grizzled Scout'));
        this.npcArtisan = this.add.sprite(this.scale.width / 2 + 100, 80, 'npc_artisan').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_ARTISAN', 'Master Artisan'));
        this.npcVillager = this.add.sprite(150, this.scale.height / 2, 'npc_villager').setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_VILLAGER', 'Sickly Villager'));

        // --- Post-FX & UI ---
        this.lightTexture = this.add.renderTexture(0, 0, this.scale.width, this.scale.height).setBlendMode('MULTIPLY').setVisible(false);
        // FIX: Moved dateText to the top-right corner (origin 1,0) to avoid overlap with stats
        this.dateText = this.add.text(this.scale.width - 10, 10, '', { fontFamily: 'VT323, Arial', fontSize: '20px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 5, y: 3 } }).setOrigin(1, 0);
        this.scene.launch('UIScene');

        // --- Timers and Event Listeners ---
        this.time.addEvent({ delay: 5000, callback: () => this.persistence.savePet(this.nadagotchi), loop: true });
        this.game.events.on('uiAction', this.handleUIAction, this);
        this.game.events.on('workResult', this.handleWorkResult, this);
        this.scale.on('resize', this.resize, this);

        // --- Final Setup ---
        this.resize({ width: this.scale.width, height: this.scale.height });
        this.updateDateText();
        this.drawSky();
        this.loadFurniture();
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
        this.drawSky();

        this.nadagotchi.live(this.worldState);
        this.game.events.emit('updateStats', this.nadagotchi);

        this.updateSpriteMood();
        this.checkProactiveBehaviors();
        this.checkCareerUnlock();

        if (this.worldState.time === "Night" || this.worldState.time === "Dusk") {
            this.drawLight();
            this.lightTexture.setVisible(true);
        } else {
            this.lightTexture.setVisible(false);
        }
    }

    /**
     * Handles actions dispatched from the UIScene.
     * @param {string} actionType - The type of action to handle (e.g., 'FEED', 'WORK', 'RETIRE').
     * @param {any} [data] - Optional data associated with the action.
     */
    handleUIAction(actionType, data) {
        if (this.isPlacementMode && actionType !== 'PLACE_FURNITURE') {
            this.togglePlacementMode(null); // Exit placement mode if another action is taken
        }

        // FIX: Merged duplicate handleUIAction definitions and unified logic
        switch (actionType) {
            case 'WORK':
                this.startWorkMinigame();
                break;
            case 'RETIRE':
                this.scene.stop('UIScene');
                this.scene.start('BreedingScene', this.nadagotchi);
                break;
            case 'DECORATE':
                this.togglePlacementMode(data);
                break;
            case 'PLACE_FURNITURE':
                this.placeFurniture(data.x, data.y);
                break;
            case 'INTERACT_SCOUT':
                this.nadagotchi.interact('Grizzled Scout');
                break;
            case 'INTERACT_ARTISAN':
                this.nadagotchi.interact('Master Artisan');
                break;
            case 'INTERACT_VILLAGER':
                this.nadagotchi.interact('Sickly Villager');
                break;
            case 'INTERACT_BOOKSHELF':
            case 'INTERACT_PLANT':
            case 'OPEN_CRAFTING_MENU':
                // These specific cases fall through to default handler or are handled by sprite events directly emitting specific actions
                this.nadagotchi.handleAction(actionType, data);
                break;
            default:
                this.nadagotchi.handleAction(actionType, data);
                break;
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
        let skillUp = '';
        if (data.success) {
            this.nadagotchi.stats.happiness += 25;
            switch (data.career) {
                case 'Innovator': skillUp = 'logic'; this.nadagotchi.skills.logic += 1.5; break;
                case 'Scout': skillUp = 'navigation'; this.nadagotchi.skills.navigation += 1.5; break;
                case 'Healer': skillUp = 'empathy'; this.nadagotchi.skills.empathy += 1.5; break;
                case 'Artisan':
                    skillUp = 'crafting';
                    this.nadagotchi.skills.crafting += 1.5;
                    if (data.craftedItem) {
                        this.nadagotchi.handleAction('CRAFT_ITEM', data.craftedItem);
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
            'Innovator': 'LogicPuzzleScene',
            'Scout': 'ScoutMinigameScene',
            'Healer': 'HealerMinigameScene',
            'Artisan': 'ArtisanMinigameScene'
        };
        const sceneKey = careerToSceneMap[this.nadagotchi.currentCareer];
        if (sceneKey) {
            this.scene.pause();
            this.scene.launch(sceneKey);
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
                this.game.events.emit('uiAction', 'PLACE_FURNITURE', { x: pointer.x, y: pointer.y });
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

    placeFurniture(x, y) {
        if (!this.isPlacementMode || !this.selectedFurniture) return;

        const furnitureKey = this.selectedFurniture.toLowerCase().replace(' ', '_');
        const newFurniture = this.add.sprite(x, y, furnitureKey).setInteractive({ useHandCursor: true });
        newFurniture.on('pointerdown', () => this.game.events.emit('uiAction', `INTERACT_${this.selectedFurniture.toUpperCase().replace(' ', '_')}`));

        this.placedFurniture.push({ key: this.selectedFurniture, x: x, y: y });
        this.saveFurniture();

        this.togglePlacementMode(null);
    }

    saveFurniture() {
        this.persistence.saveFurniture(this.placedFurniture);
    }

    loadFurniture() {
        this.placedFurniture = this.persistence.loadFurniture() || [];
        this.placedFurniture.forEach(furniture => {
            const furnitureKey = furniture.key.toLowerCase().replace(' ', '_');
            const newFurniture = this.add.sprite(furniture.x, furniture.y, furnitureKey).setInteractive({ useHandCursor: true });
            newFurniture.on('pointerdown', () => this.game.events.emit('uiAction', `INTERACT_${furniture.key.toUpperCase().replace(' ', '_')}`));
        });
    }
}
