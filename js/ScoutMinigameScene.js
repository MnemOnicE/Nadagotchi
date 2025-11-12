/**
 * ScoutMinigameScene is a mini-game for the 'Scout' career path.
 * The player must find and match pairs of icons within a time limit.
 */
class ScoutMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ScoutMinigameScene' });
        this.icons = ['\u{1F333}', '\u{1F344}', '\u{1F41D}', '\u{1F341}', '\u{1F33F}', '\u{1F43E}']; // Tree, Mushroom, Bee, Maple Leaf, Herb, Paw Prints
        this.grid = [];
        this.firstSelection = null;
        this.secondSelection = null;
        this.matchesFound = 0;
        this.timer = null;
        this.timeLeft = 30; // 30 seconds for the game
    }

    create() {
        this.cameras.main.setBackgroundColor('#2E8B57'); // Forest green
        this.add.text(this.cameras.main.width / 2, 50, 'Scout Mission: Match the Pairs!', { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

        this.timerText = this.add.text(this.cameras.main.width - 150, 50, `Time: ${this.timeLeft}`, { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);

        this.setupGrid();
        this.createGrid();

        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Sets up the 4x3 grid with shuffled pairs of icons.
     */
    setupGrid() {
        let pairs = this.icons.concat(this.icons); // Duplicate icons to create pairs
        this.grid = Phaser.Utils.Array.Shuffle(pairs);
    }

    /**
     * Creates the visual grid of cards (buttons) on the screen.
     */
    createGrid() {
        const rows = 3;
        const cols = 4;
        const cardWidth = 100;
        const cardHeight = 100;
        const spacing = 20;
        const startX = (this.cameras.main.width - (cols * cardWidth + (cols - 1) * spacing)) / 2;
        const startY = (this.cameras.main.height - (rows * cardHeight + (rows - 1) * spacing)) / 2;

        for (let i = 0; i < this.grid.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (cardWidth + spacing);
            const y = startY + row * (cardHeight + spacing);

            const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0xDEB887).setInteractive({ useHandCursor: true });
            card.setData('icon', this.grid[i]);
            card.setData('index', i);
            card.setData('revealed', false);

            const iconText = this.add.text(x, y, '', { fontSize: '48px' }).setOrigin(0.5);
            card.setData('iconText', iconText);

            card.on('pointerdown', () => this.handleCardClick(card));
        }
    }

    /**
     * Handles the logic when a player clicks a card.
     * @param {Phaser.GameObjects.Rectangle} card - The card that was clicked.
     */
    handleCardClick(card) {
        if (card.getData('revealed') || this.secondSelection) {
            return; // Ignore clicks on already revealed cards or when two are selected
        }

        card.getData('iconText').setText(card.getData('icon'));
        card.setData('revealed', true);
        card.setFillStyle(0xFFF8DC); // Change color to show it's selected

        if (!this.firstSelection) {
            this.firstSelection = card;
        } else {
            this.secondSelection = card;
            this.checkForMatch();
        }
    }

    /**
     * Checks if the two selected cards are a match.
     */
    checkForMatch() {
        if (this.firstSelection.getData('icon') === this.secondSelection.getData('icon')) {
            // It's a match!
            this.matchesFound++;
            this.firstSelection = null;
            this.secondSelection = null;
            if (this.matchesFound === this.icons.length) {
                this.endGame(true); // All pairs found
            }
        } else {
            // Not a match, hide them again after a delay
            this.time.delayedCall(1000, () => {
                this.firstSelection.getData('iconText').setText('');
                this.firstSelection.setData('revealed', false);
                this.firstSelection.setFillStyle(0xDEB887);

                this.secondSelection.getData('iconText').setText('');
                this.secondSelection.setData('revealed', false);
                this.secondSelection.setFillStyle(0xDEB887);

                this.firstSelection = null;
                this.secondSelection = null;
            });
        }
    }

    /**
     * Updates the game timer every second.
     */
    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`Time: ${this.timeLeft}`);
        if (this.timeLeft <= 0) {
            this.endGame(false); // Time's up
        }
    }

    /**
     * Ends the mini-game and returns to the MainScene.
     * @param {boolean} isSuccess - Whether the player successfully completed the puzzle.
     */
    endGame(isSuccess) {
        if (this.timer) {
            this.timer.remove(false);
        }
        this.game.events.emit('workResult', { success: isSuccess, career: 'Scout' });
        this.scene.start('MainScene');
        this.scene.stop('UIScene');
        this.scene.launch('UIScene');
    }
}
