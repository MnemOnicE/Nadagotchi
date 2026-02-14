
import { jest } from '@jest/globals';
import { Nadagotchi } from '../../js/Nadagotchi';
import { setupPhaserMock } from '../helpers/mockPhaser';
import { setupLocalStorageMock } from '../helpers/mockLocalStorage';

// Setup Mocks
setupPhaserMock();
setupLocalStorageMock();

describe('Performance Benchmark: updateDominantArchetype', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
    });

    test('Benchmark updateDominantArchetype', () => {
        const iterations = 100000;

        // Define Scenarios as data objects to avoid code duplication
        const scenarios = [
            // Scenario 1: No Tie
            () => { pet.personalityPoints = { Adventurer: 10, Nurturer: 5, Mischievous: 2, Intellectual: 8, Recluse: 1 }; },

            // Scenario 2: Two-way Tie (Incumbent Intellectual involved)
            () => {
                 pet.personalityPoints = { Adventurer: 10, Nurturer: 5, Mischievous: 2, Intellectual: 10, Recluse: 1 };
                 pet.skills.logic = 10;
                 pet.skills.navigation = 10;
            },

            // Scenario 3: Two-way Tie (Incumbent NOT involved)
            () => {
                 pet.dominantArchetype = 'Mischievous';
                 pet.personalityPoints = { Adventurer: 10, Nurturer: 10, Mischievous: 2, Intellectual: 8, Recluse: 1 };
                 pet.skills.navigation = 10;
                 pet.skills.empathy = 10;
            },

             // Scenario 4: All Tie
             () => {
                pet.personalityPoints = { Adventurer: 10, Nurturer: 10, Mischievous: 10, Intellectual: 10, Recluse: 10 };
           }
        ];

        const startTime = performance.now();
        const numScenarios = scenarios.length;

        for (let i = 0; i < iterations; i++) {
            // Rotate through scenarios to average out the cost
            scenarios[i % numScenarios]();
            pet.updateDominantArchetype();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Benchmark Results:`);
        console.log(`Iterations: ${iterations}`);
        console.log(`Total Time: ${duration.toFixed(2)} ms`);
        console.log(`Average Time per Call: ${(duration / iterations).toFixed(4)} ms`);

        expect(true).toBe(true);
    });
});
