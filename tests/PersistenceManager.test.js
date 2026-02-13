// tests/PersistenceManager.test.js
import { PersistenceManager } from '../js/PersistenceManager';

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

describe('PersistenceManager', () => {
    let persistenceManager;

    beforeEach(() => {
        persistenceManager = new PersistenceManager();
        global.localStorage.clear();
    });

    test('should save and load pet data', () => {
        const petData = { name: 'Testy', mood: 'happy' };
        persistenceManager.savePet(petData);
        const loadedPet = persistenceManager.loadPet();
        expect(loadedPet).toEqual(petData);
    });

    test('should return null when no pet data is saved', () => {
        const loadedPet = persistenceManager.loadPet();
        expect(loadedPet).toBeNull();
    });

    test('should clear active pet data', () => {
        const petData = { name: 'Testy', mood: 'happy' };
        persistenceManager.savePet(petData);
        persistenceManager.clearActivePet();
        const loadedPet = persistenceManager.loadPet();
        expect(loadedPet).toBeNull();
    });

    test('should save to and load from hall of fame', () => {
        const retiredPet = { name: 'Old Timer', archetype: 'Recluse' };
        persistenceManager.saveToHallOfFame(retiredPet);
        const hallOfFame = persistenceManager.loadHallOfFame();
        expect(hallOfFame).toHaveLength(1);
        expect(hallOfFame[0]).toEqual(retiredPet);
    });

    test('should return empty array when no hall of fame data is saved', () => {
        const hallOfFame = persistenceManager.loadHallOfFame();
        expect(hallOfFame).toEqual([]);
    });

    test('should append to hall of fame', () => {
        const retiredPet1 = { name: 'Old Timer', archetype: 'Recluse' };
        const retiredPet2 = { name: 'Ancient One', archetype: 'Intellectual' };
        persistenceManager.saveToHallOfFame(retiredPet1);
        persistenceManager.saveToHallOfFame(retiredPet2);
        const hallOfFame = persistenceManager.loadHallOfFame();
        expect(hallOfFame).toHaveLength(2);
        expect(hallOfFame[1]).toEqual(retiredPet2);
    });

    test('should save and load journal entries', () => {
        const entries = [{ id: 1, text: 'Day 1' }];
        persistenceManager.saveJournal(entries);
        const loadedEntries = persistenceManager.loadJournal();
        expect(loadedEntries).toEqual(entries);
    });

    test('should return empty array when no journal entries are saved', () => {
        const loadedEntries = persistenceManager.loadJournal();
        expect(loadedEntries).toEqual([]);
    });

    test('should save and load recipes', () => {
        const recipes = ['Recipe A', 'Recipe B'];
        persistenceManager.saveRecipes(recipes);
        const loadedRecipes = persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual(recipes);
    });

    test('should return empty array when no recipes are saved', () => {
        const loadedRecipes = persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual([]);
    });

    describe('Migration', () => {
        beforeEach(() => {
            jest.spyOn(console, 'debug').mockImplementation(() => {});
        });

        afterEach(() => {
            console.debug.mockRestore();
        });

        test('should migrate legacy furniture array to Entryway object', () => {
            const legacyData = [{ key: 'Chair', x: 10, y: 10 }];
            // Manually save legacy data as plain JSON (PersistenceManager._load supports this)
            global.localStorage.setItem('nadagotchi_furniture', JSON.stringify(legacyData));

            const result = persistenceManager.loadFurniture();

            expect(result).toHaveProperty('Entryway');
            expect(result.Entryway).toEqual(legacyData);
            expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('Migrating legacy furniture data'));
        });

        test('should migrate legacy home config to Entryway object', () => {
            const legacyData = { wallpaper: 'Blue', flooring: 'Wood' };
            global.localStorage.setItem('nadagotchi_home_config', JSON.stringify(legacyData));

            const result = persistenceManager.loadHomeConfig();

            expect(result.rooms).toHaveProperty('Entryway');
            expect(result.rooms.Entryway.wallpaper).toBe('Blue');
            expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('Migrating legacy home config'));
        });

        test('should not trigger migration for modern furniture data', () => {
            const modernData = { "Entryway": [{ key: 'Table', x: 50, y: 50 }] };
            persistenceManager.saveFurniture(modernData);

            const result = persistenceManager.loadFurniture();

            expect(result).toEqual(modernData);
            expect(console.debug).not.toHaveBeenCalled();
        });
    });
});
