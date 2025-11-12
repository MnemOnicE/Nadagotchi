/**
 * HealerMinigameScene is a mini-game for the 'Healer' career path.
 * The player must diagnose a symptom and choose the correct remedy.
 */
class HealerMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HealerMinigameScene' });
        this.ailments = [
            { symptom: { emoji: '🤒', text: 'High Temperature' }, remedy: { emoji: '🌿', name: 'Cooling Herb' } },
            { symptom: { emoji: '😢', text: 'Feeling Blue' }, remedy: { emoji: '💖', name: 'Happy Potion' } },
            { symptom: { emoji: '💨', text: 'Coughing Fits' }, remedy: { emoji: '🍯', name: 'Soothing Syrup' } },
            { symptom: { emoji: '😵', text: 'Feeling Dizzy' }, remedy: { emoji: '🌰', name: 'Stabilizing Root' } }
        ];
        this.currentAilment = null;
        this.remedyOptions = [];
    }

    create() {
        this.cameras.main.setBackgroundColor('#ADD8E6'); // Light blue, clinical feel
        this.add.text(this.cameras.main.width / 2, 50, 'Healer Task: Find the Cure!', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        // Select a random ailment for this session
        this.currentAilment = Phaser.Utils.Array.GetRandom(this.ailments);

        // Display the patient and their symptom
        this.add.text(this.cameras.main.width / 2, 150, 'Patient has:', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, 200, this.currentAilment.symptom.emoji, { fontSize: '64px' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, 250, this.currentAilment.symptom.text, { fontSize: '22px', fill: '#000' }).setOrigin(0.5);

        this.setupRemedyOptions();
        this.createRemedyButtons();
    }

    /**
     * Sets up the list of remedy options, including the correct one and some distractors.
     */
    setupRemedyOptions() {
        this.remedyOptions = [];
        this.remedyOptions.push(this.currentAilment.remedy);

        // Add 2 random incorrect remedies
        let distractors = this.ailments.filter(a => a.remedy.name !== this.currentAilment.remedy.name);
        distractors = Phaser.Utils.Array.Shuffle(distractors);

        this.remedyOptions.push(distractors[0].remedy);
        this.remedyOptions.push(distractors[1].remedy);

        // Shuffle the final options
        this.remedyOptions = Phaser.Utils.Array.Shuffle(this.remedyOptions);
    }

    /**
     * Creates the clickable buttons for each remedy option.
     */
    createRemedyButtons() {
        const buttonWidth = 200;
        const buttonHeight = 100;
        const spacing = 40;
        const startX = (this.cameras.main.width - (3 * buttonWidth + 2 * spacing)) / 2;

        this.remedyOptions.forEach((remedy, index) => {
            const x = startX + index * (buttonWidth + spacing) + buttonWidth / 2;
            const y = this.cameras.main.height / 2 + 150;

            const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0xFFFAF0).setInteractive({ useHandCursor: true });
            button.setStrokeStyle(2, 0x000000);

            const remedyText = this.add.text(x, y, `${remedy.emoji}\n${remedy.name}`, { fontSize: '20px', fill: '#000', align: 'center' }).setOrigin(0.5);

            button.on('pointerdown', () => this.handleRemedyClick(remedy));
        });
    }

    /**
     * Handles the player's choice of remedy.
     * @param {object} chosenRemedy - The remedy object the player selected.
     */
    handleRemedyClick(chosenRemedy) {
        const isSuccess = (chosenRemedy.name === this.currentAilment.remedy.name);
        this.endGame(isSuccess);
    }

    /**
     * Ends the mini-game and returns to the MainScene.
     * @param {boolean} isSuccess - Whether the player successfully completed the puzzle.
     */
    endGame(isSuccess) {
        this.game.events.emit('workResult', { success: isSuccess, career: 'Healer' });
        this.scene.start('MainScene');
        this.scene.stop('UIScene');
        this.scene.launch('UIScene');
    }
}
