/**
 * @fileoverview Cryptographic utilities for secure storage.
 * Implements synchronous SHA-256, HMAC-SHA256, and a hash-based stream cipher.
 * Designed for client-side obfuscation and integrity verification without async dependencies.
 */

// Polyfill TextEncoder/TextDecoder for Jest/Node environments that miss it
if (typeof TextEncoder === 'undefined' && typeof require !== 'undefined') {
    try {
        const util = require('util');
        global.TextEncoder = util.TextEncoder;
        global.TextDecoder = util.TextDecoder;
    } catch (e) {
        // Ignore if require fails
    }
}

// SHA-256 Constants (FIPS 180-2)
const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

// Bitwise Helpers
function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
function ch(x, y, z) { return (x & y) ^ (~x & z); }
function maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
function sigma0(x) { return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x); }
function sigma1(x) { return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x); }
function gamma0(x) { return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3); }
function gamma1(x) { return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10); }

/**
 * Computes the SHA-256 hash of a string or Uint8Array.
 * @param {string|Uint8Array} message - The input message.
 * @returns {string} The hex string of the hash.
 */
export function sha256(message) {
    let msgBuffer;
    if (typeof message === 'string') {
        msgBuffer = new TextEncoder().encode(message);
    } else {
        msgBuffer = message;
    }

    const len = msgBuffer.length * 8; // Length in bits

    // Padding
    // Append '1', then '0's, then 64-bit length to make total length multiple of 512 bits (64 bytes)
    const paddedLen = ((msgBuffer.length + 8) >>> 6) + 1 << 6;
    const padded = new Uint8Array(paddedLen);
    padded.set(msgBuffer);
    padded[msgBuffer.length] = 0x80;

    const view = new DataView(padded.buffer);
    // Length in big-endian at the end (using only lower 32 bits for simplicity, assuming msg < 4GB)
    view.setUint32(paddedLen - 4, len, false);

    // Initial Hash Values
    let H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const W = new Uint32Array(64);

    for (let i = 0; i < paddedLen; i += 64) {
        // Message Schedule
        for (let j = 0; j < 16; j++) {
            W[j] = view.getUint32(i + (j * 4), false);
        }
        for (let j = 16; j < 64; j++) {
            W[j] = (gamma1(W[j - 2]) + W[j - 7] + gamma0(W[j - 15]) + W[j - 16]) | 0;
        }

        let [a, b, c, d, e, f, g, h] = H;

        for (let j = 0; j < 64; j++) {
            const T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0;
            const T2 = (sigma0(a) + maj(a, b, c)) | 0;
            h = g; g = f; f = e;
            e = (d + T1) | 0;
            d = c; c = b; b = a;
            a = (T1 + T2) | 0;
        }

        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0;
        H[5] = (H[5] + f) | 0;
        H[6] = (H[6] + g) | 0;
        H[7] = (H[7] + h) | 0;
    }

    return H.map(h => (h >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * Computes HMAC-SHA256.
 * @param {string} key - The secret key.
 * @param {string} message - The message to authenticate.
 * @returns {string} The HMAC hex string.
 */
export function hmacSha256(key, message) {
    const blockSize = 64; // SHA-256 block size in bytes
    let keyBytes = new TextEncoder().encode(key);

    // Hash key if longer than block size
    if (keyBytes.length > blockSize) {
        const hash = sha256(keyBytes); // returns hex string
        // Convert hex string back to Uint8Array
        keyBytes = hexToBytes(hash);
    }

    // Pad key with zeros if shorter than block size
    if (keyBytes.length < blockSize) {
        const newKey = new Uint8Array(blockSize);
        newKey.set(keyBytes);
        keyBytes = newKey;
    }

    const oPad = new Uint8Array(blockSize);
    const iPad = new Uint8Array(blockSize);

    for (let i = 0; i < blockSize; i++) {
        oPad[i] = keyBytes[i] ^ 0x5c;
        iPad[i] = keyBytes[i] ^ 0x36;
    }

    // Inner hash: SHA256(iPad + message)
    // Manually concatenate byte arrays
    const msgBytes = new TextEncoder().encode(message);
    const innerInput = new Uint8Array(blockSize + msgBytes.length);
    innerInput.set(iPad);
    innerInput.set(msgBytes, blockSize);

    const innerHashHex = sha256(innerInput);
    const innerHashBytes = hexToBytes(innerHashHex);

    // Outer hash: SHA256(oPad + innerHash)
    const outerInput = new Uint8Array(blockSize + innerHashBytes.length);
    outerInput.set(oPad);
    outerInput.set(innerHashBytes, blockSize);

    return sha256(outerInput);
}

/**
 * Encrypts data using a hash-based stream cipher.
 * @param {string} data - The plaintext string (e.g., JSON).
 * @param {string} key - The secret key.
 * @returns {string} The ciphertext as a hex string.
 */
export function encrypt(data, key) {
    const dataBytes = new TextEncoder().encode(data);
    const result = new Uint8Array(dataBytes.length);

    // Key derivation for stream: SHA256(key + counter)
    let counter = 0;
    let keystream = new Uint8Array(0);

    for (let i = 0; i < dataBytes.length; i++) {
        // Generate a new block of keystream every 32 bytes
        if (i % 32 === 0) {
            const blockHashHex = sha256(key + (counter++).toString());
            keystream = hexToBytes(blockHashHex);
        }

        result[i] = dataBytes[i] ^ keystream[i % 32];
    }

    return bytesToHex(result);
}

/**
 * Decrypts data (same as encrypt for XOR cipher).
 * @param {string} ciphertextHex - The ciphertext hex string.
 * @param {string} key - The secret key.
 * @returns {string} The decrypted plaintext string.
 */
export function decrypt(ciphertextHex, key) {
    const dataBytes = hexToBytes(ciphertextHex);
    const result = new Uint8Array(dataBytes.length);

    let keystream = new Uint8Array(0);
    let counter = 0;

    for (let i = 0; i < dataBytes.length; i++) {
        if (i % 32 === 0) {
            const blockHashHex = sha256(key + (counter++).toString());
            keystream = hexToBytes(blockHashHex);
        }
        result[i] = dataBytes[i] ^ keystream[i % 32];
    }

    return new TextDecoder().decode(result);
}

// Helpers
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
