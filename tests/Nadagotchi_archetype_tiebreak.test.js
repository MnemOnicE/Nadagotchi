// tests/Nadagotchi_archetype_tiebreak.test.js
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

// Load the class from the source file and append module.exports
const nadagotchiCode = fs.readFileSync(path.resolve(__dirname, '../js/Nadagotchi.js'), 'utf8');
const Nadagotchi = eval(nadagotchiCode + '; module.exports = Nadagotchi;');


describe('Nadagotchi Archetype Tie-Breaking', () => {
    let pet;

    beforeEach(() => {
        // Mock Phaser to control the "random" selection.
        const Phaser = {
            Utils: {
                Array: {
                    GetRandom: (arr) => arr[1] // Always choose the second element
                }
            }
        };
        global.Phaser = Phaser;

        pet = new Nadagotchi('Intellectual');
    });

    test('should correctly select a new archetype in a tie-break', () => {
        // Drop the incumbent's score.
        pet.personalityPoints.Intellectual = 5;

        // Create a tie for the highest score.
        pet.personalityPoints.Nurturer = 15;
        pet.personalityPoints.Recluse = 15;

        pet.updateDominantArchetype();

        // The fix should use our mocked GetRandom, picking 'Recluse' (the second).
        expect(pet.dominantArchetype).toBe('Recluse');
    });
});
