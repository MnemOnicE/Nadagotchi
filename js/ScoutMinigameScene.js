import { EventKeys } from './EventKeys.js';

/**
 * @fileoverview A mini-game for the Scout career.
 * A card matching game where the player must find pairs on a grid.
 */

/**
 * @class ScoutMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A memory matching mini-game for the 'Scout' career path.
 * The player must find and match pairs of icons on a grid within a time limit.
 */
export class ScoutMinigameScene extends Phaser.Scene {
    /**
     * Creates an instance of ScoutMinigameScene.
     */
    constructor() {
        super({ key: 'ScoutMinigameScene' });
        // NOTE: Game state is confined to create() closure.
    }

    /**
     * Phaser lifecycle method. Called before create.
     * @param {object} data - Data passed from the launching scene.
     * @param {string} [data.careerName='Scout'] - Optional career name override (e.g., 'Archaeologist').
     */
    init(data) {
        /** @type {string} The career context for this minigame instance. */
        this.careerName = (data && data.careerName) ? data.careerName : 'Scout';
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     * Sets up the background, text, timer, and game grid.
     */
    create() {
        this.cameras.main.setBackgroundColor('#2E8B57'); // Forest green
        this.add.text(this.cameras.main.width / 2, 50, `${this.careerName} Mission: Match the Pairs!`, { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);
        const timerText = this.add.text(this.cameras.main.width - 150, 50, `Time: 30`, { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);

        // --- Private State (Closure Scope) ---
        const icons = ['🌳', '🍄', '🐝', '🍁', '🌿', '🐾'];
        let grid = [];
        let firstSelection = null;
        let secondSelection = null;
        let matchesFound = 0;
        let timeLeft = 30;
        let timer = null;

        // --- Helper Functions (Closure) ---

        const endGame = (isSuccess) => {
            if (timer) timer.destroy();
            this.game.events.emit(EventKeys.WORK_RESULT, { success: isSuccess, career: this.careerName });
            this.scene.stop();
            this.scene.resume('MainScene');
        };

        const updateTimer = () => {
            timeLeft--;
            timerText.setText(`Time: ${timeLeft}`);
            if (timeLeft <= 0) {
                endGame(false);
            }
        };

        const checkForMatch = () => {
            const isMatch = firstSelection.getData('icon') === secondSelection.getData('icon');
            if (isMatch) {
                matchesFound++;
                firstSelection = null;
                secondSelection = null;
                if (matchesFound === icons.length) {
                    endGame(true); // Win condition
                }
            } else {
                // Not a match, flip them back after a delay
                this.time.delayedCall(1000, () => {
                    [firstSelection, secondSelection].forEach(card => {
                        card.getData('iconText').setText('');
                        card.setData('revealed', false);
                        card.setFillStyle(0xDEB887);
                    });
                    firstSelection = null;
                    secondSelection = null;
                });
            }
        };

        const handleCardClick = (card) => {
            if (card.getData('revealed') || secondSelection) return;

            card.getData('iconText').setText(card.getData('icon'));
            card.setData('revealed', true);
            card.setFillStyle(0xFFF8DC); // Lighten color to show selection

            if (!firstSelection) {
                firstSelection = card;
            } else {
                secondSelection = card;
                checkForMatch();
            }
        };

        const setupGrid = () => {
            grid = Phaser.Utils.Array.Shuffle(icons.concat(icons));
        };

        const createGridDisplay = () => {
            const rows = 3, cols = 4;
            const cardWidth = 100, cardHeight = 100, spacing = 20;
            const startX = (this.cameras.main.width - (cols * cardWidth + (cols - 1) * spacing)) / 2;
            const startY = (this.cameras.main.height - (rows * cardHeight + (rows - 1) * spacing)) / 2;

            grid.forEach((icon, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const x = startX + col * (cardWidth + spacing) + cardWidth / 2;
                const y = startY + row * (cardHeight + spacing) + cardHeight / 2;

                const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0xDEB887).setInteractive({ useHandCursor: true });
                card.setData({ icon: icon, index: i, revealed: false });

                const iconText = this.add.text(x, y, '', { fontSize: '48px' }).setOrigin(0.5);
                card.setData('iconText', iconText);

                card.on('pointerdown', () => handleCardClick(card));
            });
        };

        // --- Initialization ---
        setupGrid();
        createGridDisplay();

        timer = this.time.addEvent({
            delay: 1000,
            callback: updateTimer,
            callbackScope: this, // Still useful if accessing scene methods, though updateTimer is closed
            loop: true
        });
    }
}
