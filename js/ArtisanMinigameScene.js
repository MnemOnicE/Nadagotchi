import { EventKeys } from './EventKeys.js';

/**
 * @fileoverview A mini-game for the Artisan career.
 * Tests the player's memory by asking them to reproduce a pattern.
 */

/**
 * @class ArtisanMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A mini-game for the 'Artisan' career path.
 * The player must memorize and replicate a pattern shown on a grid.
 */
export class ArtisanMinigameScene extends Phaser.Scene {
    /**
     * Creates an instance of ArtisanMinigameScene.
     */
    constructor() {
        super({ key: 'ArtisanMinigameScene' });
        // NOTE: Pattern data is no longer stored on 'this' to prevent console snooping.
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, and initializes the game flow.
     */
    create() {
        this.cameras.main.setBackgroundColor('#663399'); // A creative purple
        this.add.text(this.cameras.main.width / 2, 50, 'Artisan Craft: Recreate the Pattern', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);
        this.statusText = this.add.text(this.cameras.main.width / 2, 100, 'Memorize the pattern!', { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);

        // --- Private State (Closure Scope) ---
        // These variables are inaccessible from the browser console (game.scene.getScene...)
        const gridSize = 3;
        let pattern = [];
        let playerPattern = [];
        let isDisplayingPattern = false;
        const gridButtons = [];

        // --- Helper Functions (Closure) ---

        const endGame = (isSuccess) => {
            const result = { success: isSuccess, career: 'Artisan' };
            if (isSuccess) {
                // On success, the artisan crafts a specific item.
                result.craftedItem = "Fancy Bookshelf";
            }
            this.game.events.emit(EventKeys.WORK_RESULT, result);
            this.scene.resume('MainScene');
            this.scene.stop();
        };

        const checkPattern = () => {
            const isSuccess = JSON.stringify(pattern) === JSON.stringify(playerPattern);
            this.statusText.setText(isSuccess ? 'Perfect!' : 'Not quite right.');
            this.time.delayedCall(1500, () => endGame(isSuccess));
        };

        const handleGridClick = (button) => {
            if (isDisplayingPattern) return;

            const index = button.getData('index');
            playerPattern[index] = !playerPattern[index];
            button.setFillStyle(playerPattern[index] ? 0x4169E1 : 0xD3D3D3);

            const playerActiveTiles = playerPattern.filter(Boolean).length;
            const patternActiveTiles = pattern.filter(Boolean).length;
            if (playerActiveTiles === patternActiveTiles) {
                checkPattern();
            }
        };

        const displayPattern = () => {
            isDisplayingPattern = true;
            pattern.forEach((isActive, index) => {
                if (isActive) {
                    gridButtons[index].setFillStyle(0x4169E1); // Royal Blue
                }
            });

            this.time.delayedCall(2000, () => {
                gridButtons.forEach(button => button.setFillStyle(0xD3D3D3));
                this.statusText.setText('Now, copy the pattern.');
                isDisplayingPattern = false;
            });
        };

        const generatePattern = () => {
            const patternLength = 4; // Number of tiles in the pattern
            const totalTiles = gridSize * gridSize;
            const indices = Array.from({ length: totalTiles }, (_, i) => i);
            const shuffledIndices = Phaser.Utils.Array.Shuffle(indices);
            const patternIndices = new Set(shuffledIndices.slice(0, patternLength));

            pattern = Array.from({ length: totalTiles }, (_, i) => patternIndices.has(i));
            playerPattern = Array(totalTiles).fill(false);
        };

        const createGrid = () => {
            const buttonSize = 80;
            const spacing = 15;
            const startX = (this.cameras.main.width - (gridSize * buttonSize + (gridSize - 1) * spacing)) / 2;
            const startY = (this.cameras.main.height - (gridSize * buttonSize + (gridSize - 1) * spacing)) / 2;

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const x = startX + col * (buttonSize + spacing) + buttonSize / 2;
                    const y = startY + row * (buttonSize + spacing) + buttonSize / 2;
                    const index = row * gridSize + col;

                    const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0xD3D3D3).setInteractive({ useHandCursor: true });
                    button.setData('index', index);

                    button.on('pointerdown', () => handleGridClick(button));
                    gridButtons.push(button);
                }
            }
        };

        // --- Initialization ---
        createGrid();
        generatePattern();
        displayPattern();
    }
}
