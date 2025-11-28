// tests/DayCycle.test.js

// Mock Phaser scenes and game objects
class Scene {
    constructor(key) {
        this.key = key;
        this.scene = {
            start: jest.fn(),
            stop: jest.fn(),
            launch: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            isPaused: jest.fn().mockReturnValue(false),
        };
        // Mocking chainable methods on 'add'
        const gameObjectMock = {
            setText: jest.fn(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setStyle: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis(),
            setFrame: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setBlendMode: jest.fn().mockReturnThis(),
            setSize: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
            clear: jest.fn(),
            context: {
                createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                fillStyle: '',
                fillRect: jest.fn()
            },
            refresh: jest.fn(),
            fill: jest.fn(),
            fillStyle: jest.fn(),
            fillRect: jest.fn(),
            lineStyle: jest.fn(),
            strokeRect: jest.fn(),
            generateTexture: jest.fn(),
            fillCircle: jest.fn()
        };

        const addMock = {
            text: jest.fn(() => gameObjectMock),
            sprite: jest.fn(() => gameObjectMock),
            container: jest.fn(() => gameObjectMock),
            graphics: jest.fn(() => gameObjectMock),
            particles: jest.fn(() => gameObjectMock),
            renderTexture: jest.fn(() => gameObjectMock),
            image: jest.fn(() => gameObjectMock),
            group: jest.fn(() => addMock),
            rectangle: jest.fn(() => gameObjectMock),
            setInteractive: jest.fn(() => addMock),
            on: jest.fn(() => addMock),
            setOrigin: jest.fn(() => addMock),
            setScale: jest.fn(() => addMock),
            setVisible: jest.fn(() => addMock),
            setAlpha: jest.fn(() => addMock),
            disableInteractive: jest.fn(() => addMock),
            setBackgroundColor: jest.fn(() => addMock),
            setStyle: jest.fn(() => addMock),
            destroy: jest.fn(),
            addMultiple: jest.fn(),
            content: { setText: jest.fn() }
        };
        this.add = addMock;
        this.input = { on: jest.fn(), off: jest.fn() };
        this.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        this.cameras = {
            main: {
                width: 800,
                height: 600,
                setBackgroundColor: jest.fn(),
                setSize: jest.fn(),
                setViewport: jest.fn()
            }
        };
        this.game = { events: { on: jest.fn(), emit: jest.fn() } };
        this.scale = { on: jest.fn(), width: 800, height: 600 };
        this.textures = {
            createCanvas: jest.fn().mockReturnValue(gameObjectMock),
            addDynamicTexture: jest.fn().mockReturnValue(gameObjectMock),
            generateTexture: jest.fn(),
            get: jest.fn().mockReturnValue({ get: jest.fn(), getFrameNames: jest.fn().mockReturnValue([]), add: jest.fn() })
        };
        this.make = { graphics: jest.fn(() => gameObjectMock) };
        this.tweens = { add: jest.fn() };
        this.load = {
            spritesheet: jest.fn(),
            image: jest.fn(),
        };
    }
}

// Mock Phaser Color class
class Color {
    constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
}
Color.Interpolate = { ColorWithColor: jest.fn(() => ({ r: 0, g: 0, b: 0 })) };

// Mock Phaser globally
global.Phaser = {
    Scene,
    Utils: { Array: { GetRandom: (arr) => arr[0] } },
    Math: { Between: (min, max) => min, Clamp: (v, min, max) => Math.min(Math.max(v, min), max) },
    Display: { Color: Color },
    Scale: { FIT: 0, CENTER_BOTH: 1 }
};

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Load classes
const Nadagotchi = require('../js/Nadagotchi.js');
const MainScene = require('../js/MainScene.js');
const PersistenceManager = require('../js/PersistenceManager.js');
const Calendar = require('../js/Calendar.js');
const WorldClock = require('../js/WorldClock.js');
const EventManager = require('../js/EventManager.js');
const WeatherSystem = require('../js/WeatherSystem.js');

// Assign to global scope
global.Nadagotchi = Nadagotchi;
global.PersistenceManager = PersistenceManager;
global.Calendar = Calendar;
global.WorldClock = WorldClock;
global.EventManager = EventManager;
global.WeatherSystem = WeatherSystem;

describe('Day Cycle Integration', () => {
    let mainScene;

    beforeEach(() => {
        // Mock game events
        const events = {};
        const gameEvents = {
            on: jest.fn((event, fn, context) => {
                if (!events[event]) events[event] = [];
                events[event].push({ fn, context });
            }),
            emit: jest.fn((event, ...args) => {
                if (events[event]) {
                    events[event].forEach(listener => listener.fn.apply(listener.context, args));
                }
            }),
        };

        mainScene = new MainScene();
        mainScene.game = { events: gameEvents };

        // Initialize scene
        mainScene.preload();
        mainScene.create();
    });

    test('should advance calendar day when full day passes', () => {
        // Initial state
        expect(mainScene.calendar.day).toBe(1);
        expect(mainScene.calendar.season).toBe('Spring');

        // Spy on advanceDay
        const advanceDaySpy = jest.spyOn(mainScene.calendar, 'advanceDay');

        // Simulate passing of time
        // Day duration is 240 seconds (from WorldClock default) = 240,000 ms
        // We need to pass enough time to wrap around the clock.
        // Current time starts at 0.25 (Dawn)

        const fullDayMs = 240 * 1000;

        // Pass enough time to complete the day (0.25 to 1.0 is 0.75 of a day = 180s = 180,000ms)
        // Let's pass a full day duration just to be sure.

        // We simulate update loops.
        // Calling update with large delta might just wrap once.
        mainScene.update(0, fullDayMs);

        // Expect advanceDay to have been called
        expect(advanceDaySpy).toHaveBeenCalled();
        expect(mainScene.calendar.day).toBe(2);
    });
});
