/**
 * MainScene is the primary Phaser Scene for the Nadagotchi game.
 * It handles the visual representation of the pet, the UI, and player input.
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
        // Load a placeholder spritesheet for the pet. It contains 4 frames (32x32 each).
        // Frame 0: Happy, 1: Neutral, 2: Sad, 3: Angry
        this.load.spritesheet('pet_sprites', 'https://via.placeholder.com/128x32', { frameWidth: 32, frameHeight: 32 });

        // Load the image for the thought bubble, which indicates a proactive behavior.
        this.load.image('thought_bubble', 'https://via.placeholder.com/32x32/ffffff/000000.png?text=!');
        // Load a new icon for the "explore" hint. The text is a unicode magnifying glass.
        this.load.image('explore_bubble', 'https://via.placeholder.com/32x32/ffffff/000000.png?text=🔎');
    }

    /**
     * The `create` method is a Phaser lifecycle method called once, after `preload`.
     * It's used to set up the initial state of the scene, like creating game objects and UI elements.
     */
    create() {
        // --- Initialize the Nadagotchi "Brain" ---
        // Create an instance of the Nadagotchi class, which manages all the internal logic and state.
        // We start with the 'Adventurer' archetype for this demo.
        this.nadagotchi = new Nadagotchi('Adventurer');

        // --- Initialize Visual Elements ---
        // Create the main sprite for the pet, centered on the screen.
        this.sprite = this.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pet_sprites');
        // Create the thought bubble sprite, positioned above the pet and initially hidden.
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false);
        // Create the new explore bubble sprite, also hidden initially.
        this.exploreBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'explore_bubble').setVisible(false);
        // Create the text object that will display the pet's stats.
        this.statsText = this.add.text(10, 10, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' });

        // --- Initialize Action Buttons ---
        // Create a 'Feed' button.
        const feedButton = this.add.text(10, 70, 'Feed', { padding: { x: 10, y: 5 }, backgroundColor: '#008800' }).setInteractive();
        // When clicked, it calls the 'FEED' action in the Nadagotchi brain.
        feedButton.on('pointerdown', () => this.nadagotchi.handleAction('FEED'));

        // Create a 'Play' button.
        const playButton = this.add.text(80, 70, 'Play', { padding: { x: 10, y: 5 }, backgroundColor: '#000088' }).setInteractive();
        // When clicked, it calls the 'PLAY' action.
        playButton.on('pointerdown', () => this.nadagotchi.handleAction('PLAY'));

        // Create a 'Study' button.
        const studyButton = this.add.text(150, 70, 'Study', { padding: { x: 10, y: 5 }, backgroundColor: '#880000' }).setInteractive();
        // When clicked, it calls the 'STUDY' action.
        studyButton.on('pointerdown', () => this.nadagotchi.handleAction('STUDY'));

        // Create an 'Explore' button.
        const exploreButton = this.add.text(220, 70, 'Explore', { padding: { x: 10, y: 5 }, backgroundColor: '#aaaa00' }).setInteractive();
        // When clicked, it calls the 'EXPLORE' action.
        exploreButton.on('pointerdown', () => this.nadagotchi.handleAction('EXPLORE'));

        // --- Initialize Job Board ---
        /**
         * @type {Phaser.GameObjects.Text} - The interactive text object for the Job Board.
         * It starts as disabled and becomes active only when the Nadagotchi has a career.
         * @private
         */
        this.jobBoardButton = this.add.text(
            this.cameras.main.width - 120, // Position from the right edge
            this.cameras.main.height - 50, // Position from the bottom edge
            'Job Board',
            { padding: { x: 10, y: 5 }, backgroundColor: '#6A0DAD' } // Distinct purple color
        );

        // Initially disabled. It will be enabled when a career is unlocked.
        this.jobBoardButton.setInteractive(false).setAlpha(0.5);

        // Set the event listener for when the button is clicked.
        this.jobBoardButton.on('pointerdown', () => this.openJobBoard());
    }

    /**
     * The `update` method is a Phaser lifecycle method that is called every frame.
     * It's the core of the game loop, used for continuous updates, checks, and animations.
     * @param {number} time - The current time in milliseconds.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        // 1. Tell the Nadagotchi brain to process the passage of time (e.g., stat decay).
        this.nadagotchi.live();
        // 2. Refresh the on-screen stat display.
        this.updateStatsUI();
        // 3. Update the pet's visual appearance based on its mood.
        this.updateSpriteMood();
        // 4. Check if the pet should perform a spontaneous, "proactive" action.
        this.checkProactiveBehaviors();

        // --- Job Board Activation Logic ---
        // If the Nadagotchi has a career and the job board is currently inactive, enable it.
        // This check runs continuously, but the state change only happens once.
        if (this.nadagotchi.currentCareer && !this.jobBoardButton.input.enabled) {
            this.jobBoardButton.setInteractive(true); // Enable clicks.
            this.jobBoardButton.setAlpha(1.0);       // Make it fully opaque.
        }
    }

    // --- UI Update Methods ---

    /**
     * Updates the text element that displays the Nadagotchi's current stats and mood.
     */
    updateStatsUI() {
        const stats = this.nadagotchi.stats;
        const skills = this.nadagotchi.skills;
        // Format the text string with the latest data from the Nadagotchi object.
        const text = `Archetype: ${this.nadagotchi.dominantArchetype}\n` +
                     `Mood: ${this.nadagotchi.mood}\n` +
                     `Career: ${this.nadagotchi.currentCareer || 'None'}\n` + // Display career
                     `Hunger: ${Math.floor(stats.hunger)}\n` +
                     `Energy: ${Math.floor(stats.energy)}\n` +
                     `Happiness: ${Math.floor(stats.happiness)}\n` +
                     `Logic Skill: ${skills.logic.toFixed(2)}`;
        this.statsText.setText(text);
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

    // --- Career and Job Methods ---

    /**
     * Handles the logic when the "Job Board" button is clicked.
     * It checks the Nadagotchi's current career and provides a corresponding
     * "job" or action, which for now is just a console log message.
     * This method is designed to be easily expandable as new careers are added.
     */
    openJobBoard() {
        // Use a switch statement to handle different jobs for different careers.
        switch(this.nadagotchi.currentCareer) {
            case 'Innovator':
                // The job for the Innovator career.
                console.log("Job Available: Design a New Gadget!");
                break;
            default:
                // A fallback message if the career has no specific job assigned yet.
                console.log("No jobs available for your current career.");
                break;
        }
    }
}
