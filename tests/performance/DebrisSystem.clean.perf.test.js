import { jest } from '@jest/globals';
import { DebrisSystem } from '../../js/systems/DebrisSystem.js';

class MockPet {
    constructor(debrisCount) {
        this.debris = {};
        for (let i = 0; i < debrisCount; i++) {
            this.debris[`id-${i}`] = {
                id: `id-${i}`,
                type: 'weed',
                location: 'GARDEN',
                x: 0.5, // Constant or use a seeded RNG to avoid SonarCloud hotspots
                y: 0.5,
                created: Date.now()
            };
        }
        this.stats = { energy: 1000000 };
        this.skills = { resilience: 0 };
        this.recalculateCleanlinessPenalty = jest.fn();
        this.inventorySystem = { addItem: jest.fn() };
    }
}

describe('DebrisSystem.clean Performance Benchmark', () => {
    test('Measure clean performance with large N', () => {
        const N = 10000;
        const pet = new MockPet(N);
        const system = new DebrisSystem(pet);

        const startTime = performance.now();

        // Clean all items from last to first to maximize findIndex search time
        for (let i = N - 1; i >= 0; i--) {
            system.clean(`id-${i}`);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Cleaned ${N} items in ${duration.toFixed(2)} ms`);
        console.log(`Average time per clean: ${(duration / N).toFixed(4)} ms`);
    });
});
