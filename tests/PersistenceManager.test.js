import { PersistenceManager } from '../js/PersistenceManager.js';
import { setupLocalStorageMock } from './helpers/mockLocalStorage.js';

describe('PersistenceManager', () => {
    let persistenceManager;

    beforeEach(() => {
        setupLocalStorageMock();
        persistenceManager = new PersistenceManager();
        localStorage.clear();
        jest.restoreAllMocks();

        // Mock requestIdleCallback to execute quickly
        global.requestIdleCallback = (cb) => {
             return setTimeout(() => {
                 cb({ didTimeout: false, timeRemaining: () => 10 });
             }, 5);
        };
        global.cancelIdleCallback = (id) => clearTimeout(id);
    });

    test('should save and load pet data', async () => {
        const petData = { name: 'Blobby', type: 'Slime', uuid: '123' };
        await persistenceManager.savePet(petData);

        // Wait enough for the async save to complete (timer based)
        await new Promise(r => setTimeout(r, 100));

        const loadedData = await persistenceManager.loadPet();
        expect(loadedData).toEqual(petData);
    });

    test('should return null when no pet data is saved', async () => {
        const loadedData = await persistenceManager.loadPet();
        expect(loadedData).toBeNull();
    });

    test('should clear active pet data', async () => {
        const petData = { name: 'Blobby', type: 'Slime', uuid: '123' };
        await persistenceManager.savePet(petData);
        await new Promise(r => setTimeout(r, 100));

        persistenceManager.clearActivePet();
        const loadedData = await persistenceManager.loadPet();
        expect(loadedData).toBeNull();
    });

    test('should save to and load from hall of fame', async () => {
        const retiredPet = { name: 'Old Timer', archetype: 'Recluse' };
        await persistenceManager.saveToHallOfFame(retiredPet);

        const hallOfFame = await persistenceManager.loadHallOfFame();
        expect(hallOfFame).toHaveLength(1);
        expect(hallOfFame[0]).toEqual(retiredPet);
    });

    test('should return empty array when no hall of fame data is saved', async () => {
        const hallOfFame = await persistenceManager.loadHallOfFame();
        expect(hallOfFame).toEqual([]);
    });

    test('should append to hall of fame', async () => {
        const retiredPet1 = { name: 'Old Timer', archetype: 'Recluse' };
        const retiredPet2 = { name: 'Ancient One', archetype: 'Intellectual' };

        await persistenceManager.saveToHallOfFame(retiredPet1);
        await persistenceManager.saveToHallOfFame(retiredPet2);

        const hallOfFame = await persistenceManager.loadHallOfFame();
        expect(hallOfFame).toHaveLength(2);
        expect(hallOfFame[0]).toEqual(retiredPet1);
        expect(hallOfFame[1]).toEqual(retiredPet2);
    });

    test('should save and load journal entries', async () => {
        const entries = [{ id: 1, text: 'Day 1' }];
        await persistenceManager.saveJournal(entries);
        const loadedEntries = await persistenceManager.loadJournal();
        expect(loadedEntries).toEqual(entries);
    });

    test('should return empty array when no journal entries are saved', async () => {
        const loadedEntries = await persistenceManager.loadJournal();
        expect(loadedEntries).toEqual([]);
    });

    test('should save and load recipes', async () => {
        const recipes = ['Recipe A', 'Recipe B'];
        await persistenceManager.saveRecipes(recipes);
        const loadedRecipes = await persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual(recipes);
    });

    test('should return empty array when no recipes are saved', async () => {
        const loadedRecipes = await persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual([]);
    });
});
