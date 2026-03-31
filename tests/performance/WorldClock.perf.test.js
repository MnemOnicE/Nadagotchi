import { WorldClock } from '../../js/WorldClock.js';
import { SeededRandom } from '../../js/utils/SeededRandom.js';

// Mock Scene
const mockScene = {
    events: { emit: () => {} },
    time: { now: 0 }
};

describe('WorldClock Performance', () => {
    test('getCurrentPeriod() benchmark - Cached vs Uncached', () => {
        const clock = new WorldClock(mockScene);

        // Scenario 1: Mostly Cache Hits (Time changes slightly but stays in same period)
        // Simulate normal game loop where time increments by small delta
        const iterations = 1000000;
        const delta = 1000 / 60; // 16ms per frame (approx)

        const start = Date.now();

        for (let i = 0; i < iterations; i++) {
            // Update time slightly
            clock.update(delta);
            // Call getCurrentPeriod
            clock.getCurrentPeriod();
        }

        const end = Date.now();
        const duration = end - start;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod x ${iterations} (sequential update): ${duration}ms`);

        // Scenario 2: Random Access (Cache Misses)
        // Reset clock
        const randomClock = new WorldClock(mockScene);
        const rng = new SeededRandom(12345); // Use seeded random to avoid Security Hotspot
        const randomStart = Date.now();

        for (let i = 0; i < iterations; i++) {
            randomClock.time = rng.random(); // Random time 0-1
            randomClock.getCurrentPeriod();
        }

        const randomEnd = Date.now();
        const randomDuration = randomEnd - randomStart;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod x ${iterations} (random access): ${randomDuration}ms`);

        expect(duration).toBeLessThan(5000); // Sanity check
    });
});
