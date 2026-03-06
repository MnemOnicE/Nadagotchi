<<<<<<< HEAD
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
=======

import { PersistenceManager } from '../js/PersistenceManager.js';
import { InventorySystem } from '../js/systems/InventorySystem.js';
import { RoomDefinitions } from '../js/RoomDefinitions.js';

// Mocks
const mockPet = {
    inventory: {},
    homeConfig: {},
    discoveredRecipes: [],
    recipes: {},
    stats: { energy: 100, happiness: 100 },
    persistence: { saveHomeConfig: jest.fn() },
    addJournalEntry: jest.fn(),
    getMoodMultiplier: () => 1.0,
    skills: { crafting: 0 }
};

describe('Housing System II', () => {

    describe('PersistenceManager Migration', () => {
        let persistence;

        beforeEach(() => {
            persistence = new PersistenceManager();
            // Robust Mocking of localStorage using Object.defineProperty
            const localStorageMock = (function() {
              let store = {};
              return {
                getItem: jest.fn(key => store[key] || null),
                setItem: jest.fn((key, value) => {
                  store[key] = value.toString();
                }),
                removeItem: jest.fn(key => {
                  delete store[key];
                }),
                clear: jest.fn(() => {
                  store = {};
                })
              };
            })();

            // Note: In JSDOM, localStorage is read-only on window, but we can override it if we are careful or use the existing mock
            Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true });
        });

        test('Migrates legacy furniture array to Entryway object', () => {
            // Setup Legacy Data
            const legacyData = [{ key: 'Chair', x: 10, y: 10 }];
            const encoded = btoa(JSON.stringify(legacyData));
            // Fake hash
            global.localStorage.getItem.mockReturnValueOnce(`${encoded}|FAKEHASH`);
            // Mock hash check to pass
            persistence._hash = jest.fn(() => 'FAKEHASH');

            const result = persistence.loadFurniture();
            expect(result).toHaveProperty('Entryway');
            expect(result.Entryway).toHaveLength(1);
            expect(result.Entryway[0].key).toBe('Chair');
        });

        test('Migrates legacy home config to Entryway object', () => {
             const legacyData = { wallpaper: 'Blue', flooring: 'Wood' };
             const encoded = btoa(JSON.stringify(legacyData));
             global.localStorage.getItem.mockReturnValueOnce(`${encoded}|FAKEHASH`);
             persistence._hash = jest.fn(() => 'FAKEHASH');

             const result = persistence.loadHomeConfig();
             expect(result).toHaveProperty('rooms');
             expect(result.rooms.Entryway.wallpaper).toBe('Blue');
        });
    });

    describe('InventorySystem - Room Decor', () => {
        let inventorySystem;

        beforeEach(() => {
            inventorySystem = new InventorySystem(mockPet);
            mockPet.inventory = { 'Blue Wallpaper': 1 };
            mockPet.homeConfig = { rooms: { 'Entryway': { wallpaperItem: 'Default' } } };
        });

        test('applyHomeDecor applies to specific room', () => {
            const result = inventorySystem.applyHomeDecor('Blue Wallpaper', 'Entryway');

            expect(result.success).toBe(true);
            expect(mockPet.homeConfig.rooms.Entryway.wallpaperItem).toBe('Blue Wallpaper');
            expect(mockPet.inventory['Blue Wallpaper']).toBeUndefined(); // Consumed
        });

        test('applyHomeDecor creates room config if missing', () => {
            // LivingRoom not initialized
            const result = inventorySystem.applyHomeDecor('Blue Wallpaper', 'LivingRoom');

            expect(result.success).toBe(true);
            expect(mockPet.homeConfig.rooms.LivingRoom).toBeDefined();
            expect(mockPet.homeConfig.rooms.LivingRoom.wallpaperItem).toBe('Blue Wallpaper');
        });

        test('applyHomeDecor swaps items per room', () => {
             // Setup: Entryway has Brick Wallpaper on wall
             // Inventory: 0 Brick, 1 Blue
             mockPet.homeConfig.rooms.Entryway.wallpaperItem = 'Brick Wallpaper';
             mockPet.inventory['Brick Wallpaper'] = 0;
             mockPet.inventory['Blue Wallpaper'] = 1;

             // Equip Blue to Entryway (swapping Brick)
             inventorySystem.applyHomeDecor('Blue Wallpaper', 'Entryway');

             // Should have returned Brick to inventory (0 -> 1)
             expect(mockPet.inventory['Brick Wallpaper']).toBe(1);
             // Should have consumed Blue from inventory (1 -> 0 or undefined)
             expect(mockPet.inventory['Blue Wallpaper']).toBeFalsy();
             // Config updated
             expect(mockPet.homeConfig.rooms.Entryway.wallpaperItem).toBe('Blue Wallpaper');
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        });
    });
});
