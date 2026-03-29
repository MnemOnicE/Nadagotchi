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

    describe('getRandomValues', () => {
        it('should fill a Uint8Array with random values', () => {
            const arr = new Uint8Array(10);
            CryptoUtils.getRandomValues(arr);
            // It's extremely unlikely (1 in 256^10) that all values remain 0
            const allZero = Array.from(arr).every(v => v === 0);
            expect(allZero).toBe(false);
        });

        it('should fill different types of arrays', () => {
            const arr32 = new Uint32Array(5);
            CryptoUtils.getRandomValues(arr32);
            const allZero = Array.from(arr32).every(v => v === 0);
            expect(allZero).toBe(false);
        });
    });

    describe('getRandomSafeInt', () => {
        it('should return a number within the safe integer range', () => {
            for (let i = 0; i < 100; i++) {
                const val = CryptoUtils.getRandomSafeInt();
                expect(Number.isSafeInteger(val)).toBe(true);
                expect(val).toBeGreaterThanOrEqual(0);
                expect(val).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
            }
        });

        it('should generate different values on subsequent calls', () => {
            const val1 = CryptoUtils.getRandomSafeInt();
            const val2 = CryptoUtils.getRandomSafeInt();
            expect(val1).not.toBe(val2);
        });
    });
});
