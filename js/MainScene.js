/**
 * MainScene is the primary Phaser Scene for the Nadagotchi game.
 * It handles the visual representation of the pet and the core game logic.
 * All UI elements have been refactored into the parallel UIScene.
 */
class MainScene extends Phaser.Scene {
    constructor() {
        // The key 'MainScene' is used to identify this scene.
        super({ key: 'MainScene' });
    }

    /**
     * The `preload` method is a Phaser lifecycle method called once, before the scene is created.
     * It's used to load all necessary assets like images, spritesheets, and audio.
     */
    preload() {
        // --- Load New Pet Art ---
        // Load the new 16x16 pixel art spritesheet for the pet.
        // Using a placeholder for now as per user's request.
        this.load.spritesheet('pet', 'https://placehold.co/64x16/000000/ffffff.png?text=^_^', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Load the image for the thought bubble, which indicates a proactive behavior.
        this.load.image('thought_bubble', 'https://placehold.co/32x32/ffffff/000000.png?text=!');
        // Load a new icon for the "explore" hint. The text is a unicode magnifying glass.
        this.load.image('explore_bubble', 'https://placehold.co/32x32/ffffff/000000.png?text=🔎');

        this.load.image('pixel', 'https://placehold.co/1x1/ffffff/ffffff.png');
        // --- Load Interactive Environment Objects ---
        this.load.image('bookshelf', 'https://placehold.co/64x64/8B4513/ffffff.png?text=Books');
        this.load.image('plant', 'https://placehold.co/64x64/228B22/ffffff.png?text=Plant');

        // --- New Subsystem Assets ---
        this.load.image('crafting_table', 'https://placehold.co/64x64/A0522D/ffffff.png?text=Craft');
    }

    /**
     * The `create` method is a Phaser lifecycle method called once, after `preload`.
     * It sets up game objects, launches the UI scene, and registers event listeners.
     */
    create(data) {
        // --- Layer 1: Sky (Dynamic Texture) ---
        this.skyTexture = this.textures.addDynamicTexture('sky', this.cameras.main.width, this.cameras.main.height);
        this.add.image(0, 0, 'sky').setOrigin(0);

        // --- Layer 2: Environment ---
        const groundHeight = 100;
        const ground = this.add.graphics();
        ground.fillStyle(0x228B22, 1); // ForestGreen
        ground.fillRect(0, this.cameras.main.height - groundHeight, this.cameras.main.width, groundHeight);

        // --- Layer 3: Weather Effects ---
        this.rainEmitter = this.add.particles('pixel').createEmitter({
            x: { min: 0, max: this.cameras.main.width },
            y: 0,
            lifespan: 2000,
            speedY: { min: 200, max: 400 },
            scale: { start: 0.2, end: 0 },
            quantity: 2,
            blendMode: 'ADD',
            on: false // Start inactive
        });
        this.rainEmitter.setTint(0xADD8E6); // Light blue tint


        // --- Initialize Persistence & Load/Create Pet ---
        this.persistence = new PersistenceManager();

        if (data && data.newPetData) {
            this.nadagotchi = new Nadagotchi(data.newPetData.archetype, data.newPetData);
            this.persistence.savePet(this.nadagotchi);
        } else {
            const loadedPet = this.persistence.loadPet();
            if (loadedPet) {
                this.nadagotchi = new Nadagotchi(loadedPet.archetype, loadedPet);
            } else {
                this.nadagotchi = new Nadagotchi('Adventurer');
                this.persistence.savePet(this.nadagotchi);
            }
        }

        // --- Initialize World Systems ---
        this.worldClock = new WorldClock(this);
        this.weatherSystem = new WeatherSystem(this);

        // --- World State Initialization ---
        this.worldState = {
            time: this.worldClock.getCurrentPeriod(),
            weather: this.weatherSystem.getCurrentWeather()
        };

        // For drawing stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({ x: Math.random(), y: Math.random() });
        }


        // --- Layer 4: The Pet ---
        this.sprite = this.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pet').setScale(4);
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false);
        this.exploreBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'explore_bubble').setVisible(false);

        // --- Interactive Environment ---
        const bookshelf = this.add.sprite(80, 80, 'bookshelf').setInteractive({ useHandCursor: true });
        bookshelf.on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_BOOKSHELF'));

        const plant = this.add.sprite(this.cameras.main.width - 80, 80, 'plant').setInteractive({ useHandCursor: true });
        plant.on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_PLANT'));

        // --- New Subsystem Interactables ---
        const craftingTable = this.add.sprite(80, this.cameras.main.height - 150, 'crafting_table').setInteractive({ useHandCursor: true });
        craftingTable.on('pointerdown', () => this.game.events.emit('uiAction', 'OPEN_CRAFTING_MENU'));

        const npc = this.add.graphics();
        npc.fillStyle(0xffff00, 1);
        npc.fillCircle(this.cameras.main.width - 80, this.cameras.main.height - 150, 30);
        npc.setInteractive(new Phaser.Geom.Circle(this.cameras.main.width - 80, this.cameras.main.height - 150, 30), Phaser.Geom.Circle.Contains);
        npc.on('pointerdown', () => this.game.events.emit('uiAction', 'INTERACT_NPC'));


        // --- Layer 5: Lighting & Post-FX (Added After Pet) ---
        this.lightTexture = this.add.renderTexture(0, 0, this.cameras.main.width, this.cameras.main.height).setVisible(false);
        this.lightTexture.setBlendMode('MULTIPLY');

        // --- Launch UI ---
        this.scene.launch('UIScene');

        // --- Event Listeners for World Systems ---
        this.game.events.on('weatherChanged', (newWeather) => {
            this.worldState.weather = newWeather;
            this.updateWorldVisuals();
        }, this);


        // --- Auto-Save Timer ---
        this.time.addEvent({
            delay: 5000,
            callback: () => this.persistence.savePet(this.nadagotchi),
            loop: true
        });

        // --- Event Listeners ---
        this.game.events.on('uiAction', (actionType) => {
            this.nadagotchi.handleAction(actionType);
        }, this);

        this.game.events.on('workResult', (data) => {
            if (data.success) {
                // Apply a reward based on the career
                if (data.career === 'Innovator') {
                    this.nadagotchi.skills.logic += 1.5; // Significant skill boost
                    this.nadagotchi.stats.happiness += 25;
                    this.nadagotchi.addJournalEntry("I solved a complex puzzle at work today!");
                }
            } else {
                this.nadagotchi.stats.happiness -= 10;
                this.nadagotchi.addJournalEntry("I struggled with a puzzle at work. It was frustrating.");
            }
        });

        // --- Resize Event Listener ---
        this.scale.on('resize', this.resize, this);

        // Perform initial resize to ensure everything is positioned correctly from the start.
        // This is done last to ensure all objects it might manipulate have been created.
        this.resize({ width: this.scale.width, height: this.scale.height });
        this.drawSky(); // Initial sky draw
    }

    /**
     * Procedurally draws the sky, interpolating colors for smooth transitions.
     */
    drawSky() {
        const daylightFactor = this.worldClock.getDaylightFactor();

        // Define the sky colors for different times of day
        const nightTop = new Phaser.Display.Color(0, 0, 51);
        const nightBottom = new Phaser.Display.Color(0, 0, 0);
        const dawnTop = new Phaser.Display.Color(255, 153, 102);
        const dawnBottom = new Phaser.Display.Color(255, 204, 153);
        const dayTop = new Phaser.Display.Color(135, 206, 235);
        const dayBottom = new Phaser.Display.Color(173, 216, 230);

        let topColor, bottomColor;

        if (this.worldClock.getCurrentPeriod() === 'Dawn') {
            topColor = Phaser.Display.Color.Interpolate.ColorWithColor(nightTop, dawnTop, 1, daylightFactor);
            bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(nightBottom, dawnBottom, 1, daylightFactor);
        } else if (this.worldClock.getCurrentPeriod() === 'Dusk') {
            topColor = Phaser.Display.Color.Interpolate.ColorWithColor(dawnTop, nightTop, 1, 1 - daylightFactor);
            bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(dawnBottom, nightBottom, 1, 1 - daylightFactor);
        } else if (daylightFactor === 1) { // Day
            topColor = dayTop;
            bottomColor = dayBottom;
        } else { // Night
            topColor = nightTop;
            bottomColor = nightBottom;
        }

        this.skyTexture.clear();
        const gradient = this.skyTexture.context.createLinearGradient(0, 0, 0, this.cameras.main.height);
        gradient.addColorStop(0, `rgba(${topColor.r}, ${topColor.g}, ${topColor.b}, 1)`);
        gradient.addColorStop(1, `rgba(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b}, 1)`);
        this.skyTexture.context.fillStyle = gradient;
        this.skyTexture.context.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Draw stars at night
        if (daylightFactor < 0.5) {
            this.skyTexture.context.fillStyle = `rgba(255, 255, 255, ${1 - (daylightFactor * 2)})`;
            this.stars.forEach(star => {
                this.skyTexture.context.fillRect(star.x * this.cameras.main.width, star.y * this.cameras.main.height * 0.7, 1, 1);
            });
        }

        this.skyTexture.refresh();
    }

    /**
     * Draws the lighting effect to the render texture.
     */
    drawLight() {
        this.lightTexture.clear(); // Clear the previous frame

        // Create a radial gradient centered on the pet
        const gradient = this.lightTexture.context.createRadialGradient(
            this.sprite.x, this.sprite.y, 50, // Inner circle radius (brightest area)
            this.sprite.x, this.sprite.y, 150  // Outer circle radius (falloff)
        );

        // The center of the light is white (no change with MULTIPLY)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        // The edge of the light is black (full darkness with MULTIPLY)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

        // Fill the entire texture with this gradient
        this.lightTexture.context.fillStyle = gradient;
        this.lightTexture.context.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Tell the texture to update
        this.lightTexture.refresh();
    }

    /**
     * The `update` method is the core of the game loop.
     * It updates the game state and emits data for the UI to display.
     * @param {number} time - The current time in milliseconds.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        // 1. Update the world clock
        this.worldClock.update(delta);

        // 2. Update the world state from the systems
        this.worldState.time = this.worldClock.getCurrentPeriod();

        // 3. Redraw the dynamic sky for smooth transitions
        this.drawSky();

        // 3. Tell the Nadagotchi brain to process the passage of time
        this.nadagotchi.live(this.worldState);

        // 4. Emit an event with the latest Nadagotchi data for the UI to update.
        this.game.events.emit('updateStats', this.nadagotchi);

        // 5. Update the pet's visual appearance based on its mood.
        this.updateSpriteMood();

        // 6. Check if the pet should perform a spontaneous, "proactive" action.
        this.checkProactiveBehaviors();

        // 7. Check for and handle the one-time event of unlocking a career.
        this.checkCareerUnlock();

        // 8. Update lighting based on the time of day
        if (this.worldState.time === "Night" || this.worldState.time === "Dusk") {
            this.drawLight();
        }
    }

    /**
     * Handles window resize events to keep game elements centered.
     * @param {object} gameSize - The new size of the game window.
     */
    resize(gameSize) {
        const { width, height } = gameSize;
        this.cameras.main.setSize(width, height);
        this.sprite.setPosition(width / 2, height / 2);
        this.lightTexture.setSize(width, height);
        this.skyTexture.setSize(width, height);
        this.drawSky(this.timeOfDay);
    }

    /**
     * Updates the scene's visuals based on the current weather and time of day.
     */
    updateWorldVisuals() {
        // Stop all emitters by default
        this.rainEmitter.stop();
        // this.snowEmitter.stop(); // Example for future expansion

        switch (this.worldState.weather) {
            case "Rainy":
                this.rainEmitter.start();
                break;
            case "Stormy":
                this.rainEmitter.setQuantity(5); // More intense rain
                this.rainEmitter.setSpeedY({ min: 300, max: 500 });
                this.rainEmitter.start();
                // Add lightning flashes here in the future
                break;
            case "Cloudy":
                // You might add a cloud layer image that moves across the screen
                break;
            case "Sunny":
                // No precipitation
                this.rainEmitter.setQuantity(2); // Reset to default
                this.rainEmitter.setSpeedY({ min: 200, max: 400 });
                break;
        }

        // Handle lighting
        if (this.worldState.time === "Night" || this.worldState.time === "Dusk") {
            this.lightTexture.setVisible(true);
        } else {
            this.lightTexture.setVisible(false);
        }
    }

    /**
     * Checks if a career has just been unlocked and displays a visual notification.
     * This is designed to only fire once per career unlock.
     */
    checkCareerUnlock() {
        // A simple flag to ensure the notification only shows once.
        // In a more complex game, this might be part of a larger event system.
        if (this.nadagotchi.currentCareer && !this.careerUnlockedNotified) {
            this.careerUnlockedNotified = true; // Set the flag

            // Create a visually distinct text notification.
            const notificationText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 50, // Position it above the pet
                `Career Unlocked: ${this.nadagotchi.currentCareer}!`,
                {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#FFD700', // Gold color for emphasis
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: { x: 15, y: 10 }
                }
            ).setOrigin(0.5); // Center the text

            // Use a tween to make the notification fade in and then out.
            this.tweens.add({
                targets: notificationText,
                alpha: { from: 0, to: 1 },
                ease: 'Linear',
                duration: 500,
                yoyo: true, // Fade back out
                hold: 2500, // Stay on screen for 2.5 seconds
                onComplete: () => {
                    notificationText.destroy(); // Clean up the text object
                }
            });
        }
    }

    /**
     * Updates the pet's sprite to reflect its current mood by changing the animation frame.
     * The frame numbers now correspond to the new 'pet' spritesheet.
     */
    updateSpriteMood() {
        // Spritesheet mapping: 0:happy, 1:neutral, 2:sad, 3:angry
        switch(this.nadagotchi.mood) {
            case 'happy':
                this.sprite.setFrame(0);
                break;
            case 'neutral':
                this.sprite.setFrame(1);
                break;
            case 'sad':
                this.sprite.setFrame(2);
                break;
            case 'angry':
                this.sprite.setFrame(3);
                break;
            default:
                this.sprite.setFrame(1); // Default to neutral
        }
    }

    /**
     * Checks if the Nadagotchi should perform a spontaneous action based on its state.
     * This is the entry point for the "proactive behavior" system.
     */
    checkProactiveBehaviors() {
        // Do nothing if any thought bubble is already visible.
        if (this.thoughtBubble.visible || this.exploreBubble.visible) return;

        // Personality hook: A happy Adventurer has a chance to want to explore.
        if (this.nadagotchi.mood === 'happy' && this.nadagotchi.dominantArchetype === 'Adventurer') {
            // This gives a 1 in 750 chance per frame for the event to trigger.
            if (Phaser.Math.Between(1, 750) === 1) {
                // Show the specific "explore" thought bubble for 2 seconds.
                this.exploreBubble.setVisible(true);
                this.time.delayedCall(2000, () => {
                    this.exploreBubble.setVisible(false);
                });
            }
        }
    }
}
