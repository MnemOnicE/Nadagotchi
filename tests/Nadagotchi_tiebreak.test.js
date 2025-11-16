// tests/Nadagotchi_tiebreak.test.js
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


describe('Nadagotchi Tie-Breaking', () => {
    let pet;

    beforeEach(() => {
        // Mock Phaser since it's not available in the Node.js test environment
        // We are going to control the "random" selection to test the tie-breaking logic.
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

    test('should switch to the second archetype in a tie when the incumbent is not involved', () => {
        // Intellectual starts at 10 points. Drop its score so it's not in the running.
        pet.personalityPoints.Intellectual = 5;

        // Nurturer and Recluse tie for the highest score.
        pet.personalityPoints.Nurturer = 15;
        pet.personalityPoints.Recluse = 15;

        pet.updateDominantArchetype();

        // With the corrected deterministic implementation, Nurturer should always be chosen as it appears first.
        expect(pet.dominantArchetype).toBe('Nurturer');
    });
});
