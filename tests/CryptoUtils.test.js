import { CryptoUtils } from '../js/utils/CryptoUtils.js';

describe('CryptoUtils', () => {
    it('should generate a consistent SHA-256 hash', async () => {
        const message = "Hello";
        const salt = "World";
        const hash = await CryptoUtils.generateHash(message, salt);

        expect(hash).toBeDefined();
        expect(hash).toHaveLength(64); // SHA-256 hex is 64 chars

        // SHA-256("HelloWorld")
        // Expected: 872e4e50ce9990d8b041330c47c9ddd11bec6b503ae9386a99da8584e9bb12c4
        expect(hash).toBe('872e4e50ce9990d8b041330c47c9ddd11bec6b503ae9386a99da8584e9bb12c4');
    });

    it('should generate different hashes for different inputs', async () => {
        const hash1 = await CryptoUtils.generateHash("A", "Salt");
        const hash2 = await CryptoUtils.generateHash("B", "Salt");
        expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters', async () => {
        const hash = await CryptoUtils.generateHash("!@#$%", "SafeSalt");
        expect(hash).toHaveLength(64);
    });
});
