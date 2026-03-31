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
        if (typeof require === 'function') {
            try {
                const nodeCrypto = require('crypto');
                if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
                    return nodeCrypto.createHash('sha256').update(data).digest('hex');
                }
            } catch (err) {
                console.warn("Crypto module not found in Node environment.", err);
            }
        }

        // Fallback for very old environments or strict CSP blocking (Should fail secure)
        throw new Error("Secure hashing (SHA-256) not available in this environment.");
    }

    /**
     * Fills a typed array with cryptographically strong random values.
     * Works in both Browser and Node.js environments.
     * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|BigInt64Array|BigUint64Array} typedArray
     * @returns {TypedArray} The same array filled with random values.
     */
    static getRandomValues(typedArray) {
        // Browser Environment
        if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
            return window.crypto.getRandomValues(typedArray);
        }

        // Node.js Environment (Jest/Test)
        if (typeof require === 'function') {
            try {
                const nodeCrypto = require('crypto');
                if (nodeCrypto && typeof nodeCrypto.randomFillSync === 'function') {
                    return nodeCrypto.randomFillSync(typedArray);
                }
            } catch (err) {
                // Fallback to error below
            }
        }

        throw new Error("Secure random generation (getRandomValues) not available in this environment.");
    }

    /**
     * Generates a cryptographically secure random integer between 0 and Number.MAX_SAFE_INTEGER.
     * Useful for seeds and unique IDs.
     * @returns {number} A random integer [0, 2^53 - 1].
     */
    static getRandomSafeInt() {
        const arr = new Uint32Array(2);
        this.getRandomValues(arr);
        // Combine 32 bits from arr[0] and 21 bits from arr[1] for 53 bits of entropy.
        // (2^53 - 1 is Number.MAX_SAFE_INTEGER)
        const low = arr[0];
        const high = arr[1] & 0x1FFFFF;
        return (high * 0x100000000) + low;
    }
}
