/**
 * LogicPuzzleScene is a mini-game for the 'Innovator' career path.
 * The player must memorize and repeat a sequence of colors.
 */
class LogicPuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LogicPuzzleScene' });
        this.sequence = [];
        this.playerSequence = [];
        this.level = 3; // Start with a sequence of 3 colors
        this.canPlayerClick = false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#333');
        this.add.text(this.cameras.main.width / 2, 50, 'Logic Puzzle: Repeat the Sequence', { fontSize: '24px' }).setOrigin(0.5);

        this.colorButtons = {
            red: this.createColorButton(this.cameras.main.width / 2 - 100, 200, 0xff0000, 'red'),
            green: this.createColorButton(this.cameras.main.width / 2, 200, 0x00ff00, 'green'),
            blue: this.createColorButton(this.cameras.main.width / 2 + 100, 200, 0x0000ff, 'blue'),
            yellow: this.createColorButton(this.cameras.main.width / 2, 300, 0xffff00, 'yellow')
        };

        this.time.delayedCall(1000, () => this.generateSequence());
    }

    /**
     * Creates a single colored button for the puzzle.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {number} color - The hex color code.
     * @param {string} name - The name of the color.
     * @returns {Phaser.GameObjects.Rectangle} The created button.
     */
    createColorButton(x, y, color, name) {
        const button = this.add.rectangle(x, y, 80, 80, color).setInteractive({ useHandCursor: true });
        button.name = name;
        button.on('pointerdown', () => this.handlePlayerClick(name));
        return button;
    }

    /**
     * Generates the next sequence for the player to memorize.
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
     * Visually plays the generated sequence for the player.
     */
    playSequence() {
        this.canPlayerClick = false;
        let delay = 500;
        this.sequence.forEach(colorName => {
            this.time.delayedCall(delay, () => {
                const button = this.colorButtons[colorName];
                this.tweens.add({
                    targets: button,
                    alpha: 0.2,
                    duration: 250,
                    yoyo: true
                });
            });
            delay += 500;
        });
        this.time.delayedCall(delay, () => { this.canPlayerClick = true; });
    }

    /**
     * Handles the player clicking on a color button.
     * @param {string} colorName - The name of the color that was clicked.
     */
    handlePlayerClick(colorName) {
        if (!this.canPlayerClick) return;

        this.playerSequence.push(colorName);

        // Check for incorrect move
        if (this.playerSequence[this.playerSequence.length - 1] !== this.sequence[this.playerSequence.length - 1]) {
            this.endGame(false);
            return;
        }

        // Check for sequence completion
        if (this.playerSequence.length === this.sequence.length) {
            this.level++;
            if (this.level > 5) { // Win condition
                this.endGame(true);
            } else {
                this.time.delayedCall(1000, () => this.generateSequence());
            }
        }
    }

    /**
     * Ends the mini-game and returns to the MainScene.
     * @param {boolean} isSuccess - Whether the player successfully completed the puzzle.
     */
    endGame(isSuccess) {
        // Emit an event to the MainScene with the result.
        this.game.events.emit('workResult', { success: isSuccess, career: 'Innovator' });
        // Return to the main game.
        this.scene.start('MainScene');
        this.scene.stop('UIScene'); // Stop and restart UI to ensure it's on top
        this.scene.launch('UIScene');
    }
}
