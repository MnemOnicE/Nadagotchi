import { EventKeys } from './EventKeys.js';

/**
 * @fileoverview A mini-game for the Healer career.
 * Involves diagnosing symptoms and selecting the correct remedy.
 */

/**
 * @class HealerMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A mini-game for the 'Healer' career path.
 * The player must diagnose a patient's symptom and select the correct remedy from a list of options.
 */
export class HealerMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HealerMinigameScene' });
        /**
         * @typedef {object} Remedy
         * @property {string} emoji - The emoji representing the remedy.
         * @property {string} name - The name of the remedy.
         */
        /**
         * @typedef {object} Ailment
         * @property {{emoji: string, text: string}} symptom - The symptom of the ailment.
         * @property {Remedy} remedy - The correct remedy for the ailment.
         */
        /** @type {Array<Ailment>} A list of possible ailments and their cures. */
        this.ailments = [
            { symptom: { emoji: '🤒', text: 'High Temperature' }, remedy: { emoji: '🌿', name: 'Cooling Herb' } },
            { symptom: { emoji: '😢', text: 'Feeling Blue' }, remedy: { emoji: '💖', name: 'Happy Potion' } },
            { symptom: { emoji: '💨', text: 'Coughing Fits' }, remedy: { emoji: '🍯', name: 'Soothing Syrup' } },
            { symptom: { emoji: '😵', text: 'Feeling Dizzy' }, remedy: { emoji: '🌰', name: 'Stabilizing Root' } }
        ];
        /** @type {?Ailment} The randomly selected ailment for the current game. */
        this.currentAilment = null;
        /** @type {Array<Remedy>} The list of remedy options presented to the player. */
        this.remedyOptions = [];
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, and initializes the game.
     */
    create() {
        this.cameras.main.setBackgroundColor('#ADD8E6'); // Light blue, clinical feel
        this.add.text(this.cameras.main.width / 2, 50, 'Healer Task: Find the Cure!', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        this.currentAilment = Phaser.Utils.Array.GetRandom(this.ailments);

        // Display patient's symptom
        this.add.text(this.cameras.main.width / 2, 150, 'Patient has:', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, 200, this.currentAilment.symptom.emoji, { fontSize: '64px' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, 250, this.currentAilment.symptom.text, { fontSize: '22px', fill: '#000' }).setOrigin(0.5);

        this.setupRemedyOptions();
        this.createRemedyButtons();
    }

    /**
     * Prepares the list of remedy options, including the correct one and two incorrect distractors.
     * @private
     */
    setupRemedyOptions() {
        this.remedyOptions = [this.currentAilment.remedy];
        let distractors = this.ailments.filter(a => a.remedy.name !== this.currentAilment.remedy.name);
        distractors = Phaser.Utils.Array.Shuffle(distractors);
        this.remedyOptions.push(distractors[0].remedy, distractors[1].remedy);
        this.remedyOptions = Phaser.Utils.Array.Shuffle(this.remedyOptions);
    }

    /**
     * Creates the clickable UI buttons for each remedy option.
     * @private
     */
    createRemedyButtons() {
        const buttonWidth = 200;
        const spacing = 40;
        const startX = (this.cameras.main.width - (3 * buttonWidth + 2 * spacing)) / 2;

        this.remedyOptions.forEach((remedy, index) => {
            const x = startX + index * (buttonWidth + spacing) + buttonWidth / 2;
            const y = this.cameras.main.height / 2 + 150;

            const button = this.add.rectangle(x, y, buttonWidth, 100, 0xFFFAF0).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
            this.add.text(x, y, `${remedy.emoji}\n${remedy.name}`, { fontSize: '20px', fill: '#000', align: 'center' }).setOrigin(0.5);
            button.on('pointerdown', () => this.handleRemedyClick(remedy));
        });
    }

    /**
     * Handles the player's selection of a remedy.
     * @param {Remedy} chosenRemedy - The remedy object the player selected.
     * @private
     */
    handleRemedyClick(chosenRemedy) {
        const isSuccess = (chosenRemedy.name === this.currentAilment.remedy.name);
        this.endGame(isSuccess);
    }

    /**
     * Ends the mini-game and returns the result to the MainScene.
     * @param {boolean} isSuccess - Whether the player chose the correct remedy.
     * @private
     */
    endGame(isSuccess) {
        this.game.events.emit(EventKeys.WORK_RESULT, { success: isSuccess, career: 'Healer' });
        this.scene.stop();
        this.scene.resume('MainScene');
    }
}
