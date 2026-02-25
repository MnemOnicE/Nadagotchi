import { WorldClock } from '../../js/WorldClock.js';

describe('WorldClock Performance', () => {
    test('getCurrentPeriod benchmark', () => {
        const mockScene = {};
        const clock = new WorldClock(mockScene);
        const iterations = 10000;

        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
             // Simulate time passing to hit different branches
             clock.time = (i % 100) / 100;
             clock.getCurrentPeriod();
        }

        const end = performance.now();
        const duration = end - start;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod (Dynamic Time) x ${iterations}: ${duration.toFixed(4)}ms`);

        // Basic assertion to ensure it runs
        expect(duration).toBeLessThan(1000);
    });
});
