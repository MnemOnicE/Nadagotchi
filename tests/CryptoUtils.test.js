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

describe('CryptoUtils Error Handling', () => {
    let originalCrypto;
    let originalProcess;

    beforeEach(() => {
        // Save originals
        originalCrypto = window.crypto;
        originalProcess = global.process;
    });

    afterEach(() => {
        // Restore originals
        Object.defineProperty(window, 'crypto', {
            value: originalCrypto,
            writable: true,
            configurable: true
        });
        global.process = originalProcess;
        jest.restoreAllMocks();
        jest.unmock('crypto');
    });

    it('should throw error in _get32BitRandom when no crypto environment is available', () => {
        // 1. Remove browser crypto
        Object.defineProperty(window, 'crypto', {
            value: undefined,
            writable: true,
            configurable: true
        });

        // 2. Make require('crypto') throw
        jest.doMock('crypto', () => {
            throw new Error('No crypto module');
        }, { virtual: true });

        // Act & Assert
        expect(() => {
            CryptoUtils._get32BitRandom();
        }).toThrow("No cryptographically secure random number generator available.");
    });

    it('should throw error in generateHash when no crypto environment is available', async () => {
        // 1. Remove browser crypto
        Object.defineProperty(window, 'crypto', {
            value: undefined,
            writable: true,
            configurable: true
        });

        // 2. Make require('crypto') throw
        jest.doMock('crypto', () => {
            throw new Error('No crypto module');
        }, { virtual: true });

        // Suppress console.warn for cleaner test output
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Act & Assert
        await expect(CryptoUtils.generateHash("test", "salt"))
            .rejects
            .toThrow("Secure hashing (SHA-256) not available in this environment.");

        warnSpy.mockRestore();
    });
});
