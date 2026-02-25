import { WorldClock } from '../../js/WorldClock.js';

describe('WorldClock Performance Benchmark', () => {
    test('Benchmark: WorldClock.getCurrentPeriod (Dynamic Time)', () => {
        const iterations = 10000;
        const worldClock = new WorldClock({}); // Minimal mock scene

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
             // Simulate time progression
             worldClock.update(16); // 16ms delta
             worldClock.getCurrentPeriod();
        }

        const endTime = performance.now();
        const durationDynamic = endTime - startTime;

        console.log(`[Benchmark] WorldClock.getCurrentPeriod (Dynamic Time) x ${iterations}: ${durationDynamic.toFixed(4)}ms`);
    });
});
