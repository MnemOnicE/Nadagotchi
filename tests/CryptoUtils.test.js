
import { CryptoUtils } from '../js/utils/CryptoUtils.js';

describe('CryptoUtils', () => {
    test('should hash a string using SHA-256', async () => {
        // Known SHA-256 hash for "test"
        const input = "test";
        const expected = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        const result = await CryptoUtils.digest(input);
        expect(result).toBe(expected);
    });

    test('should return different hashes for different inputs', async () => {
        const hash1 = await CryptoUtils.digest("test1");
        const hash2 = await CryptoUtils.digest("test2");
        expect(hash1).not.toBe(hash2);
        expect(hash1.length).toBe(64); // SHA-256 hex length
    });
});
