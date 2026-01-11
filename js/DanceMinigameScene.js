import { EventKeys } from './EventKeys.js';
import { ButtonFactory } from './ButtonFactory.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';

/**
 * @class DanceMinigameScene
 * @extends Phaser.Scene
 * @classdesc
 * A Rhythm Game (DDR-style) for the 'Play' action.
 * Arrows scroll up, player must press arrow keys in time.
 */
export class DanceMinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DanceMinigameScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#220033'); // Dark purple disco

        // --- State ---
        this.score = 0;
        this.combo = 0;
        this.isPlaying = true;
        this.scrollSpeed = 200; // Pixels per second
        this.spawnRate = 1000; // ms
        this.nextSpawn = 0;

        // --- Lanes ---
        // Left, Down, Up, Right
        this.lanes = [
            { key: 'LEFT', x: 200, input: 'LEFT' },
            { key: 'DOWN', x: 300, input: 'DOWN' },
            { key: 'UP', x: 400, input: 'UP' },
            { key: 'RIGHT', x: 500, input: 'RIGHT' }
        ];

        // --- Visuals ---
        // Target Line (Top)
        this.targetY = 100;
        this.add.line(0, 0, 150, this.targetY, 650, this.targetY, 0xFFFFFF).setOrigin(0);

        // Lane Indicators (Targets)
        this.laneTargets = [];
        this.lanes.forEach(lane => {
            const t = this.add.text(lane.x, this.targetY, this.getArrowChar(lane.key), {
                fontSize: '40px', color: '#555555'
            }).setOrigin(0.5);
            this.laneTargets.push(t);
        });

        // Notes Group
        this.notes = [];

        // Score Text
        this.scoreText = this.add.text(20, 20, "Score: 0", { fontFamily: 'VT323', fontSize: '32px' });
        this.comboText = this.add.text(20, 50, "Combo: 0", { fontFamily: 'VT323', fontSize: '24px', color: '#FFFF00' });

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();

        // Input Listeners
        this.input.keyboard.on('keydown-LEFT', () => this.handleInput('LEFT'));
        this.input.keyboard.on('keydown-DOWN', () => this.handleInput('DOWN'));
        this.input.keyboard.on('keydown-UP', () => this.handleInput('UP'));
        this.input.keyboard.on('keydown-RIGHT', () => this.handleInput('RIGHT'));

        // Timer to end game
        this.gameTimer = this.time.addEvent({ delay: 30000, callback: this.endGame, callbackScope: this }); // 30s song
        this.timeLeftText = this.add.text(700, 20, "30s", { fontFamily: 'VT323', fontSize: '32px' });
    }

    getArrowChar(key) {
        switch(key) {
            case 'LEFT': return '←';
            case 'DOWN': return '↓';
            case 'UP': return '↑';
            case 'RIGHT': return '→';
        }
    }

    spawnNote() {
        // Pick random lane
        const laneIdx = Phaser.Math.Between(0, 3);
        const lane = this.lanes[laneIdx];

        // Spawn at bottom
        const startY = this.cameras.main.height + 50;
        const note = this.add.text(lane.x, startY, this.getArrowChar(lane.key), {
            fontSize: '40px', color: '#00FF00'
        }).setOrigin(0.5);

        note.laneKey = lane.key;
        this.notes.push(note);
    }

    handleInput(key) {
        if (!this.isPlaying) return;

        // Find nearest note in this lane
        // Filter notes by lane
        const laneNotes = this.notes.filter(n => n.laneKey === key && n.active);

        // Sort by distance to target (closest first)
        // Since they move Up, smaller Y is closer to targetY
        // But we want to hit them when they are AT targetY.
        // Closest note is the one with smallest abs(y - targetY)

        if (laneNotes.length === 0) {
            this.breakCombo();
            return;
        }

        // Find closest
        let closest = null;
        let minDist = 9999;

        laneNotes.forEach(n => {
            const dist = Math.abs(n.y - this.targetY);
            if (dist < minDist) {
                minDist = dist;
                closest = n;
            }
        });

        // Hit Window
        // Perfect: < 20px
        // Good: < 40px
        // Miss: > 60px

        if (minDist < 20) {
            this.hitNote(closest, 100, "PERFECT!");
        } else if (minDist < 50) {
            this.hitNote(closest, 50, "GOOD");
        } else {
            this.breakCombo();
            // Visual feedback for miss?
            const indicator = this.laneTargets[this.lanes.findIndex(l => l.key === key)];
            indicator.setColor('#FF0000');
            this.time.delayedCall(100, () => indicator.setColor('#555555'));
        }
    }

    hitNote(note, points, label) {
        this.score += points + (this.combo * 10);
        this.combo++;
        this.scoreText.setText(`Score: ${this.score}`);
        this.comboText.setText(`Combo: ${this.combo}`);

        // Feedback
        const floatText = this.add.text(note.x, note.y, label, { fontSize: '20px', color: '#FFFF00', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
        this.tweens.add({ targets: floatText, y: note.y - 50, alpha: 0, duration: 500, onComplete: () => floatText.destroy() });

        // Destroy note
        note.destroy();
        this.notes = this.notes.filter(n => n !== note);

        // Flash target
        const laneIdx = this.lanes.findIndex(l => l.key === note.laneKey);
        this.laneTargets[laneIdx].setColor('#00FFFF');
        this.time.delayedCall(100, () => this.laneTargets[laneIdx].setColor('#555555'));
    }

    breakCombo() {
        this.combo = 0;
        this.comboText.setText(`Combo: ${this.combo}`);
        SoundSynthesizer.instance.playFailure();
    }

    update(time, delta) {
        if (!this.isPlaying) return;

        // Timer Text
        const left = Math.max(0, Math.ceil(30 - this.gameTimer.getElapsedSeconds()));
        this.timeLeftText.setText(`${left}s`);

        // Spawner
        if (time > this.nextSpawn) {
            this.spawnNote();
            // Increase speed/rate slightly?
            this.nextSpawn = time + this.spawnRate;
            // Randomize rate slightly
            this.nextSpawn += Phaser.Math.Between(-200, 200);
        }

        // Mover
        const moveDist = (this.scrollSpeed * delta) / 1000;

        // We iterate backwards to safely remove
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.y -= moveDist; // Moving UP

            // Miss check (passed target)
            if (note.y < this.targetY - 50) {
                this.breakCombo();
                note.destroy();
                this.notes.splice(i, 1);
            }
        }
    }

    endGame() {
        this.isPlaying = false;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.8);
        this.add.text(w/2, h/2 - 50, "DANCE COMPLETE!", { fontFamily: 'VT323', fontSize: '48px', color: '#FF00FF' }).setOrigin(0.5);
        this.add.text(w/2, h/2 + 20, `Final Score: ${this.score}`, { fontFamily: 'VT323', fontSize: '32px' }).setOrigin(0.5);

        const btn = ButtonFactory.createButton(this, w/2, h/2 + 100, "Finish", () => {
             // Return to MainScene with generic success for now (handled by Play action logic)
             // We can pass data if we want special rewards later
             this.scene.stop();
             this.scene.resume('MainScene');

             // Trigger standard Play effects via MainScene helper or direct Nadagotchi call?
             // MainScene usually handles UI_ACTION -> Nadagotchi.handleAction.
             // But we replaced that flow. We need to manually trigger the "Play" effects.
             // Better: Emit event back to MainScene
             this.game.events.emit(EventKeys.UI_ACTION, 'PLAY_COMPLETE', { score: this.score });
        }, { width: 150, height: 50 });
    }
}
