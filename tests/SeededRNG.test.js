import { SeededRandom } from '../js/utils/SeededRandom.js';
import { Nadagotchi } from '../js/Nadagotchi.js';

// Mock PersistenceManager
jest.mock('../js/PersistenceManager.js', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => {
            return {
                loadJournal: () => [],
                loadRecipes: () => [],
                loadSettings: () => ({}),
                loadCalendar: () => ({ season: 'Spring', day: 1 }),
                saveJournal: () => {},
                saveRecipes: () => {},
                saveSettings: () => {},
                savePet: () => {},
                loadPet: () => null,
                saveFurniture: () => {},
                loadFurniture: () => [],
            };
        })
    };
});

describe('SeededRandom', () => {
    it('should be deterministic', () => {
        const rng1 = new SeededRandom(12345);
        const val1 = rng1.random();
        const val2 = rng1.random();

        const rng2 = new SeededRandom(12345);
        expect(rng2.random()).toBe(val1);
        expect(rng2.random()).toBe(val2);
    });

    it('should restore state', () => {
        const rng1 = new SeededRandom(12345);
        rng1.random(); // advance
        const state = rng1.state;

        const rng2 = new SeededRandom(12345);
        rng2.state = state;
        expect(rng2.random()).toBe(rng1.random());
    });

    it('should handle string seeds deterministically', () => {
        const rng1 = new SeededRandom("cosmos");
        const rng2 = new SeededRandom("cosmos");
        expect(rng1.random()).toBe(rng2.random());
    });
});

describe('Nadagotchi RNG Integration', () => {
    it('should initialize with a universe seed', () => {
        const pet = new Nadagotchi('Adventurer');
        expect(pet.universeSeed).toBeDefined();
        expect(pet.rng).toBeInstanceOf(SeededRandom);
    });

    it('should reproduce deterministic behavior on reload', () => {
        const pet1 = new Nadagotchi('Adventurer');
        const seed = pet1.universeSeed;

        // Advance RNG via methods that use it
        // generateUUID calls rng inside constructor
        // genome initialization calls rng inside constructor

        // Let's call forage to explicitly use RNG
        // forage checks energy, default energy is 100, cost is 10.
        // It requires item definitions, which are imported real ones.
        pet1.forage();

        const stateAfterForage = pet1.rng.state;

        // Simulate Save (serialize)
        // JSON.stringify will treat SeededRandom as plain object { seed: ..., state: ... }
        const saveData = JSON.parse(JSON.stringify(pet1));

        // Simulate Load
        const pet2 = new Nadagotchi('Adventurer', saveData);

        expect(pet2.universeSeed).toBe(seed);
        // The state should be restored
        expect(pet2.rng.state).toBe(stateAfterForage);

        // Next random should be identical
        expect(pet2.rng.random()).toBe(pet1.rng.random());
    });

    it('should generate deterministic offspring', () => {
        const parent = new Nadagotchi('Adventurer');
        // Fix RNG for parent
        parent.rng = new SeededRandom(123);

        const offspring1 = parent.calculateOffspring([]);

        // Reset parent RNG
        parent.rng = new SeededRandom(123);
        const offspring2 = parent.calculateOffspring([]);

        expect(offspring1.uuid).toBe(offspring2.uuid);
        expect(offspring1.dominantArchetype).toBe(offspring2.dominantArchetype);
        // Deep check genotype
        expect(JSON.stringify(offspring1.genome.genotype)).toBe(JSON.stringify(offspring2.genome.genotype));
    });
});
