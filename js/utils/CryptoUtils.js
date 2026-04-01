/**
 * @fileoverview Utility class for cryptographic operations.
 * Provides a unified interface for hashing (SHA-256) across Browser and Node.js environments.
 */

export class CryptoUtils {
    /**
     * Generates a SHA-256 hash of the input string + salt.
     * @param {string} message - The string to hash.
     * @param {string} salt - The salt to append.
     * @returns {Promise<string>} The hash as a hex string.
     */
    static async generateHash(message, salt) {
        const data = message + salt;

        // Browser Environment
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            // Ensure TextEncoder is available
            const Encoder = (typeof TextEncoder === 'undefined')
                ? class { encode(s) { return new Uint8Array([...s].map(c => c.charCodeAt(0))); } }
                : TextEncoder;

            const encoder = new Encoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }

        // Node.js Environment (Jest/Test)
        // We check for 'process' to avoid bundling issues in some build tools, though 'require' check is usually enough.
        if (typeof process !== 'undefined' && typeof require !== 'undefined') {
            try {
                // Dynamic require to prevent bundlers from trying to bundle 'crypto' for the browser
                // (though Vite usually handles this gracefully or ignores it)
                const crypto = require('crypto');
                return crypto.createHash('sha256').update(data).digest('hex');
            } catch (e) {
                console.warn("Crypto module not found in Node environment.", e);
            }
        }

        // Fallback for very old environments or strict CSP blocking (Should fail secure)
        throw new Error("Secure hashing (SHA-256) not available in this environment.");
    }

    /**
     * Generates a cryptographically secure random integer between min and max (inclusive).
     * @param {number} min - Minimum value.
     * @param {number} max - Maximum value.
     * @returns {number} The random integer.
     */
    static getRandomSafeInt(min, max) {
        const range = max - min + 1;
        if (range <= 0) return min;

        const maxUint32 = 4294967295;

        // For extremely large ranges, we combine two 32-bit random values
        if (range > maxUint32) {
            const high = this._get32BitRandom();
            const low = this._get32BitRandom();
            const combined = (BigInt(high) << 32n) | BigInt(low);
            const bigRange = BigInt(max) - BigInt(min) + 1n;
            return Number((combined % bigRange) + BigInt(min));
        }

        const limit = maxUint32 - (maxUint32 % range);
        let randomValue;

        do {
            randomValue = this._get32BitRandom();
        } while (randomValue >= limit);

        return (randomValue % range) + min;
    }

    /**
     * Internal helper to get a random 32-bit unsigned integer.
     * @returns {number}
     * @private
     * @throws {Error} If no secure random source is available.
     */
    static _get32BitRandom() {
        // Browser Environment
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0];
        }
        // Node.js Environment
        if (typeof process !== 'undefined' && typeof require !== 'undefined') {
            try {
                const crypto = require('crypto');
                return crypto.randomBytes(4).readUInt32BE(0);
            } catch (e) {
                // Ignore and proceed to error
            }
        }
        throw new Error("No cryptographically secure random number generator available.");
    }
}
