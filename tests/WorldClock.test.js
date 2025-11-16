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
