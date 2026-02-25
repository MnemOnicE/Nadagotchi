
import { jest } from '@jest/globals';
import { WorldClock } from '../../js/WorldClock.js';
import { SeededRandom } from '../../js/utils/SeededRandom.js';

describe('WorldClock Performance', () => {
    let mockScene;
    let clock;

    beforeEach(() => {
        mockScene = {
            events: { emit: jest.fn() }
        };
        // Use a mock or real implementation depending on what we benchmark.
        // Here we test the class logic itself.
        clock = new WorldClock(mockScene);
    });

    test('getCurrentPeriod performance', () => {
        const iterations = 100000;
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            // Simulate time passing to trigger calculation
            clock.accumulatedTime = (i % 24000) * 10;
            clock.getCurrentPeriod();
        }

        const end = performance.now();
        const duration = end - start;
        console.log(`[Benchmark] WorldClock.getCurrentPeriod x ${iterations}: ${duration.toFixed(4)}ms`);

        // Basic assertion to ensure it runs fast enough (e.g., < 100ms for 100k ops)
        expect(duration).toBeLessThan(500);
    });

    test('update cycle performance', () => {
        const iterations = 50000;
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            clock.update(16.6); // 60 FPS delta
        }

        const end = performance.now();
        const duration = end - start;
        console.log(`[Benchmark] WorldClock.update x ${iterations}: ${duration.toFixed(4)}ms`);

        expect(duration).toBeLessThan(500);
    });
});
