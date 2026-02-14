import { EventKeys } from './EventKeys.js';
import { ButtonFactory } from './ButtonFactory.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';

/**
 * @class StudyMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A Word Grid game ("Bookworm" style) for the 'Study' action.
 * Grid of letters, connect adjacent letters to form words.
 */
export class StudyMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StudyMinigameScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#2E1A0F'); // Dark wood

        // --- State ---
        this.gridSize = 5;
        this.grid = []; // 2D array
        this.selectedCells = [];
        this.score = 0;
        this.foundWords = 0;

        // --- Dictionary (Simple) ---
        this.validWords = new Set([
            'BOOK', 'READ', 'WISE', 'MIND', 'STUDY', 'LEARN', 'NOTE', 'PAGE',
            'TEXT', 'WORD', 'FONT', 'INK', 'PEN', 'QUILL', 'TEST', 'EXAM',
            'LOGIC', 'FACT', 'DATA', 'BIO', 'MATH', 'GEO', 'HIST', 'ART'
        ]);

        // --- Visuals ---
        this.add.text(400, 40, "STUDY SESSION", { fontFamily: 'VT323', fontSize: '32px', color: '#D2B48C' }).setOrigin(0.5);
        this.scoreText = this.add.text(20, 20, "Words: 0", { fontFamily: 'VT323', fontSize: '24px' });

        // Grid Container
        this.gridContainer = this.add.container(400, 300);

        this.generateGrid();
        this.renderGrid();

        // Submit Button
        ButtonFactory.createButton(this, 650, 500, "SUBMIT", () => this.submitWord(), { width: 120, height: 50, color: 0x4CAF50 });

        // Clear Button
        ButtonFactory.createButton(this, 150, 500, "CLEAR", () => this.clearSelection(), { width: 120, height: 50, color: 0xF44336 });

        // Exit Button
        ButtonFactory.createButton(this, 400, 550, "Finish Studying", () => this.endGame(), { width: 200, height: 40, color: 0x555555 });
    }

    generateGrid() {
        // Bias towards common letters in our dictionary
        const common = "EOTAINSHR";
        const rare = "QZJXKV";
        const vowels = "AEIOU";

        for(let y=0; y<this.gridSize; y++) {
            const row = [];
            for(let x=0; x<this.gridSize; x++) {
                let char = '';
                const r = Math.random();
                if(r < 0.3) char = vowels[Math.floor(Math.random() * vowels.length)];
                else if(r < 0.8) char = common[Math.floor(Math.random() * common.length)];
                else char = String.fromCharCode(65 + Math.floor(Math.random() * 26));

                row.push({ char, x, y, sprite: null, bg: null });
            }
            this.grid.push(row);
        }
    }

    renderGrid() {
        this.gridContainer.removeAll(true);
        const cellSize = 60;
        const spacing = 5;
        const offset = ((cellSize + spacing) * this.gridSize) / 2;

        for(let y=0; y<this.gridSize; y++) {
            for(let x=0; x<this.gridSize; x++) {
                const cell = this.grid[y][x];
                const px = (x * (cellSize + spacing)) - offset + (cellSize/2);
                const py = (y * (cellSize + spacing)) - offset + (cellSize/2);

                const bg = this.add.rectangle(px, py, cellSize, cellSize, 0xD2B48C).setStrokeStyle(2, 0x5C4033).setInteractive({ useHandCursor: true });
                const text = this.add.text(px, py, cell.char, { fontSize: '32px', color: '#2E1A0F', fontStyle: 'bold' }).setOrigin(0.5);

                this.gridContainer.add([bg, text]);
                cell.bg = bg; // Store ref for highlighting

                bg.on('pointerdown', () => this.handleCellClick(cell));
            }
        }
    }

    handleCellClick(cell) {
        // Deselect if last selected
        if (this.selectedCells.length > 0 && this.selectedCells[this.selectedCells.length-1] === cell) {
            this.selectedCells.pop();
            cell.bg.setFillStyle(0xD2B48C);
            return;
        }

        // Validate Adjacency
        if (this.selectedCells.length > 0) {
            const last = this.selectedCells[this.selectedCells.length-1];
            const dx = Math.abs(last.x - cell.x);
            const dy = Math.abs(last.y - cell.y);
            if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return; // Not adjacent or same cell
            if (this.selectedCells.includes(cell)) return; // Already selected
        }

        this.selectedCells.push(cell);
        cell.bg.setFillStyle(0xFFD700); // Gold highlight
        SoundSynthesizer.instance.playChime(400 + (this.selectedCells.length * 50)); // Rising pitch
    }

    clearSelection() {
        this.selectedCells.forEach(c => c.bg.setFillStyle(0xD2B48C));
        this.selectedCells = [];
    }

    submitWord() {
        if (this.selectedCells.length < 3) {
            this.showFeedback("Too Short!", 0xFF0000);
            this.clearSelection();
            return;
        }

        const word = this.selectedCells.map(c => c.char).join('');

        // Logic:
        // 1. Valid Word: Full Score, Increment Found Count, Green Feedback, Success Sound.
        // 2. Research Notes (Gibberish >= 4 chars): Small Score, No Found Count, Cyan Feedback, Chime Sound.
        // 3. Invalid: No Score, Red Feedback, Failure Sound.

        if (this.validWords.has(word)) {
            this.score += word.length * 10;
            this.foundWords++;
            this.scoreText.setText(`Words: ${this.foundWords} (Score: ${this.score})`);
            this.showFeedback("VALID!", 0x00FF00);
            SoundSynthesizer.instance.playSuccess();
            this.replaceSelected();
        } else if (word.length >= 4) {
            // "Fake it till you make it" / Research Notes
            this.score += word.length * 1; // Pittance (1 pt per letter)
            // Do NOT increment foundWords
            this.scoreText.setText(`Words: ${this.foundWords} (Score: ${this.score})`);
            this.showFeedback("Research Note", 0x00FFFF);
            SoundSynthesizer.instance.playChime();
            this.replaceSelected();
        } else {
            this.showFeedback("Unknown Word", 0xFF0000);
            SoundSynthesizer.instance.playFailure();
            this.clearSelection();
        }
    }

    replaceSelected() {
        // Remove chars and drop down (simple refill for now)
        this.selectedCells.forEach(c => {
            const vowels = "AEIOU";
            const common = "EOTAINSHR";
            // Reroll char
            let char = '';
            const r = Math.random();
            if(r < 0.4) char = vowels[Math.floor(Math.random() * vowels.length)]; // Higher vowel chance on refill
            else if(r < 0.8) char = common[Math.floor(Math.random() * common.length)];
            else char = String.fromCharCode(65 + Math.floor(Math.random() * 26));

            c.char = char;
            // Update Text (Need ref to text obj? We didn't store it. Re-render entire grid is easiest for this prototype)
        });

        this.renderGrid();
        this.selectedCells = [];
    }

    showFeedback(msg, color) {
        const t = this.add.text(400, 100, msg, { fontSize: '40px', color: '#FFF', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        t.setTint(color);
        this.tweens.add({ targets: t, y: 80, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
    }

    endGame() {
        this.game.events.emit('STUDY_COMPLETE', { score: this.foundWords });
        this.scene.resume('MainScene');
        this.scene.stop();
    }
}
