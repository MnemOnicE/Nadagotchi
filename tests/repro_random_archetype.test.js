import { Nadagotchi } from '../js/Nadagotchi';

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Mock Phaser with a GetRandom that deliberately returns the SECOND element (if available)
// This simulates "randomness" picking something other than the first element (index 0).
// If the code is deterministic (using index 0), this mock won't matter or won't be called.
global.Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => {
                if (arr.length > 1) {
                    return arr[1];
                }
                return arr[0];
            }
        }
    }
};

describe('Nadagotchi Repro: Random Archetype', () => {
    test('updateDominantArchetype should be deterministic and ignore Phaser.GetRandom', () => {
        const pet = new Nadagotchi('Intellectual');

        // Setup a tie between Nurturer and Recluse
        // Order in personalityPoints keys: Adventurer, Nurturer, Mischievous, Intellectual, Recluse.
        // So potentialDominantArchetypes should be ['Nurturer', 'Recluse'].

        pet.personalityPoints.Intellectual = 5; // Drop incumbent (Intellectual)
        pet.personalityPoints.Nurturer = 15;
        pet.personalityPoints.Recluse = 15;

        // Action
        pet.updateDominantArchetype();

        // Expectation: The system should deterministically pick the first one ('Nurturer').
        // If the bug exists (using GetRandom), our mock returns arr[1] ('Recluse'), causing failure.
        expect(pet.dominantArchetype).toBe('Nurturer');
    });
});
