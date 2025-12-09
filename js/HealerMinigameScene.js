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
    /**
     * Creates an instance of HealerMinigameScene.
     */
    constructor() {
        super({ key: 'HealerMinigameScene' });
        // NOTE: Game state is confined to create() closure.
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, and initializes the game.
     */
    create() {
        this.cameras.main.setBackgroundColor('#ADD8E6'); // Light blue, clinical feel
        this.add.text(this.cameras.main.width / 2, 50, 'Healer Task: Find the Cure!', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        // --- Private State (Closure Scope) ---
        const ailments = [
            { symptom: { emoji: '🤒', text: 'High Temperature' }, remedy: { emoji: '🌿', name: 'Cooling Herb' } },
            { symptom: { emoji: '😢', text: 'Feeling Blue' }, remedy: { emoji: '💖', name: 'Happy Potion' } },
            { symptom: { emoji: '💨', text: 'Coughing Fits' }, remedy: { emoji: '🍯', name: 'Soothing Syrup' } },
            { symptom: { emoji: '😵', text: 'Feeling Dizzy' }, remedy: { emoji: '🌰', name: 'Stabilizing Root' } }
        ];

        const currentAilment = Phaser.Utils.Array.GetRandom(ailments);
        let remedyOptions = [];

        // --- Helper Functions (Closure) ---

        const endGame = (isSuccess) => {
            this.game.events.emit(EventKeys.WORK_RESULT, { success: isSuccess, career: 'Healer' });
            this.scene.stop();
            this.scene.resume('MainScene');
        };

        const handleRemedyClick = (chosenRemedy) => {
            const isSuccess = (chosenRemedy.name === currentAilment.remedy.name);
            endGame(isSuccess);
        };

        const setupRemedyOptions = () => {
            remedyOptions = [currentAilment.remedy];
            let distractors = ailments.filter(a => a.remedy.name !== currentAilment.remedy.name);
            distractors = Phaser.Utils.Array.Shuffle(distractors);
            remedyOptions.push(distractors[0].remedy, distractors[1].remedy);
            remedyOptions = Phaser.Utils.Array.Shuffle(remedyOptions);
        };

        const createRemedyButtons = () => {
            const buttonWidth = 200;
            const spacing = 40;
            const startX = (this.cameras.main.width - (3 * buttonWidth + 2 * spacing)) / 2;

            remedyOptions.forEach((remedy, index) => {
                const x = startX + index * (buttonWidth + spacing) + buttonWidth / 2;
                const y = this.cameras.main.height / 2 + 150;

                const button = this.add.rectangle(x, y, buttonWidth, 100, 0xFFFAF0).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
                this.add.text(x, y, `${remedy.emoji}\n${remedy.name}`, { fontSize: '20px', fill: '#000', align: 'center' }).setOrigin(0.5);
                button.on('pointerdown', () => handleRemedyClick(remedy));
            });
        };

        // --- Initialization ---
        // Display patient's symptom
        this.add.text(this.cameras.main.width / 2, 150, 'Patient has:', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, 200, currentAilment.symptom.emoji, { fontSize: '64px' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, 250, currentAilment.symptom.text, { fontSize: '22px', fill: '#000' }).setOrigin(0.5);

        setupRemedyOptions();
        createRemedyButtons();
    }
}
