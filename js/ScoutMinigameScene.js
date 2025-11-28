/**
 * @class ScoutMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A memory matching mini-game for the 'Scout' career path.
 * The player must find and match pairs of icons on a grid within a time limit.
 */
export class ScoutMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ScoutMinigameScene' });
        /** @type {Array<string>} The set of unique icons to be matched. */
        this.icons = ['🌳', '🍄', '🐝', '🍁', '🌿', '🐾'];
        /** @type {Array<string>} The shuffled grid of paired icons. */
        this.grid = [];
        /** @type {?Phaser.GameObjects.Rectangle} The first card selected by the player. */
        this.firstSelection = null;
        /** @type {?Phaser.GameObjects.Rectangle} The second card selected by the player. */
        this.secondSelection = null;
        /** @type {number} The number of pairs successfully matched. */
        this.matchesFound = 0;
        /** @type {?Phaser.Time.TimerEvent} The countdown timer for the game. */
        this.timer = null;
        /** @type {number} The time remaining in seconds. */
        this.timeLeft = 30;
    }

    /**
     * Phaser lifecycle method. Called before create.
     * @param {object} data - Data passed from the launching scene.
     */
    init(data) {
        this.careerName = (data && data.careerName) ? data.careerName : 'Scout';
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, timer, and game grid.
     */
    create() {
        this.cameras.main.setBackgroundColor('#2E8B57'); // Forest green
        this.add.text(this.cameras.main.width / 2, 50, `${this.careerName} Mission: Match the Pairs!`, { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);
        this.timerText = this.add.text(this.cameras.main.width - 150, 50, `Time: ${this.timeLeft}`, { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);

        this.setupGrid();
        this.createGridDisplay();

        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Creates the shuffled array of paired icons for the grid.
     * @private
     */
    setupGrid() {
        this.grid = Phaser.Utils.Array.Shuffle(this.icons.concat(this.icons));
    }

    /**
     * Creates the visual grid of interactive cards on the screen.
     * @private
     */
    createGridDisplay() {
        const rows = 3, cols = 4;
        const cardWidth = 100, cardHeight = 100, spacing = 20;
        const startX = (this.cameras.main.width - (cols * cardWidth + (cols - 1) * spacing)) / 2;
        const startY = (this.cameras.main.height - (rows * cardHeight + (rows - 1) * spacing)) / 2;

        this.grid.forEach((icon, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (cardWidth + spacing) + cardWidth / 2;
            const y = startY + row * (cardHeight + spacing) + cardHeight / 2;

            const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0xDEB887).setInteractive({ useHandCursor: true });
            card.setData({ icon: icon, index: i, revealed: false });

            const iconText = this.add.text(x, y, '', { fontSize: '48px' }).setOrigin(0.5);
            card.setData('iconText', iconText);

            card.on('pointerdown', () => this.handleCardClick(card));
        });
    }

    /**
     * Handles the logic when a player clicks a card.
     * @param {Phaser.GameObjects.Rectangle} card - The card game object that was clicked.
     * @private
     */
    handleCardClick(card) {
        if (card.getData('revealed') || this.secondSelection) return;

        card.getData('iconText').setText(card.getData('icon'));
        card.setData('revealed', true);
        card.setFillStyle(0xFFF8DC); // Lighten color to show selection

        if (!this.firstSelection) {
            this.firstSelection = card;
        } else {
            this.secondSelection = card;
            this.checkForMatch();
        }
    }

    /**
     * Checks if the two currently selected cards are a match.
     * @private
     */
    checkForMatch() {
        const isMatch = this.firstSelection.getData('icon') === this.secondSelection.getData('icon');
        if (isMatch) {
            this.matchesFound++;
            this.firstSelection = null;
            this.secondSelection = null;
            if (this.matchesFound === this.icons.length) {
                this.endGame(true); // Win condition
            }
        } else {
            // Not a match, flip them back after a delay
            this.time.delayedCall(1000, () => {
                [this.firstSelection, this.secondSelection].forEach(card => {
                    card.getData('iconText').setText('');
                    card.setData('revealed', false);
                    card.setFillStyle(0xDEB887);
                });
                this.firstSelection = null;
                this.secondSelection = null;
            });
        }
    }

    /**
     * Updates the game timer every second and ends the game if time runs out.
     * @private
     */
    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`Time: ${this.timeLeft}`);
        if (this.timeLeft <= 0) {
            this.endGame(false);
        }
    }

    /**
     * Ends the mini-game, stops the timer, and returns the result to the MainScene.
     * @param {boolean} isSuccess - Whether the player successfully matched all pairs.
     * @private
     */
    endGame(isSuccess) {
        if (this.timer) this.timer.destroy();
        this.game.events.emit('workResult', { success: isSuccess, career: this.careerName });
        this.scene.stop();
        this.scene.resume('MainScene');
    }
}
