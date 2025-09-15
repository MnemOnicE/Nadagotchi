/**
 * UIScene is a dedicated Phaser Scene for managing and displaying all UI elements.
 * It runs in parallel with the MainScene and communicates with it via events.
 */
class UIScene extends Phaser.Scene {
    constructor() {
        // The key 'UIScene' is used to identify this scene.
        super({ key: 'UIScene' });
    }

    /**
     * The `create` method is a Phaser lifecycle method called once.
     * It's used to set up the initial state of the UI scene.
     */
    create() {
        // --- Store a reference to the main game scene's nadagotchi data ---
        // This is used to access data when needed, like for the Job Board.
        this.nadagotchiData = null;

        // --- Create UI Elements ---

        // Create the text object that will display the pet's stats in the top-left.
        this.statsText = this.add.text(10, 10, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' });

        // --- Create Action Buttons ---
        // The buttons are arranged along the bottom of the screen for a cleaner layout.
        const buttonY = this.cameras.main.height - 40;
        const buttonSpacing = 70;

        // Create a 'Feed' button.
        const feedButton = this.add.text(10, buttonY, 'Feed', { padding: { x: 10, y: 5 }, backgroundColor: '#008800' }).setInteractive();
        feedButton.on('pointerdown', () => this.game.events.emit('uiAction', 'FEED'));

        // Create a 'Play' button.
        const playButton = this.add.text(10 + buttonSpacing, buttonY, 'Play', { padding: { x: 10, y: 5 }, backgroundColor: '#000088' }).setInteractive();
        playButton.on('pointerdown', () => this.game.events.emit('uiAction', 'PLAY'));

        // Create a 'Study' button.
        const studyButton = this.add.text(10 + buttonSpacing * 2, buttonY, 'Study', { padding: { x: 10, y: 5 }, backgroundColor: '#880000' }).setInteractive();
        studyButton.on('pointerdown', () => this.game.events.emit('uiAction', 'STUDY'));

        // Create an 'Explore' button.
        const exploreButton = this.add.text(10 + buttonSpacing * 3, buttonY, 'Explore', { padding: { x: 10, y: 5 }, backgroundColor: '#aaaa00' }).setInteractive();
        exploreButton.on('pointerdown', () => this.game.events.emit('uiAction', 'EXPLORE'));

        // --- Initialize Job Board ---
        /**
         * @type {Phaser.GameObjects.Text} - The interactive text object for the Job Board.
         * @private
         */
        this.jobBoardButton = this.add.text(
            this.cameras.main.width - 120, // Position in the top-right
            10,
            'Job Board',
            { padding: { x: 10, y: 5 }, backgroundColor: '#6A0DAD' }
        );
        // Initially disabled.
        this.jobBoardButton.setInteractive(false).setAlpha(0.5);
        this.jobBoardButton.on('pointerdown', () => this.openJobBoard());

        // --- Event Listeners ---
        // Set up a listener for the 'updateStats' event from the MainScene.
        this.game.events.on('updateStats', this.updateStatsUI, this);
    }

    /**
     * Updates all UI elements with the latest data from the Nadagotchi.
     * This method is called by the 'updateStats' event from the MainScene.
     * @param {object} data - The entire Nadagotchi object, containing stats, skills, mood, etc.
     */
    updateStatsUI(data) {
        // Store the latest data for other methods to use.
        this.nadagotchiData = data;

        const stats = data.stats;
        const skills = data.skills;
        // Format the text string with the latest data.
        const text = `Archetype: ${data.dominantArchetype}\n` +
                     `Mood: ${data.mood}\n` +
                     `Career: ${data.currentCareer || 'None'}\n` +
                     `Hunger: ${Math.floor(stats.hunger)}\n` +
                     `Energy: ${Math.floor(stats.energy)}\n` +
                     `Happiness: ${Math.floor(stats.happiness)}\n` +
                     `Logic Skill: ${skills.logic.toFixed(2)}`;
        this.statsText.setText(text);

        // --- Job Board Activation Logic ---
        // If the Nadagotchi has a career and the job board is currently inactive, enable it.
        if (data.currentCareer && !this.jobBoardButton.input.enabled) {
            this.jobBoardButton.setInteractive(true);
            this.jobBoardButton.setAlpha(1.0);
        }
    }

    /**
     * Handles the logic when the "Job Board" button is clicked.
     * It checks the Nadagotchi's current career and provides a corresponding job.
     */
    openJobBoard() {
        if (!this.nadagotchiData) return; // Guard against no data

        // Use a switch statement to handle different jobs for different careers.
        switch(this.nadagotchiData.currentCareer) {
            case 'Innovator':
                console.log("Job Available: Design a New Gadget!");
                break;
            default:
                console.log("No jobs available for your current career.");
                break;
        }
    }
}
