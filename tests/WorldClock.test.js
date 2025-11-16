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
// tests/WorldClock.test.js
const fs = require('fs');
const path = require('path');

// Load the class from the source file
const worldClockCode = fs.readFileSync(path.resolve(__dirname, '../js/WorldClock.js'), 'utf8');
const WorldClock = eval(worldClockCode + '; module.exports = WorldClock;');

// Mock Phaser since it's not available in the Node.js test environment
const Phaser = {
    Scene: class {}
};
global.Phaser = Phaser;

describe('WorldClock', () => {
    let clock;
    let scene;

    beforeEach(() => {
        scene = new Phaser.Scene();
        clock = new WorldClock(scene);
    });

    test('constructor should initialize to the start of dawn', () => {
        expect(clock.time).toBe(0.25); // 6 AM
        expect(clock.getCurrentPeriod()).toBe('Dawn');
    });

    test('update() should advance time', () => {
        const initialTime = clock.time;
        clock.update(1000); // 1 second
        expect(clock.time).toBeGreaterThan(initialTime);
    });

    test('update() should wrap around after a full day', () => {
        clock.time = 0.999;
        const dayDurationInMs = 240 * 1000;
        const onePercentOfDay = dayDurationInMs * 0.01;
        clock.update(onePercentOfDay);
        expect(clock.time).toBeLessThan(0.1); // Should have wrapped around
    });

    describe('getCurrentPeriod', () => {
        test.each([
            [0.1, 'Night'],   // 2:24 AM
            [0.25, 'Dawn'],   // 6:00 AM
            [0.5, 'Day'],     // 12:00 PM
            [0.85, 'Dusk'],   // 8:24 PM
            [0.95, 'Night']    // 10:48 PM
        ])('should return %s for time %f', (time, expectedPeriod) => {
            clock.time = time;
            expect(clock.getCurrentPeriod()).toBe(expectedPeriod);
        });
    });

    describe('getDaylightFactor', () => {
        test('should be 0 (full night) in the middle of the night', () => {
            clock.time = 0;
            expect(clock.getDaylightFactor()).toBe(0);
        });

        test('should be 1 (full day) in the middle of the day', () => {
            clock.time = 0.5;
            expect(clock.getDaylightFactor()).toBe(1);
        });

        test('should be 0.5 (mid-dawn) halfway through dawn', () => {
            clock.time = 0.25; // Dawn is 0.2 to 0.3, so 0.25 is halfway
            expect(clock.getDaylightFactor()).toBeCloseTo(0.5);
        });

        test('should be 0.5 (mid-dusk) halfway through dusk', () => {
            clock.time = 0.85; // Dusk is 0.8 to 0.9, so 0.85 is halfway
            expect(clock.getDaylightFactor()).toBeCloseTo(0.5);
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
