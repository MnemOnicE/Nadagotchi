/**
 * @fileoverview A procedural audio synthesizer using the Web Audio API.
 * Generates retro-style sound effects (beeps, chirps, buzzes) without requiring external assets.
 * Handles AudioContext lifecycle and user-gesture resumption.
 */
export class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        // Lazy initialization on first user interaction
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new SoundSynthesizer();
        }
        return this._instance;
    }

    /**
     * Initializes the AudioContext if needed and resumes it.
     * Must be called inside a user interaction handler.
     */
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.warn("AudioContext resume failed", e));
        }
    }

    /**
     * Plays a short "blip" sound for UI interactions.
     */
    playClick() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }

    /**
     * Plays a rising major arpeggio for success.
     */
    playSuccess() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const start = now + (i * 0.08);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);

            osc.start(start);
            osc.stop(start + 0.25);
        });
    }

    /**
     * Plays a low, descending "buzz" for failure or bad events.
     */
    playFailure() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    /**
     * Plays a pleasant chime for events like "Level Up" or "Achievement".
     */
    playChime() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1); // A6

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.1);
    }
}
