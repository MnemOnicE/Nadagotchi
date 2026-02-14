
/**
 * @fileoverview Cryptographic utility functions for secure data handling.
 * Wraps the Web Crypto API for hashing and integrity checks.
 */

// Polyfill TextEncoder/TextDecoder for environments where they are missing (e.g. some Jest setups)
if (typeof global !== 'undefined' && !global.TextEncoder) {
    try {
        const { TextEncoder, TextDecoder } = require('util');
        global.TextEncoder = TextEncoder;
        global.TextDecoder = TextDecoder;
    } catch (e) {
        console.warn("TextEncoder/TextDecoder polyfill failed:", e);
    }
}

export class CryptoUtils {
    /**
     * Generates a SHA-256 hash of the input string using the Web Crypto API.
     * @param {string} message - The string to hash.
     * @returns {Promise<string>} The hex string of the hash.
     */
    static async digest(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        // Browser / Modern Node.js (v19+)
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Node.js fallback (v16-v18)
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
             try {
                 // Use dynamic import to avoid bundling issues in browser
                 const { webcrypto } = await import('node:crypto');
                 if (webcrypto && webcrypto.subtle) {
                     const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
                     return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
                 }
             } catch (e) {
                 console.warn("Node crypto import failed:", e);
             }
        }

        throw new Error("Secure Context Required: crypto.subtle not available.");
    }
}
