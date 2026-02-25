import { jest } from '@jest/globals';
import { Nadagotchi } from '../../js/Nadagotchi';
import { setupPhaserMock } from '../helpers/mockPhaser';
import { setupLocalStorageMock } from '../helpers/mockLocalStorage';
import fs from 'fs';

// Setup Mocks
setupPhaserMock();
setupLocalStorageMock();

describe('Performance Benchmark: Debris Penalty', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        // Clear any existing debris
        pet.debris = [];
    });

    test('Benchmark Debris Penalty Calculation', () => {
        const iterations = 50000;
        const debrisCount = 100;

        // Setup: Create a mix of debris types
        for (let i = 0; i < debrisCount; i++) {
            const type = i % 2 === 0 ? 'weed' : 'poop';
            pet.debris.push({
                id: `debris-${i}`,
                type: type,
                x: Math.random(),
                y: Math.random(),
                created: Date.now()
            });
        }

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const worldState = { weather: 'Sunny', time: 'Day', activeEvent: null };
            pet.live(16, worldState);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        const output = `Benchmark Results (Debris Penalty):
Debris Count: ${debrisCount}
Iterations: ${iterations}
Total Time: ${duration.toFixed(2)} ms
Average Time per Call: ${(duration / iterations).toFixed(4)} ms\n`;

        console.log(output);
        fs.writeFileSync('benchmark_results.txt', output);

        expect(true).toBe(true);
    });
});
