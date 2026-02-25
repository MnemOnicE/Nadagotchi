// tests/HousingSystemII.test.js
import { PersistenceManager } from '../js/PersistenceManager.js';
import { setupLocalStorageMock } from './helpers/mockLocalStorage.js';

// Mock dependencies
jest.mock('../js/utils/SoundSynthesizer', () => ({
    SoundSynthesizer: {
        instance: {
            playClick: jest.fn(),
            playSuccess: jest.fn(),
            playFailure: jest.fn(),
            playChime: jest.fn()
        }
    }
}));

describe('Housing System II', () => {
    let persistence;

    beforeEach(() => {
        setupLocalStorageMock();
        persistence = new PersistenceManager();
        localStorage.clear();
    });

    describe('PersistenceManager Migration', () => {
        test('Migrates legacy furniture array to Entryway object', async () => {
            // Setup Legacy Data: Array of items
            const legacyData = [{ key: 'Chair', x: 10, y: 10 }];
            // Manually save legacy format (bypass _save hash if possible or assume old format)
            // Since we upgraded _save to use hash, we can mock localStorage directly or use internal _save
            // For testing migration logic inside _load, we need to inject raw string.
            // Using public setter for simplicity if exposed, or just rely on the logic:
            // loadFurniture() calls _load. If _load returns array, it wraps it.

            // We need to trick _load to return the array.
            // Let's mock _load temporarily or simulate it.
            // But we are testing PersistenceManager logic itself.

            // Let's spy on _load to return legacy data
            const spy = jest.spyOn(persistence, '_load').mockResolvedValue(legacyData);

            const result = await persistence.loadFurniture();
            expect(result).toHaveProperty('Entryway');
            expect(result.Entryway).toHaveLength(1);
            expect(result.Entryway[0].key).toBe('Chair');

            spy.mockRestore();
        });

        test('Migrates legacy home config to Entryway object', async () => {
            const legacyData = { wallpaper: 'Blue', flooring: 'Wood' };
            const spy = jest.spyOn(persistence, '_load').mockResolvedValue(legacyData);

            const result = await persistence.loadHomeConfig();
            expect(result).toHaveProperty('rooms');
            expect(result.rooms.Entryway.wallpaper).toBe('Blue');

            spy.mockRestore();
        });
    });
});
