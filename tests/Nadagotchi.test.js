// tests/Nadagotchi.test.js
const fs = require('fs');
const path = require('path');

// Mock localStorage and PersistenceManager
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

const persistenceManagerCode = fs.readFileSync(path.resolve(__dirname, '../js/PersistenceManager.js'), 'utf8');
const PersistenceManager = eval(persistenceManagerCode + '; PersistenceManager');
global.PersistenceManager = PersistenceManager;

// Load the class from the source file
const nadagotchiCode = fs.readFileSync(path.resolve(__dirname, '../js/Nadagotchi.js'), 'utf8');
const Nadagotchi = eval(nadagotchiCode + '; Nadagotchi');

describe('Nadagotchi', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
    });

    describe('live', () => {
        test('should decrease hunger and energy over time', () => {
            const initialHunger = pet.stats.hunger;
            const initialEnergy = pet.stats.energy;
            pet.live();
            expect(pet.stats.hunger).toBeLessThan(initialHunger);
            expect(pet.stats.energy).toBeLessThan(initialEnergy);
        });

        test('should change mood based on stats', () => {
            pet.stats.hunger = 20;
            pet.live();
            expect(pet.mood).toBe('sad');

            pet.stats.hunger = 5;
            pet.live();
            expect(pet.mood).toBe('angry');

            pet.stats.hunger = 90;
            pet.stats.energy = 90;
            pet.live();
            expect(pet.mood).toBe('happy');
        });
    });

    describe('updateDominantArchetype', () => {
        test('should update the dominant archetype to the one with the most points', () => {
            pet.personalityPoints.Nurturer = 15;
            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Nurturer');
        });

        test('should not change dominant archetype in case of a tie', () => {
            // Intellectual starts at 10 points.
            // Set Recluse to the same score. Since Recluse is iterated after Intellectual,
            // the bug will cause the dominant archetype to incorrectly switch.
            pet.personalityPoints.Recluse = 10;
            pet.updateDominantArchetype();
            // The dominant archetype should remain Intellectual.
            expect(pet.dominantArchetype).toBe('Intellectual');
        });
    });
});
