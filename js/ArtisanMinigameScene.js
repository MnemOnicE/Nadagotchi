import { EventKeys } from './EventKeys.js';

/**
 * @class ArtisanMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A mini-game for the 'Artisan' career path.
 * The player must memorize and replicate a pattern shown on a grid.
 */
export class ArtisanMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ArtisanMinigameScene' });
        /** @type {number} The size of the grid (e.g., 3 for a 3x3 grid). */
        this.gridSize = 3;
        /** @type {Array<boolean>} The target pattern to be matched. */
        this.pattern = [];
        /** @type {Array<boolean>} The player's current input pattern. */
        this.playerPattern = [];
        /** @type {boolean} A flag to prevent input while the pattern is being displayed. */
        this.isDisplayingPattern = false;
        /** @type {Array<Phaser.GameObjects.Rectangle>} An array of the grid button game objects. */
        this.gridButtons = [];
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, and initializes the game flow.
     */
    create() {
        this.cameras.main.setBackgroundColor('#663399'); // A creative purple
        this.add.text(this.cameras.main.width / 2, 50, 'Artisan Craft: Recreate the Pattern', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);
        this.statusText = this.add.text(this.cameras.main.width / 2, 100, 'Memorize the pattern!', { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);

        this.createGrid();
        this.generatePattern();
        this.displayPattern();
    }

    /**
     * Creates the interactive grid of buttons.
     * @private
     */
    createGrid() {
        const buttonSize = 80;
        const spacing = 15;
        const startX = (this.cameras.main.width - (this.gridSize * buttonSize + (this.gridSize - 1) * spacing)) / 2;
        const startY = (this.cameras.main.height - (this.gridSize * buttonSize + (this.gridSize - 1) * spacing)) / 2;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = startX + col * (buttonSize + spacing) + buttonSize / 2;
                const y = startY + row * (buttonSize + spacing) + buttonSize / 2;
                const index = row * this.gridSize + col;

                const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0xD3D3D3).setInteractive({ useHandCursor: true });
                button.setData('index', index);

                button.on('pointerdown', () => this.handleGridClick(button));
                this.gridButtons.push(button);
            }
        }
    }

    /**
     * Generates a random pattern for the player to copy.
     * @private
     */
    generatePattern() {
        const patternLength = 4; // Number of tiles in the pattern
        const totalTiles = this.gridSize * this.gridSize;
        const indices = Array.from({ length: totalTiles }, (_, i) => i);
        const shuffledIndices = Phaser.Utils.Array.Shuffle(indices);
        const patternIndices = new Set(shuffledIndices.slice(0, patternLength));

        this.pattern = Array.from({ length: totalTiles }, (_, i) => patternIndices.has(i));
        this.playerPattern = Array(totalTiles).fill(false);
    }

    /**
     * Briefly displays the generated pattern on the grid for the player to memorize.
     * @private
     */
    displayPattern() {
        this.isDisplayingPattern = true;
        this.pattern.forEach((isActive, index) => {
            if (isActive) {
                this.gridButtons[index].setFillStyle(0x4169E1); // Royal Blue
            }
        });

        this.time.delayedCall(2000, () => {
            this.gridButtons.forEach(button => button.setFillStyle(0xD3D3D3));
            this.statusText.setText('Now, copy the pattern.');
            this.isDisplayingPattern = false;
        });
    }

    /**
     * Handles player clicks on the grid buttons, updating their input.
     * @param {Phaser.GameObjects.Rectangle} button - The grid button that was clicked.
     * @private
     */
    handleGridClick(button) {
        if (this.isDisplayingPattern) return;

        const index = button.getData('index');
        this.playerPattern[index] = !this.playerPattern[index];
        button.setFillStyle(this.playerPattern[index] ? 0x4169E1 : 0xD3D3D3);

        const playerActiveTiles = this.playerPattern.filter(Boolean).length;
        const patternActiveTiles = this.pattern.filter(Boolean).length;
        if (playerActiveTiles === patternActiveTiles) {
            this.checkPattern();
        }
    }

    /**
     * Checks if the player's input pattern matches the target pattern.
     * @private
     */
    checkPattern() {
        const isSuccess = JSON.stringify(this.pattern) === JSON.stringify(this.playerPattern);
        this.statusText.setText(isSuccess ? 'Perfect!' : 'Not quite right.');
        this.time.delayedCall(1500, () => this.endGame(isSuccess));
    }

    /**
     * Ends the mini-game and returns the result to the MainScene.
     * @param {boolean} isSuccess - Whether the player successfully completed the task.
     * @private
     */
    endGame(isSuccess) {
        const result = { success: isSuccess, career: 'Artisan' };
        if (isSuccess) {
            // On success, the artisan crafts a specific item.
            result.craftedItem = "Fancy Bookshelf";
        }
        this.game.events.emit(EventKeys.WORK_RESULT, result);
        this.scene.stop();
        this.scene.resume('MainScene');
    }
}
