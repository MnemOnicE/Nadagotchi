// tests/ItemIntegration.test.js
import { Nadagotchi } from '../js/Nadagotchi.js';
import { Recipes } from '../js/ItemData.js';

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Mock Phaser
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Item Integration', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Reset stats for clean testing
        pet.stats = { hunger: 50, energy: 50, happiness: 50 };
        pet.maxStats = { hunger: 100, energy: 100, happiness: 100 };
    });

    test('should define new items in Recipes', () => {
        expect(Recipes['Ancient Tome']).toBeDefined();
        expect(Recipes['Nutrient Bar']).toBeDefined();
        expect(Recipes['Espresso']).toBeDefined();
    });

    test('should craft Nutrient Bar', () => {
        pet.inventory = { 'Berries': 10, 'Sticks': 10 };
        pet.discoverRecipe('Nutrient Bar');
        pet.craftItem('Nutrient Bar');

        expect(pet.inventory['Nutrient Bar']).toBe(1);
        expect(pet.inventory['Berries']).toBe(5); // Consumed 5
        expect(pet.inventory['Sticks']).toBe(9); // Consumed 1
    });

    test('should consume Nutrient Bar and restore stats', () => {
        pet.inventory = { 'Nutrient Bar': 1 };
        pet.stats.hunger = 50;
        pet.stats.energy = 50;

        pet.consumeItem('Nutrient Bar');

        expect(pet.inventory['Nutrient Bar']).toBeUndefined(); // Consumed
        expect(pet.stats.hunger).toBe(80); // +30
        expect(pet.stats.energy).toBe(60); // +10
    });

    test('should consume Espresso and trigger BUZZ', () => {
        pet.inventory = { 'Espresso': 1 };
        pet.stats.energy = 50;
        pet.stats.happiness = 50;

        pet.consumeItem('Espresso');

        expect(pet.inventory['Espresso']).toBeUndefined();
        expect(pet.stats.energy).toBe(70); // +20
        expect(pet.stats.happiness).toBe(52); // +2
    });

    test('should forage Muse Flower in Autumn', () => {
        // Mock season
        pet.currentSeason = 'Autumn';

        // Mock RNG to return Muse Flower (it's in the list)
        pet.rng.choice = jest.fn().mockReturnValue('Muse Flower');

        pet.forage();

        expect(pet.inventory['Muse Flower']).toBe(1);
        expect(pet.discoveredRecipes).toContain('Ancient Tome');
    });

     test('should forage Chamomile in Spring', () => {
        pet.currentSeason = 'Spring';
        pet.rng.choice = jest.fn().mockReturnValue('Chamomile');

        pet.forage();

        expect(pet.inventory['Chamomile']).toBe(1);
        expect(pet.discoveredRecipes).toContain('Nutrient Bar');
    });
});
