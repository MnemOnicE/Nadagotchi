import { EventKeys } from './EventKeys.js';

/**
 * @fileoverview A mini-game for the Innovator career.
 * A "Simon Says" style memory game requiring pattern repetition.
 */

/**
 * @class LogicPuzzleScene
 * @extends Phaser.Scene
 * @classdesc
 * A mini-game for the 'Innovator' career path, functioning as a "Simon Says" memory game.
 * The player must memorize and repeat an ever-increasing sequence of colors.
 */
export class LogicPuzzleScene extends Phaser.Scene {
    /**
     * Creates an instance of LogicPuzzleScene.
     */
    constructor() {
        super({ key: 'LogicPuzzleScene' });
        // NOTE: Game state is confined to create() closure to prevent console inspection.
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, and color buttons, then starts the game.
     */
    create() {
        this.cameras.main.setBackgroundColor('#333');
        this.add.text(this.cameras.main.width / 2, 50, 'Logic Puzzle: Repeat the Sequence', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

        // --- Private State (Closure Scope) ---
        let sequence = [];
        let playerSequence = [];
        let level = 3;
        let canPlayerClick = false;
        const colorButtons = {};

        // --- Helper Functions (Closure) ---

        const endGame = (isSuccess) => {
            this.game.events.emit(EventKeys.WORK_RESULT, { success: isSuccess, career: 'Innovator' });
            this.scene.stop();
            this.scene.resume('MainScene');
        };

        const handlePlayerClick = (colorName) => {
            if (!canPlayerClick) return;

            playerSequence.push(colorName);
            const currentIndex = playerSequence.length - 1;

            // Check for incorrect move
            if (playerSequence[currentIndex] !== sequence[currentIndex]) {
                endGame(false);
                return;
            }

            // Check for sequence completion
            if (playerSequence.length === sequence.length) {
                level++;
                if (level > 5) { // Win after completing a sequence of 5
                    endGame(true);
                } else {
                    canPlayerClick = false;
                    this.time.delayedCall(1000, () => generateSequence());
                }
            }
        };

        const createColorButton = (x, y, color, name) => {
            const button = this.add.rectangle(x, y, 80, 80, color).setInteractive({ useHandCursor: true });
            button.name = name;
            button.on('pointerdown', () => handlePlayerClick(name));
            return button;
        };

        const playSequence = () => {
            canPlayerClick = false;
            let delay = 500;
            sequence.forEach(colorName => {
                this.time.delayedCall(delay, () => {
                    const button = colorButtons[colorName];
                    this.tweens.add({ targets: button, alpha: 0.2, duration: 250, yoyo: true });
                });
                delay += 500;
            });
            this.time.delayedCall(delay, () => { canPlayerClick = true; });
        };

        const generateSequence = () => {
            playerSequence = [];
            sequence = [];
            const colors = ['red', 'green', 'blue', 'yellow'];
            for (let i = 0; i < level; i++) {
                sequence.push(Phaser.Utils.Array.GetRandom(colors));
            }
            playSequence();
        };

        // --- Initialization ---
        colorButtons.red = createColorButton(this.cameras.main.width / 2 - 100, 200, 0xff0000, 'red');
        colorButtons.green = createColorButton(this.cameras.main.width / 2, 200, 0x00ff00, 'green');
        colorButtons.blue = createColorButton(this.cameras.main.width / 2 + 100, 200, 0x0000ff, 'blue');
        colorButtons.yellow = createColorButton(this.cameras.main.width / 2, 300, 0xffff00, 'yellow');

        this.time.delayedCall(1000, () => generateSequence());
    }
}
