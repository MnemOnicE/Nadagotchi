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
}
