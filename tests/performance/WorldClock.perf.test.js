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

import { WorldClock } from '../../js/WorldClock.js';

// Mock Phaser Scene
const mockScene = {};

describe('WorldClock Performance', () => {
    let clock;

    beforeEach(() => {
        clock = new WorldClock(mockScene);
    });

    test('getCurrentPeriod benchmark', () => {
        const iterations = 1000000;

        // Scenario 1: Static Time (Simulating multiple calls within same frame or very slow time)
        // This is the best-case scenario for caching.
        clock.time = 0.5; // Mid-day

        const startStatic = performance.now();
        for (let i = 0; i < iterations; i++) {
            clock.getCurrentPeriod();
        }
        const endStatic = performance.now();
        const durationStatic = endStatic - startStatic;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod (Static Time) x ${iterations}: ${durationStatic.toFixed(4)}ms`);

        // Scenario 2: Dynamic Time within same period (Simulating normal game loop updates)
        // Time advances, but period remains 'Day' for a long time.
        clock.time = 0.3; // Start of Day
        const increment = 0.000001; // Small increment

        const startDynamic = performance.now();
        for (let i = 0; i < iterations; i++) {
            clock.time += increment;
            if (clock.time >= 0.8) clock.time = 0.3; // Reset to keep it in 'Day' mostly, but we want to test the check overhead
            clock.getCurrentPeriod();
        }
        const endDynamic = performance.now();
        const durationDynamic = endDynamic - startDynamic;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod (Dynamic Time) x ${iterations}: ${durationDynamic.toFixed(4)}ms`);
    });
});
