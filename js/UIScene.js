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
     * The `create` method is a Phaser lifecycle method called once, after `preload`.
     * It's used to set up the initial state of the UI scene.
     */
    create() {
        // --- Store a reference to the main game scene ---
        // This allows us to access the Nadagotchi data directly if needed,
        // but we'll primarily use events for decoupling.
        this.mainScene = this.scene.get('MainScene');

        // --- Create UI Elements ---

        // Create the text object that will display the pet's stats in the top-left.
        this.statsText = this.add.text(10, 10, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' });

        // --- Create Action Buttons ---
        const buttonY = this.cameras.main.height - 40;
        const buttonStyle = {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 10, y: 5 },
            border: '1px solid #ffffff'
        };
        let startX = 10;

        const addButton = (text, action) => {
            const button = this.add.text(startX, buttonY, text, buttonStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.game.events.emit('uiAction', action))
                .on('pointerover', () => button.setStyle({ fill: '#ff0' }))
                .on('pointerout', () => button.setStyle({ fill: '#fff' }));
            startX += button.width + 10; // Advance position for the next button
            return button;
        };

        addButton('Feed', 'FEED');
        addButton('Play', 'PLAY');
        addButton('Study', 'STUDY');
        addButton('Explore', 'EXPLORE');
        addButton('Care', 'CARE_FOR_PLANT');
        addButton('Meditate', 'MEDITATE');
        addButton('Craft', 'CRAFT_ITEM');

        // --- Initialize Job Board ---
        /**
         * @type {Phaser.GameObjects.Text} - The interactive text object for the Job Board.
         * @private
         */
        this.jobBoardButton = this.add.text(
            this.cameras.main.width - 120, // Position in the bottom-right
            this.cameras.main.height - 40,
            'Job Board',
            { padding: { x: 10, y: 5 }, backgroundColor: '#6A0DAD' }
        );
        // Initially disabled.
        this.jobBoardButton.setInteractive(false).setAlpha(0.5);
        this.jobBoardButton.on('pointerdown', () => this.openJobBoard());

        // --- Career Notification ---
        /**
         * @type {?Phaser.GameObjects.Text} - A reference to the career notification text object, if it's on screen.
         * @private
         */
        this.careerNotificationText = null;

        // --- Legacy Button ---
        this.legacyButton = this.add.text(
            this.cameras.main.width - 120,
            10,
            'Legacy',
            { padding: { x: 10, y: 5 }, backgroundColor: '#ff00ff' }
        ).setInteractive().setVisible(false);

        this.legacyButton.on('pointerdown', () => {
            // Start the BreedingScene, passing the current pet's data
            this.scene.start('BreedingScene', this.nadagotchiData);
        });

        // --- Event Listeners ---
        // Set up a listener for the 'updateStats' event from the MainScene.
        this.game.events.on('updateStats', this.updateStatsUI, this);

        // Store the latest nadagotchi data received from the event.
        this.nadagotchiData = null;

        // --- Meta-Game UI ---
        this.persistence = new PersistenceManager();

        // Journal Button
        const journalButton = this.add.text(10, 50, 'Journal', { padding: { x: 10, y: 5 }, backgroundColor: '#444' }).setInteractive();
        journalButton.on('pointerdown', () => this.openJournal());

        // Recipe Book Button
        const recipeButton = this.add.text(100, 50, 'Recipes', { padding: { x: 10, y: 5 }, backgroundColor: '#444' }).setInteractive();
        recipeButton.on('pointerdown', () => this.openRecipeBook());

        // Modals (initially hidden)
        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
    }

    /**
     * Updates all UI elements with the latest data from the Nadagotchi.
     * This method is called by the 'updateStats' event from the MainScene.
     * @param {object} data - The entire Nadagotchi object, containing stats, skills, mood, etc.
     */
    updateStatsUI(data) {
        // Store the latest data
        this.nadagotchiData = data;

        const stats = data.stats;
        const skills = data.skills;
        // Get a visual indicator for the pet's current mood.
        const moodEmoji = this.getMoodEmoji(data.mood);

        // Format the text string with the latest data.
        // Added 'Navigation' skill to the display.
        const text = `Archetype: ${data.dominantArchetype}\n` +
                     `Mood: ${data.mood} ${moodEmoji}\n` +
                     `Career: ${data.currentCareer || 'None'}\n` +
                     `Hunger: ${Math.floor(stats.hunger)}\n` +
                     `Energy: ${Math.floor(stats.energy)}\n` +
                     `Happiness: ${Math.floor(stats.happiness)}\n` +
                     `Logic Skill: ${skills.logic.toFixed(2)}\n` +
                     `Nav Skill: ${skills.navigation.toFixed(2)}\n` +
                     `Empathy: ${skills.empathy.toFixed(2)}\n` +
                     `Focus: ${skills.focus.toFixed(2)}\n` +
                     `Crafting: ${skills.crafting.toFixed(2)}`;
        this.statsText.setText(text);

        // --- Job Board Activation Logic ---
        // If the Nadagotchi has a career and the job board is currently inactive, enable it.
        if (data.currentCareer && !this.jobBoardButton.input.enabled) {
            this.jobBoardButton.setInteractive(true);
            this.jobBoardButton.setAlpha(1.0);
        }

        // --- Career Notification Logic ---
        // Check if the 'newCareerUnlocked' flag is set AND if a notification is not already on screen.
        if (data.newCareerUnlocked && !this.careerNotificationText) {
            // Call the function to display the notification.
            this.showCareerNotification(data.newCareerUnlocked);
            // Clear the flag on the source object so it doesn't trigger again.
            data.newCareerUnlocked = null;
        }

        // --- Legacy Button Visibility ---
        // If the pet is ready for legacy and the button is not yet visible, show it.
        if (data.isLegacyReady && !this.legacyButton.visible) {
            this.legacyButton.setVisible(true);
        }
    }

    /**
     * Returns an emoji character based on the pet's mood.
     * @param {string} mood - The current mood of the Nadagotchi (e.g., 'Happy', 'Neutral', 'Sad').
     * @returns {string} An emoji representing the mood.
     */
    getMoodEmoji(mood) {
        switch (mood.toLowerCase()) {
            case 'happy':
                return '\u{1F604}';
            case 'sad':
                return '\u{1F622}';
            case 'angry':
                return '\u{1F620}';
            case 'neutral':
                return '\u{1F610}';
            default:
                return '❓'; // Return a question mark for unknown moods.
        }
    }

    /**
     * Displays a temporary notification for a new career.
     * @param {string} careerName - The name of the career that was unlocked (e.g., 'Innovator').
     */
    showCareerNotification(careerName) {
        const message = `Career Unlocked: ${careerName}!`;

        // Create the text object in the center of the UI scene.
        this.careerNotificationText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 30, // Position slightly above center
            message,
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#000000',
                backgroundColor: '#ffffff',
                padding: { x: 10, y: 5 },
                align: 'center'
            }
        ).setOrigin(0.5, 0.5); // Center the text object

        // Create a timed event to destroy the text after 3 seconds.
        this.time.delayedCall(3000, () => {
            if (this.careerNotificationText) {
                this.careerNotificationText.destroy();
                this.careerNotificationText = null; // Clear the reference
            }
        });
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
            case 'Scout':
                console.log("Job Available: Map the Whispering Woods!");
                break;
            case 'Healer':
                console.log("Job Available: Comfort the Lost Sprite!");
                break;
            case 'Artisan':
                console.log("Job Available: Craft a Ceremonial Item!");
                break;
            default:
                console.log("No jobs available for your current career.");
                break;
        }
    }

    // --- NEW MODAL HELPER FUNCTIONS ---

    /**
     * Creates a generic modal group (container, background, title, content, close button).
     * @param {string} title - The title to display at the top of the modal.
     * @returns {Phaser.GameObjects.Group} The created modal group.
     */
    createModal(title) {
        const modalGroup = this.add.group();

        const modalBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 500, 400, 0x1a1a1a, 0.9).setOrigin(0.5);
        modalBg.setStrokeStyle(2, 0xffffff); // Add a white border

        const modalTitle = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 170, title, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const modalContent = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: 480 },
            align: 'left'
        }).setOrigin(0.5);

        const closeButton = this.add.text(this.cameras.main.width / 2 + 220, this.cameras.main.height / 2 - 170, 'X', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#8B0000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive();

        closeButton.on('pointerdown', () => modalGroup.setVisible(false));

        modalGroup.addMultiple([modalBg, modalTitle, modalContent, closeButton]);
        modalGroup.setVisible(false); // Hide by default
        modalGroup.content = modalContent; // Attach content text for easy access

        return modalGroup;
    }

    openJournal() {
        const journalEntries = this.persistence.loadJournal();
        const formattedText = journalEntries.map(entry => `${entry.date}: ${entry.text}`).join('\n');
        this.journalModal.content.setText(formattedText || "No entries yet.");
        this.journalModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openRecipeBook() {
        const recipes = this.persistence.loadRecipes();
        const formattedText = recipes.join('\n');
        this.recipeModal.content.setText(formattedText || "No recipes discovered.");
        this.recipeModal.setVisible(true);
        this.scene.pause('MainScene');
    }
}