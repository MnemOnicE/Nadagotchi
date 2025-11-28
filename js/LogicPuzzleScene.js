import { EventKeys } from './EventKeys.js';

/**
 * @class LogicPuzzleScene
 * @extends Phaser.Scene
 * @classdesc
 * A mini-game for the 'Innovator' career path, functioning as a "Simon Says" memory game.
 * The player must memorize and repeat an ever-increasing sequence of colors.
 */
export class LogicPuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LogicPuzzleScene' });
        /** @type {Array<string>} The correct sequence of colors. */
        this.sequence = [];
        /** @type {Array<string>} The player's input sequence. */
        this.playerSequence = [];
        /** @type {number} The current length of the sequence. */
        this.level = 3;
        /** @type {boolean} Flag to disable player input while the sequence is playing. */
        this.canPlayerClick = false;
        /** @type {Object.<string, Phaser.GameObjects.Rectangle>} A map of color names to their button objects. */
        this.colorButtons = {};
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, and color buttons, then starts the game.
     */
    create() {
        this.cameras.main.setBackgroundColor('#333');
        this.add.text(this.cameras.main.width / 2, 50, 'Logic Puzzle: Repeat the Sequence', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

        this.colorButtons = {
            red: this.createColorButton(this.cameras.main.width / 2 - 100, 200, 0xff0000, 'red'),
            green: this.createColorButton(this.cameras.main.width / 2, 200, 0x00ff00, 'green'),
            blue: this.createColorButton(this.cameras.main.width / 2 + 100, 200, 0x0000ff, 'blue'),
            yellow: this.createColorButton(this.cameras.main.width / 2, 300, 0xffff00, 'yellow')
        };

        this.time.delayedCall(1000, () => this.generateSequence());
    }

    /**
     * Creates a single colored, interactive button for the puzzle.
     * @param {number} x - The x-coordinate for the button's center.
     * @param {number} y - The y-coordinate for the button's center.
     * @param {number} color - The hex color code for the button's fill.
     * @param {string} name - The identifier for the color (e.g., 'red').
     * @returns {Phaser.GameObjects.Rectangle} The created button game object.
     * @private
     */
    createColorButton(x, y, color, name) {
        const button = this.add.rectangle(x, y, 80, 80, color).setInteractive({ useHandCursor: true });
        button.name = name;
        button.on('pointerdown', () => this.handlePlayerClick(name));
        return button;
    }

    /**
     * Generates a new random sequence of colors and triggers its playback.
     * @private
     */
    generateSequence() {
        this.playerSequence = [];
        this.sequence = [];
        const colors = ['red', 'green', 'blue', 'yellow'];
        for (let i = 0; i < this.level; i++) {
            this.sequence.push(Phaser.Utils.Array.GetRandom(colors));
        }
        this.playSequence();
    }

    /**
     * Visually plays the generated sequence for the player to memorize.
     * @private
     */
    playSequence() {
        this.canPlayerClick = false;
        let delay = 500;
        this.sequence.forEach(colorName => {
            this.time.delayedCall(delay, () => {
                const button = this.colorButtons[colorName];
                this.tweens.add({ targets: button, alpha: 0.2, duration: 250, yoyo: true });
            });
            delay += 500;
        });
        this.time.delayedCall(delay, () => { this.canPlayerClick = true; });
    }

    /**
     * Handles the player's click on a color button, validates it against the sequence, and proceeds.
     * @param {string} colorName - The name of the color that was clicked.
     * @private
     */
    handlePlayerClick(colorName) {
        if (!this.canPlayerClick) return;

        this.playerSequence.push(colorName);
        const currentIndex = this.playerSequence.length - 1;

        // Check for incorrect move
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.endGame(false);
            return;
        }

        // Check for sequence completion
        if (this.playerSequence.length === this.sequence.length) {
            this.level++;
            if (this.level > 5) { // Win after completing a sequence of 5
                this.endGame(true);
            } else {
                this.canPlayerClick = false;
                this.time.delayedCall(1000, () => this.generateSequence());
            }
        }
    }

    /**
     * Ends the mini-game and returns the result to the MainScene.
     * @param {boolean} isSuccess - Whether the player successfully completed the puzzle.
     * @private
     */
    endGame(isSuccess) {
        this.game.events.emit(EventKeys.WORK_RESULT, { success: isSuccess, career: 'Innovator' });
        this.scene.stop();
        this.scene.resume('MainScene');
    }
}
