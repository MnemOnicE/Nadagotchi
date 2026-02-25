import { PersistenceManager } from '../js/PersistenceManager.js';
import { setupLocalStorageMock } from './helpers/mockLocalStorage.js';

describe('PersistenceManager', () => {
    let persistenceManager;

    beforeEach(() => {
        jest.useFakeTimers();
        setupLocalStorageMock();
        persistenceManager = new PersistenceManager();
        localStorage.clear();
        jest.restoreAllMocks();

        // Mock requestIdleCallback to execute via setTimeout (controlled by Jest)
        global.requestIdleCallback = (cb) => {
             return setTimeout(() => {
                 cb({ didTimeout: false, timeRemaining: () => 10 });
             }, 5);
        };
        global.cancelIdleCallback = (id) => clearTimeout(id);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should save and load pet data', async () => {
        const petData = { name: 'Blobby', type: 'Slime', uuid: '123' };
        persistenceManager.savePet(petData);

        // Fast-forward timers to trigger the async save
        jest.runAllTimers();

        const loadedData = persistenceManager.loadPet();
        expect(loadedData).toEqual(petData);
    });

    test('should return null when no pet data is saved', () => {
        const loadedData = persistenceManager.loadPet();
        expect(loadedData).toBeNull();
    });

    test('should clear active pet data', async () => {
        const petData = { name: 'Blobby', type: 'Slime', uuid: '123' };
        persistenceManager.savePet(petData);
        jest.runAllTimers();

        persistenceManager.clearActivePet();
        const loadedData = persistenceManager.loadPet();
        expect(loadedData).toBeNull();
    });

    test('should save to and load from hall of fame', async () => {
        const retiredPet = { name: 'Old Timer', archetype: 'Recluse' };

        // Start save (returns Promise)
        const savePromise = persistenceManager.saveToHallOfFame(retiredPet);

        // Advance timers to process the internal requestIdleCallback/setTimeout
        jest.runAllTimers();

        // Wait for promise resolution
        await savePromise;

        const hallOfFame = persistenceManager.loadHallOfFame();
        expect(hallOfFame).toHaveLength(1);
        expect(hallOfFame[0]).toEqual(retiredPet);
    });

    test('should return empty array when no hall of fame data is saved', () => {
        const hallOfFame = persistenceManager.loadHallOfFame();
        expect(hallOfFame).toEqual([]);
    });

    test('should append to hall of fame', async () => {
        const retiredPet1 = { name: 'Old Timer', archetype: 'Recluse' };
        const retiredPet2 = { name: 'Ancient One', archetype: 'Intellectual' };

        const p1 = persistenceManager.saveToHallOfFame(retiredPet1);
        jest.runAllTimers();
        await p1;

        const p2 = persistenceManager.saveToHallOfFame(retiredPet2);
        jest.runAllTimers();
        await p2;

        const hallOfFame = persistenceManager.loadHallOfFame();
        expect(hallOfFame).toHaveLength(2);
        expect(hallOfFame[0]).toEqual(retiredPet1);
        expect(hallOfFame[1]).toEqual(retiredPet2);
    });

    test('should save and load journal entries', async () => {
        const entries = [{ id: 1, text: 'Day 1' }];
        const p = persistenceManager.saveJournal(entries);
        jest.runAllTimers();
        await p;

        const loadedEntries = persistenceManager.loadJournal();
        expect(loadedEntries).toEqual(entries);
    });

    test('should return empty array when no journal entries are saved', () => {
        const loadedEntries = persistenceManager.loadJournal();
        expect(loadedEntries).toEqual([]);
    });

    test('should save and load recipes', async () => {
        const recipes = ['Recipe A', 'Recipe B'];
        const p = persistenceManager.saveRecipes(recipes);
        jest.runAllTimers();
        await p;

        const loadedRecipes = persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual(recipes);
    });

    test('should return empty array when no recipes are saved', () => {
        const loadedRecipes = persistenceManager.loadRecipes();
        expect(loadedRecipes).toEqual([]);
    });
});
