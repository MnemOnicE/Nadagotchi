
import { jest } from '@jest/globals';
import { setupPhaserMock } from '../helpers/mockPhaser';
import { setupLocalStorageMock } from '../helpers/mockLocalStorage';
import { WorldClock } from '../../js/WorldClock.js';
import { SeededRandom } from '../../js/utils/SeededRandom.js';

// 1. Setup Environment
setupPhaserMock();
setupLocalStorageMock();

describe('WorldClock Performance Benchmark', () => {
    let clock;
    let mockScene;

    beforeEach(() => {
        mockScene = new Phaser.Scene({});
        clock = new WorldClock(mockScene);
    });

    test('Benchmark: getCurrentPeriod execution speed', () => {
        const iterations = 100000; // 100k
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            // Simulate changing time
            clock.timeOfDay = (i % 1440); // 0-1439 mins
            clock.getCurrentPeriod();
        }

        const end = performance.now();
        const duration = end - start;
        const avg = duration / iterations;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod x ${iterations}: ${duration.toFixed(4)}ms (Avg: ${avg.toFixed(6)}ms)`);

        expect(duration).toBeLessThan(500); // Should be very fast
    });
});
