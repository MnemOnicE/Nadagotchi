import { WorldClock } from '../../js/WorldClock.js';
import { SeededRandom } from '../../js/utils/SeededRandom.js';
import { setupPhaserMock, createMockScene } from '../helpers/mockPhaser.js';

setupPhaserMock();

describe('WorldClock Performance', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
    });

    test('getCurrentPeriod() benchmark - Cached vs Uncached', () => {
        const clock = new WorldClock(mockScene);
        const iterations = 1000000;
        const delta = 1000 / 60;

        const start = Date.now();
        for (let i = 0; i < iterations; i++) {
            clock.update(delta);
            clock.getCurrentPeriod();
        }
        const duration = Date.now() - start;
        console.log(`[Benchmark] WorldClock.getCurrentPeriod x ${iterations} (sequential update): ${duration}ms`);

        const randomClock = new WorldClock(mockScene);
        const rng = new SeededRandom(12345);
        const randomStart = Date.now();
        for (let i = 0; i < iterations; i++) {
            randomClock.time = rng.random();
            randomClock.getCurrentPeriod();
        }
        const randomDuration = Date.now() - randomStart;
        console.log(`[Benchmark] WorldClock.getCurrentPeriod x ${iterations} (random access): ${randomDuration}ms`);

        expect(duration).toBeLessThan(5000);
    });
});
