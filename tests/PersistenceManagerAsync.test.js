
import { PersistenceManager } from '../js/PersistenceManager.js';

// Mock LocalStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

// Mock btoa/atob if needed (though Node >=22 has them)
if (!global.btoa) {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

describe('PersistenceManager Async', () => {
    let pm;

    beforeEach(() => {
        localStorage.clear();
        pm = new PersistenceManager();
    });

    test('savePet and loadPet should work asynchronously', async () => {
        const petData = { uuid: '123', name: 'TestPet' };
        await pm.savePet(petData);

        const loaded = await pm.loadPet();
        expect(loaded).toEqual(petData);
    });

    test('loadPet should fail on tampering', async () => {
        const petData = { uuid: '123', name: 'TestPet' };
        await pm.savePet(petData);

        // Tamper with the data in localStorage
        const raw = localStorage.getItem("nadagotchi_save");
        const parts = raw.split('|');
        // Change the hash part
        const tampered = `${parts[0]}|fakehash`;
        localStorage.setItem("nadagotchi_save", tampered);

        // Mock console.warn to keep output clean
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const loaded = await pm.loadPet();
        expect(loaded).toBeNull();
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    test('should save and load journal entries', async () => {
        const entries = [{ date: 'Day 1', text: 'Entry 1' }];
        await pm.saveJournal(entries);
        const loaded = await pm.loadJournal();
        expect(loaded).toEqual(entries);
    });

    test('should save and load recipes', async () => {
        const recipes = ['Recipe A', 'Recipe B'];
        await pm.saveRecipes(recipes);
        const loaded = await pm.loadRecipes();
        expect(loaded).toEqual(recipes);
    });

    test('should save and load calendar', async () => {
        const calendar = { day: 5, season: 'Summer' };
        await pm.saveCalendar(calendar);
        const loaded = await pm.loadCalendar();
        expect(loaded).toEqual(calendar);
    });

    test('should save and load furniture', async () => {
        const furniture = { "Entryway": [{ key: 'Chair', x: 10, y: 10 }] };
        await pm.saveFurniture(furniture);
        const loaded = await pm.loadFurniture();
        expect(loaded).toEqual(furniture);
    });

    test('should load legacy furniture array and migrate', async () => {
        const legacy = [{ key: 'Chair', x: 10, y: 10 }];
        // Manually save legacy format
        await pm._save("nadagotchi_furniture", legacy);

        const loaded = await pm.loadFurniture();
        expect(loaded).toHaveProperty("Entryway");
        expect(loaded.Entryway).toEqual(legacy);
    });

    test('should save and load settings', async () => {
        const settings = { volume: 0.8 };
        await pm.saveSettings(settings);
        const loaded = await pm.loadSettings();
        expect(loaded).toEqual(settings);
    });

    test('should save and load achievements', async () => {
        const ach = { unlocked: ['A1'], progress: { p: 1 } };
        await pm.saveAchievements(ach);
        const loaded = await pm.loadAchievements();
        expect(loaded).toEqual(ach);
    });

    test('should save to and load from Hall of Fame', async () => {
        const pet1 = { name: 'Pet1' };
        await pm.saveToHallOfFame(pet1);

        let loaded = await pm.loadHallOfFame();
        expect(loaded).toHaveLength(1);
        expect(loaded[0]).toEqual(pet1);

        const pet2 = { name: 'Pet2' };
        await pm.saveToHallOfFame(pet2);
        loaded = await pm.loadHallOfFame();
        expect(loaded).toHaveLength(2);
    });

    test('should clear all data', async () => {
        await pm.savePet({ name: 'Pet' });
        await pm.saveJournal([]);

        pm.clearAllData();

        expect(await pm.loadPet()).toBeNull();
        const journal = await pm.loadJournal();
        expect(journal).toEqual([]);
    });
});
