/**
 * @fileoverview Utility functions for encoding and decoding strings, ensuring compatibility across Browser and Node.js environments.
 */

/**
 * Encodes a string to Base64.
 * Uses `btoa` in browser environments and `Buffer` in Node.js.
 * @param {string} str - The string to encode.
 * @returns {string} The Base64 encoded string.
 */
export const toBase64 = (str) => {
    if (typeof btoa === 'function') {
        return btoa(str);
    } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
    } else {
        throw new Error('Base64 encoding not supported in this environment.');
    }
};

/**
 * Decodes a Base64 string.
 * Uses `atob` in browser environments and `Buffer` in Node.js.
 * @param {string} str - The Base64 string to decode.
 * @returns {string} The decoded string (UTF-8).
 */
export const fromBase64 = (str) => {
    if (typeof atob === 'function') {
        return atob(str);
    } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString('utf-8');
    } else {
        throw new Error('Base64 decoding not supported in this environment.');
    }
};
