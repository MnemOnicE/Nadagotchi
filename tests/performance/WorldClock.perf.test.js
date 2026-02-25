
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
