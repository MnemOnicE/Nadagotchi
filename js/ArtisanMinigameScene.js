/**
 * ArtisanMinigameScene is a mini-game for the 'Artisan' career path.
 * The player must replicate a pattern shown on a grid.
 */
class ArtisanMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ArtisanMinigameScene' });
        this.gridSize = 3; // 3x3 grid
        this.pattern = [];
        this.playerPattern = [];
        this.isDisplayingPattern = false;
        this.gridButtons = [];
    }

    create() {
        this.cameras.main.setBackgroundColor('#663399'); // Rebecca purple for a creative feel
        this.add.text(this.cameras.main.width / 2, 50, 'Artisan Craft: Recreate the Pattern', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);
        this.statusText = this.add.text(this.cameras.main.width / 2, 100, 'Memorize the pattern!', { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);

        this.createGrid();
        this.generatePattern();
        this.displayPattern();
    }

    /**
     * Creates the interactive grid of buttons.
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
                button.setData('isActive', false);

                button.on('pointerdown', () => this.handleGridClick(button));
                this.gridButtons.push(button);
                this.playerPattern.push(false); // Initialize player pattern with all false
            }
        }
    }

    /**
     * Generates a random pattern for the player to copy.
     */
    generatePattern() {
        this.pattern = [];
        const patternLength = 4; // 4 tiles will be in the pattern
        const indices = Array.from(Array(this.gridSize * this.gridSize).keys()); // [0, 1, ..., 8]
        const shuffledIndices = Phaser.Utils.Array.Shuffle(indices);

        const patternIndices = shuffledIndices.slice(0, patternLength);

        // Create a boolean array for the pattern
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            this.pattern.push(patternIndices.includes(i));
        }
    }

    /**
     * Briefly shows the pattern on the grid.
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
     * Handles clicks on the grid buttons.
     * @param {Phaser.GameObjects.Rectangle} button - The button that was clicked.
     */
    handleGridClick(button) {
        if (this.isDisplayingPattern) return;

        const index = button.getData('index');
        const currentState = this.playerPattern[index];
        this.playerPattern[index] = !currentState;
        button.setFillStyle(!currentState ? 0x4169E1 : 0xD3D3D3); // Toggle color

        // Check if pattern is complete
        if (this.playerPattern.filter(Boolean).length === this.pattern.filter(Boolean).length) {
            this.checkPattern();
        }
    }

    /**
     * Checks if the player's pattern matches the correct pattern.
     */
    checkPattern() {
        const isSuccess = JSON.stringify(this.pattern) === JSON.stringify(this.playerPattern);
        this.statusText.setText(isSuccess ? 'Perfect!' : 'Not quite right.');
        this.time.delayedCall(1500, () => this.endGame(isSuccess));
    }

    /**
     * Ends the mini-game.
     * @param {boolean} isSuccess - Did the player succeed?
     */
    endGame(isSuccess) {
        this.game.events.emit('workResult', { success: isSuccess, career: 'Artisan' });
        this.scene.start('MainScene');
        this.scene.stop('UIScene');
        this.scene.launch('UIScene');
    }
}
