/**
 * @fileoverview A seeded pseudo-random number generator (PRNG) using the Mulberry32 algorithm.
 * Provides deterministic randomness for game logic, genetics, and event generation.
 */

export class SeededRandom {
    /**
     * Creates a new SeededRandom instance.
     * @param {number|string} seed - The initial seed value. If a string is provided, it is hashed to a number.
     */
    constructor(seed) {
        this.seed = this._hashSeed(seed);
        this.state = this.seed;
    }

    /**
     * Hashes a string seed to a number, or uses the number directly.
     * Simple hash function (cyrb53-like or similar) to ensure good distribution.
     * @param {number|string} seed
     * @returns {number}
     * @private
     */
    _hashSeed(seed) {
        if (typeof seed === 'number') {
            return seed >>> 0; // Ensure unsigned 32-bit integer
        }

        // Simple string hashing (djb2-like)
        let str = String(seed);
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 33) ^ str.charCodeAt(i);
        }
        return hash >>> 0;
    }

    /**
     * Generates a random float between 0 (inclusive) and 1 (exclusive).
     * Uses the Mulberry32 algorithm.
     * @returns {number} A float [0, 1).
     */
    random() {
        this.state = (this.state + 0x6D2B79F5) >>> 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Generates a random integer between min (inclusive) and max (exclusive).
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (exclusive).
     * @returns {number} An integer [min, max).
     */
    range(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    }

    /**
     * Selects a random element from an array.
     * @param {Array} array - The array to select from.
     * @returns {*} A random element from the array, or null if empty.
     */
    choice(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.random() * array.length)];
    }

    /**
     * Returns true with the specified probability.
     * @param {number} probability - The probability (0 to 1).
     * @returns {boolean} True if the check passes.
     */
    chance(probability) {
        return this.random() < probability;
    }
}
