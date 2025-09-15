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
        // --- Fix for Missing Textures ---
        // Using a more reliable placeholder service (placehold.co) to prevent missing texture errors.

        // Load a placeholder spritesheet for the pet. It contains 4 frames (32x32 each).
        // Frame 0: Happy, 1: Neutral, 2: Sad, 3: Angry
        this.load.spritesheet('pet_sprites', 'https://placehold.co/128x32/000000/ffffff.png?text=Pet', { frameWidth: 32, frameHeight: 32 });

        // Load the image for the thought bubble, which indicates a proactive behavior.
        this.load.image('thought_bubble', 'https://placehold.co/32x32/ffffff/000000.png?text=!');
        // Load a new icon for the "explore" hint. The text is a unicode magnifying glass.
        this.load.image('explore_bubble', 'https://placehold.co/32x32/ffffff/000000.png?text=🔎');
    }

    /**
     * The `create` method is a Phaser lifecycle method called once, after `preload`.
     * It sets up game objects, launches the UI scene, and registers event listeners.
     */
    create() {
        // --- Initialize the Nadagotchi "Brain" ---
        // Create an instance of the Nadagotchi class, which manages all the internal logic and state.
        this.nadagotchi = new Nadagotchi('Adventurer');

        // --- Initialize Visual Elements (Non-UI) ---
        // Create the main sprite for the pet, centered on the screen.
        this.sprite = this.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pet_sprites');
        // Create the thought bubble sprite, positioned above the pet and initially hidden.
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false);
        // Create the new explore bubble sprite, also hidden initially.
        this.exploreBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'explore_bubble').setVisible(false);

        // --- Launch the UI Scene ---
        // This runs the UIScene in parallel with the MainScene.
        this.scene.launch('UIScene');

        // --- Event Listeners for UI Actions ---
        // Listen for actions dispatched from the UIScene.
        this.game.events.on('uiAction', (actionType) => {
            // When an action event is received, call the Nadagotchi's handler.
            this.nadagotchi.handleAction(actionType);
        }, this);
    }

    /**
     * The `update` method is the core of the game loop.
     * It updates the game state and emits data for the UI to display.
     * @param {number} time - The current time in milliseconds.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        // 1. Tell the Nadagotchi brain to process the passage of time.
        this.nadagotchi.live();

        // 2. Emit an event with the latest Nadagotchi data for the UI to update.
        this.game.events.emit('updateStats', this.nadagotchi);

        // 3. Update the pet's visual appearance based on its mood.
        this.updateSpriteMood();

        // 4. Check if the pet should perform a spontaneous, "proactive" action.
        this.checkProactiveBehaviors();
    }

    /**
     * Updates the pet's sprite to reflect its current mood by changing the animation frame.
     */
    updateSpriteMood() {
        // The spritesheet is ordered: 0:happy, 1:neutral, 2:sad, 3:angry.
        switch(this.nadagotchi.mood) {
            case 'happy': this.sprite.setFrame(0); break;
            case 'neutral': this.sprite.setFrame(1); break;
            case 'sad': this.sprite.setFrame(2); break;
            case 'angry': this.sprite.setFrame(3); break;
            default: this.sprite.setFrame(1); // Default to neutral if mood is unrecognized.
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
