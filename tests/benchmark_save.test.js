
import { PersistenceManager } from '../js/PersistenceManager';
import { Nadagotchi } from '../js/Nadagotchi';
import { jest } from '@jest/globals';

// Mock crypto for Nadagotchi - Use safer implementation for tests if possible
if (!global.crypto) {
    global.crypto = {
        getRandomValues: (arr) => {
            // Fill with deterministic values for testing to avoid SonarCloud "Weak Cryptography" flagging Math.random
            for (let i = 0; i < arr.length; i++) {
                arr[i] = (i * 13) % 256;
            }
            return arr;
        }
    };
}

// Mock localStorage if not present (JSDOM usually provides it)
if (!global.localStorage) {
    global.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
    };
} else {
    // If it exists, spy on it
    if (global.localStorage) {
         jest.spyOn(global.localStorage.__proto__, 'setItem').mockImplementation(() => {});
         jest.spyOn(global.localStorage.__proto__, 'getItem').mockImplementation(() => null);
    }
}

describe('PersistenceManager Performance Benchmark', () => {
    let persistence;
    let pet;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        persistence = new PersistenceManager();
        pet = new Nadagotchi('Adventurer');

        // Populate pet with heavy data to simulate late-game state
        for (let i = 0; i < 1000; i++) {
            pet.addJournalEntry(`This is journal entry #${i}. It contains some text to make the save file larger.`);
            pet.inventory[`Item_${i}`] = i;
        }
        pet.journal = new Array(1000).fill({ date: 'Now', text: 'Long text entry to simulate load.' });

        pet.stats = { hunger: 50.123456, energy: 50.123456, happiness: 50.123456 };
        pet.homeConfig.rooms["Entryway"].wallpaper = "wallpaper_expensive";
        pet.homeConfig.rooms["Entryway"].flooring = "flooring_marble";
    });

    test('Benchmark: savePet Execution Time (Async Scheduling)', async () => {
        // Clear side-effect calls from setup (e.g. saveRecipes, saveJournal)
        jest.clearAllMocks();
        localStorage.setItem.mockClear();

        const start = performance.now();

        // Run save multiple times to simulate burst or auto-save
        const iterations = 50;
        for (let i = 0; i < iterations; i++) {
            persistence.savePet(pet);
        }

        const end = performance.now();
        const duration = end - start;
        const avg = duration / iterations;

        console.log(`[Benchmark] savePet (Async) average scheduling time: ${avg.toFixed(4)}ms over ${iterations} iterations.`);
        console.log(`[Benchmark] Total scheduling time: ${duration.toFixed(4)}ms`);

        // Expect scheduling to be extremely fast
        expect(avg).toBeLessThan(0.5); // Should be just function call overhead

        // Now wait for the debounced save to fire
        await new Promise(resolve => setTimeout(resolve, 300));

        // Should have called setItem ONCE (debounced)
        expect(localStorage.setItem).toHaveBeenCalledTimes(1);

        // Test Deduplication: Call save again with SAME data
        localStorage.setItem.mockClear();
        persistence.savePet(pet);

        await new Promise(resolve => setTimeout(resolve, 300));

        // Should NOT call setItem (deduplicated)
        expect(localStorage.setItem).not.toHaveBeenCalled();

        // Test Change: Modify data and save
        pet.stats.hunger = 10;
        persistence.savePet(pet);

        await new Promise(resolve => setTimeout(resolve, 300));

        // Should call setItem again
        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    });
});
