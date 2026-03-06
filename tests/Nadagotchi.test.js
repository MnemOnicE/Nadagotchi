// tests/Nadagotchi.test.js
import { Nadagotchi } from '../js/Nadagotchi';
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

// Mock Phaser since it's not available in the Node.js test environment
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Nadagotchi', () => {
    let pet;

    beforeEach(async () => {        pet = new Nadagotchi('Intellectual');
        // Force a deterministic genome to avoid random homozygous bonuses in general tests
        pet.genome.genotype = {
            Adventurer: [10, 20],
            Nurturer: [10, 20],
            Mischievous: [10, 20], // Definitely not homozygous
            Intellectual: [40, 40], // Expected for 'Intellectual' starter
            Recluse: [10, 20],
            metabolism: [5, 5],
            moodSensitivity: [5, 5],
            specialAbility: [null, null]
        };
        pet.genome.phenotype = pet.genome.calculatePhenotype();

        // Async Init
        await pet.init();

        // Manually ensure recipes are loaded for tests that need them,
        // as the mock persistence might return empty arrays by default
        pet.discoveredRecipes = ['Fancy Bookshelf'];
    });

    describe('constructor', () => {
        test('should initialize from loadedData', async () => {            const loadedData = {
                mood: 'happy',
                dominantArchetype: 'Nurturer',
                personalityPoints: { Adventurer: 5, Nurturer: 15, Mischievous: 2, Intellectual: 8, Recluse: 1 },
                stats: { hunger: 80, energy: 85, happiness: 90 },
                skills: { communication: 5, resilience: 3, navigation: 1, empathy: 7, logic: 4, focus: 2, crafting: 1 },
                currentCareer: 'Healer',
                inventory: ['Berries'],
                age: 10,
                generation: 2,
                isLegacyReady: false,
                legacyTraits: ['Charisma'],
                moodSensitivity: 7,
                hobbies: { painting: 10, music: 5 },
                relationships: { 'Grizzled Scout': { level: 10 } },
                location: 'Home'
            };
            const loadedPet = new Nadagotchi('Adventurer', loadedData);
            await loadedPet.init();            pet.craftItem('Fancy Bookshelf');
            expect(pet.inventory['Sticks']).toBe(5);
            expect(pet.inventory['Shiny Stone']).toBe(1);
            expect(pet.inventory['Fancy Bookshelf']).toBe(1);
        });

        test('craftItem should not work if materials are insufficient', () => {
            pet.inventory = { 'Sticks': 4, 'Shiny Stone': 1 };
            pet.craftItem('Fancy Bookshelf');
            expect(pet.inventory['Fancy Bookshelf']).toBeUndefined();
        });

        test('INTERACT_FANCY_BOOKSHELF should provide a better study buff', () => {
            pet.skills.logic = 1;
            pet.handleAction('INTERACT_FANCY_BOOKSHELF');
            expect(pet.skills.logic).toBeGreaterThan(1.2);
        });
    });
});
