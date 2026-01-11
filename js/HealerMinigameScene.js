import { EventKeys } from './EventKeys.js';
import { ButtonFactory } from './ButtonFactory.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';

/**
 * @fileoverview A mini-game for the Healer career.
 * Involves diagnosing symptoms and selecting the correct remedy.
 */

/**
 * @class HealerMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A mini-game for the 'Healer' career path.
 * The player must diagnose a patient's symptom and select the correct remedy from a list of options.
 * Now features a Timer and Multi-Symptom puzzles.
 */
export class HealerMinigameScene extends Phaser.Scene {
    /**
     * Creates an instance of HealerMinigameScene.
     */
    constructor() {
        super({ key: 'HealerMinigameScene' });
    }

    /**
     * Phaser lifecycle method. Called once when the scene is created.
     */
    create() {
        this.cameras.main.setBackgroundColor('#ADD8E6'); // Light blue, clinical feel

        // --- Game Config ---
        const totalTime = 15000; // 15 seconds
        this.timeLeft = totalTime;
        this.timerRunning = true;

        // --- Data ---
        const allAilments = [
            { symptom: { emoji: '🤒', text: 'Fever' }, remedy: { emoji: '🌿', name: 'Cooling Herb' } },
            { symptom: { emoji: '😢', text: 'Sadness' }, remedy: { emoji: '💖', name: 'Happy Potion' } },
            { symptom: { emoji: '💨', text: 'Cough' }, remedy: { emoji: '🍯', name: 'Soothing Syrup' } },
            { symptom: { emoji: '😵', text: 'Dizziness' }, remedy: { emoji: '🌰', name: 'Stabilizing Root' } },
            { symptom: { emoji: '🤢', text: 'Nausea' }, remedy: { emoji: '🍵', name: 'Ginger Tea' } },
            { symptom: { emoji: '🥶', text: 'Chills' }, remedy: { emoji: '🔥', name: 'Fire Flower' } }
        ];

        // Generate Puzzle (1 to 3 symptoms)
        const difficulty = 2; // Fixed difficulty for now, could scale with level
        const patientSymptoms = [];
        const requiredRemedies = new Set();

        // Pick random unique ailments
        const shuffled = Phaser.Utils.Array.Shuffle([...allAilments]);
        for(let i=0; i<difficulty; i++) {
            patientSymptoms.push(shuffled[i].symptom);
            requiredRemedies.add(shuffled[i].remedy.name);
        }

        // Generate Options (Required + Distractors)
        let options = patientSymptoms.map(s => shuffled.find(a => a.symptom === s).remedy);
        // Add distractors
        for(let i=difficulty; i<difficulty+2; i++) {
            if(shuffled[i]) options.push(shuffled[i].remedy);
        }
        options = Phaser.Utils.Array.Shuffle(options);

        // State for Selection
        this.selectedRemedies = new Set();

        // --- UI ---
        this.add.text(this.cameras.main.width / 2, 40, 'DIAGNOSIS REQUIRED', { fontFamily: 'VT323', fontSize: '32px', fill: '#000' }).setOrigin(0.5);

        // Timer Bar
        this.timerBarBg = this.add.rectangle(this.cameras.main.width / 2, 80, 600, 20, 0x555555).setOrigin(0.5);
        this.timerBarFill = this.add.rectangle(this.cameras.main.width / 2 - 300, 80, 600, 20, 0x00FF00).setOrigin(0, 0.5);

        // Patient Display
        this.add.text(this.cameras.main.width / 2, 130, 'Patient Symptoms:', { fontFamily: 'VT323', fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        let symX = this.cameras.main.width / 2 - ((patientSymptoms.length - 1) * 80) / 2;
        patientSymptoms.forEach(sym => {
            this.add.text(symX, 180, sym.emoji, { fontSize: '64px' }).setOrigin(0.5);
            this.add.text(symX, 220, sym.text, { fontFamily: 'VT323', fontSize: '20px', fill: '#000' }).setOrigin(0.5);
            symX += 80;
        });

        // Remedy Buttons
        const buttonWidth = 180;
        const spacing = 20;
        // Grid layout for options (2x2 or 2x3)
        const startX = this.cameras.main.width / 2 - 100;
        const startY = 320;

        options.forEach((remedy, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = this.cameras.main.width/2 + (col === 0 ? -100 : 100);
            const y = startY + (row * 80);

            const btn = this.add.container(x, y);
            const bg = this.add.rectangle(0, 0, buttonWidth, 60, 0xFFFAF0).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
            const text = this.add.text(0, 0, `${remedy.emoji} ${remedy.name}`, { fontFamily: 'VT323', fontSize: '20px', fill: '#000' }).setOrigin(0.5);

            btn.add([bg, text]);

            bg.on('pointerdown', () => {
                if (this.selectedRemedies.has(remedy.name)) {
                    this.selectedRemedies.delete(remedy.name);
                    bg.setFillStyle(0xFFFAF0);
                } else {
                    this.selectedRemedies.add(remedy.name);
                    bg.setFillStyle(0xADD8E6); // Highlight
                }
            });
        });

        // Cure Button
        ButtonFactory.createButton(this, this.cameras.main.width / 2, 530, "ADMINISTER CURE", () => {
            this.checkSolution(requiredRemedies);
        }, { width: 300, height: 60, color: 0x4CAF50, fontSize: '32px' });

        // Tick Event
        this.events.on('update', (time, delta) => {
            if (!this.timerRunning) return;
            this.timeLeft -= delta;

            // Update Bar
            const ratio = Math.max(0, this.timeLeft / totalTime);
            this.timerBarFill.width = 600 * ratio;

            // Color Warning
            if (ratio < 0.3) this.timerBarFill.fillColor = 0xFF0000;
            else if (ratio < 0.6) this.timerBarFill.fillColor = 0xFFA500;

            if (this.timeLeft <= 0) {
                this.timerRunning = false;
                this.endGame(false, "Time's up!");
            }
        });
    }

    checkSolution(required) {
        if (!this.timerRunning) return;
        this.timerRunning = false;

        // Compare Sets
        let correct = true;
        if (this.selectedRemedies.size !== required.size) correct = false;
        for (let rem of required) {
            if (!this.selectedRemedies.has(rem)) correct = false;
        }

        if (correct) {
            this.endGame(true, "Patient Cured!");
        } else {
            this.endGame(false, "Wrong Treatment!");
        }
    }

    endGame(isSuccess, message) {
        // Overlay
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7);

        const color = isSuccess ? '#00FF00' : '#FF0000';
        this.add.text(w/2, h/2 - 20, message, { fontFamily: 'VT323', fontSize: '48px', fill: color }).setOrigin(0.5);

        // Sound handled by main scene via event usually, but local feedback is good

        this.time.delayedCall(2000, () => {
            this.game.events.emit(EventKeys.WORK_RESULT, { success: isSuccess, career: 'Healer' });
            this.scene.stop();
            this.scene.resume('MainScene');
        });
    }

    update(time, delta) {
        this.events.emit('update', time, delta);
    }
}
