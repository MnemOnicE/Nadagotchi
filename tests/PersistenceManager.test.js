// tests/PersistenceManager.test.js
const fs = require('fs');
const path = require('path');

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Load the class from the source file
const persistenceManagerCode = fs.readFileSync(path.resolve(__dirname, '../js/PersistenceManager.js'), 'utf8');
const PersistenceManager = eval(persistenceManagerCode + '; PersistenceManager');

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

    test('should save and load recipes', () => {
        const recipes = ['Recipe A', 'Recipe B'];
        persistenceManager.saveRecipes(recipes);
        const loadedRecipes = persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual(recipes);
    });
});
