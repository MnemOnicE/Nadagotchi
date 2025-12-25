import { Config } from '../Config.js';

/**
 * @class SoundSynthesizer
 * @classdesc
 * A Singleton utility class for procedurally generating sound effects (SFX) using the Web Audio API.
 * This avoids the need for external audio assets, keeping the game lightweight.
 *
 * It supports:
 * - Simple oscillator tones (Sine, Square, Sawtooth, Triangle)
 * - White noise generation (for percussion/explosions)
 * - ADSR Envelopes (Attack, Decay, Sustain, Release) for natural sound shaping.
 */
export class SoundSynthesizer {
    constructor() {
        if (SoundSynthesizer.instance) {
            return SoundSynthesizer.instance;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);

            // Set initial volume
            this.setVolume(Config.SETTINGS.DEFAULT_VOLUME);
        } catch (e) {
            console.warn('Web Audio API not supported or blocked.', e);
            this.ctx = null;
        }

        SoundSynthesizer.instance = this;
    }

    /**
     * Sets the master volume for all generated sounds.
     * @param {number} volume - A value between 0.0 (mute) and 1.0 (max).
     */
    setVolume(volume) {
        if (!this.ctx) return;
        // Clamp volume between 0 and 1 for safety
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.masterGain.gain.value = clampedVolume;
    }

    /**
     * Plays a single oscillator tone with an envelope.
     * @param {number} freq - The frequency in Hertz (Hz). Must be positive.
     * @param {string} type - The waveform type ('sine', 'square', 'sawtooth', 'triangle').
     * @param {number} duration - The duration of the sound in seconds.
     */
    playTone(freq, type, duration) {
        if (!this.ctx) return;

        // Security/Safety Checks
        if (!Number.isFinite(freq) || freq <= 0) {
            console.warn(`SoundSynthesizer: Invalid frequency ${freq}`);
            return;
        }
        if (!Number.isFinite(duration) || duration <= 0 || duration > 5) {
             console.warn(`SoundSynthesizer: Invalid duration ${duration}`);
             return;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Connect: Osc -> Gain -> Master
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();

        // Simple ADSR Envelope
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + duration * 0.1); // Attack
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay

        osc.stop(now + duration);

        // Cleanup to prevent memory leaks
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, duration * 1000 + 100);
    }

    /**
     * Generates and plays a burst of white noise.
     * Useful for impacts, explosions, or rough textures.
     * @param {number} duration - The duration in seconds.
     */
    generateNoise(duration) {
        if (!this.ctx) return;

        // Safety Check
        if (!Number.isFinite(duration) || duration <= 0 || duration > 5) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Fill buffer with random noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        // Connect: Noise -> Gain -> Master
        noise.connect(gain);
        gain.connect(this.masterGain);

        // Envelope for Noise (percussive)
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.start();

        // Cleanup
        setTimeout(() => {
            noise.disconnect();
            gain.disconnect();
        }, duration * 1000 + 100);
    }

    // --- PRESETS ---

    /**
     * Plays a high-pitched 'ding' for UI clicks.
     */
    playClick() {
        this.playTone(800, 'sine', 0.1);
    }

    /**
     * Plays a cheerful rising arpeggio for success events.
     */
    playSuccess() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playTone(440, 'sine', 0.2); // A4
        setTimeout(() => this.playTone(554, 'sine', 0.2), 100); // C#5
        setTimeout(() => this.playTone(659, 'sine', 0.4), 200); // E5
    }

    /**
     * Plays a low, discordant sound for failure events.
     */
    playFailure() {
        this.playTone(150, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.4), 100);
    }

    /**
     * Plays a magical chime sound.
     */
    playChime() {
        this.playTone(1000, 'triangle', 0.5);
        setTimeout(() => this.playTone(1500, 'sine', 0.5), 100);
    }

    /**
     * Plays a soft ambient hum (experimental).
     */
    playAmbience() {
         // Low frequency sine wave
         this.playTone(50, 'sine', 2.0);
    }
}
