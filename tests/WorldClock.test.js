const WorldClock = require('../js/WorldClock');

// Mock Phaser Scene
const mockScene = {};

describe('WorldClock', () => {
    let clock;

    // A 240-second day means each hour is 10 seconds.
    // Each millisecond in real-time corresponds to 0.000004166... in-game time.
    const DAY_DURATION_SECONDS = 240;
    const MS_PER_DAY = DAY_DURATION_SECONDS * 1000;
    const TIME_PER_MS = 1 / MS_PER_DAY;


    beforeEach(() => {
        clock = new WorldClock(mockScene, DAY_DURATION_SECONDS);
    });

    test('should initialize to 6 AM', () => {
        expect(clock.time).toBe(0.25); // 6 / 24 = 0.25
        expect(clock.getCurrentPeriod()).toBe('Dawn');
    });

    test('update should advance the time correctly', () => {
        const initialTime = clock.time;
        const deltaTimeMs = 1000; // 1 second
        clock.update(deltaTimeMs);
        expect(clock.time).toBe(initialTime + (deltaTimeMs / MS_PER_DAY));
    });

    test('time should wrap around after a full day', () => {
        clock.time = 0.999;
        // A delta that would push it over 1
        const deltaTimeMs = 5000; // 5 seconds
        clock.update(deltaTimeMs);
        expect(clock.time).toBeLessThan(1);
        expect(clock.time).toBeGreaterThan(0);
    });

    describe('getCurrentPeriod', () => {
        test('should return "Night" at midnight', () => {
            clock.time = 0;
            expect(clock.getCurrentPeriod()).toBe('Night');
        });
        test('should return "Dawn" at 5 AM', () => {
            clock.time = 0.22;
            expect(clock.getCurrentPeriod()).toBe('Dawn');
        });
        test('should return "Day" at noon', () => {
            clock.time = 0.5;
            expect(clock.getCurrentPeriod()).toBe('Day');
        });
        test('should return "Dusk" at 8 PM', () => {
            clock.time = 0.85; // 20:24
            expect(clock.getCurrentPeriod()).toBe('Dusk');
        });
        test('should return "Night" at 11 PM', () => {
            clock.time = 0.95; // 22:48
            expect(clock.getCurrentPeriod()).toBe('Night');
        });
    });

    describe('getDaylightFactor', () => {
        test.each([
            [0.1, 0],         // Night
            [0.2, 0],         // Dawn start
            [0.25, 0.5],      // Mid-Dawn
            [0.3, 1],         // Day start
            [0.5, 1],         // Mid-day
            [0.8, 1],         // Dusk start
            [0.85, 0.5],      // Mid-Dusk
            [0.9, 0],         // Night start
            [0.95, 0]         // Night
        ])('should return %f for time %f', (time, expectedFactor) => {
            clock.time = time;
            expect(clock.getDaylightFactor()).toBeCloseTo(expectedFactor);
        });
    });
});
