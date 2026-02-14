
import { jest } from '@jest/globals';
import { Nadagotchi } from '../../js/Nadagotchi';

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
    },
    Math: {
        RND: {
            pick: (arr) => arr[0],
            integerInRange: (min, max) => min
        }
    }
};
global.Phaser = Phaser;

describe('Performance Benchmark: updateDominantArchetype', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Ensure deterministic RNG for consistent benchmarking if needed
        // but here we want to test the raw logic speed
    });

    test('Benchmark updateDominantArchetype', () => {
        const iterations = 100000;

        // Scenario 1: No Tie
        const setupNoTie = () => {
            pet.personalityPoints = { Adventurer: 10, Nurturer: 5, Mischievous: 2, Intellectual: 8, Recluse: 1 };
        };

        // Scenario 2: Two-way Tie (Incumbent Intellectual involved)
        const setupTieIncumbent = () => {
             pet.personalityPoints = { Adventurer: 10, Nurturer: 5, Mischievous: 2, Intellectual: 10, Recluse: 1 };
             pet.skills.logic = 10;
             pet.skills.navigation = 10;
        };

        // Scenario 3: Two-way Tie (Incumbent NOT involved)
        const setupTieNoIncumbent = () => {
             pet.dominantArchetype = 'Mischievous';
             pet.personalityPoints = { Adventurer: 10, Nurturer: 10, Mischievous: 2, Intellectual: 8, Recluse: 1 };
             pet.skills.navigation = 10;
             pet.skills.empathy = 10;
        };

         // Scenario 4: All Tie
         const setupAllTie = () => {
            pet.personalityPoints = { Adventurer: 10, Nurturer: 10, Mischievous: 10, Intellectual: 10, Recluse: 10 };
       };

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            // Rotate through scenarios to average out the cost
            const mod = i % 4;
            if (mod === 0) setupNoTie();
            else if (mod === 1) setupTieIncumbent();
            else if (mod === 2) setupTieNoIncumbent();
            else setupAllTie();

            pet.updateDominantArchetype();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Benchmark Results:`);
        console.log(`Iterations: ${iterations}`);
        console.log(`Total Time: ${duration.toFixed(2)} ms`);
        console.log(`Average Time per Call: ${(duration / iterations).toFixed(4)} ms`);

        // This test always passes, it's just for measurement
        expect(true).toBe(true);
    });
});
