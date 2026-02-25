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

    test('should save and load pet data', async () => {
        const petData = { name: 'Testy', mood: 'happy' };
        persistenceManager.savePet(petData);

        // Wait for async save (debounced/scheduled)
        await new Promise(resolve => setTimeout(resolve, 300));

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
});
