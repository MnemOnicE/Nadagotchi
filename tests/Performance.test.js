
// tests/PerformanceRepro.test.js

// 1. Mock Phaser Global
const mockGameObject = () => {
    const listeners = {};
    const obj = {
        on: jest.fn((event, fn) => {
            listeners[event] = fn;
            return obj;
        }),
        emit: (event, ...args) => {
            if (listeners[event]) listeners[event](...args);
        },
        setInteractive: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setBlendMode: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setAngle: jest.fn().mockReturnThis(),
        setFrame: jest.fn().mockReturnThis(),
        clear: jest.fn(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        refresh: jest.fn().mockReturnThis(),
        context: {
             createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
             createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
             fillStyle: '',
             fillRect: jest.fn()
        },
        width: 800,
        height: 600
    };
    return obj;
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) { this.config = config; }
    },
    GameObjects: {
        Sprite: class Sprite { constructor() { Object.assign(this, mockGameObject()); } },
        Image: class Image { constructor() { Object.assign(this, mockGameObject()); } },
        Graphics: class Graphics { constructor() { Object.assign(this, mockGameObject()); } },
        Text: class Text { constructor() { Object.assign(this, mockGameObject()); } }
    },
    Math: {
        Between: jest.fn().mockReturnValue(1)
    },
    Display: {
        Color: class Color {
            constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
            static Interpolate = {
                ColorWithColor: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 })
            }
        }
    }
};

// 2. Mock Dependencies
jest.mock('../js/Nadagotchi');
jest.mock('../js/PersistenceManager');
jest.mock('../js/Calendar');
jest.mock('../js/EventManager');
jest.mock('../js/WorldClock');
jest.mock('../js/WeatherSystem');
jest.mock('../js/utils/SoundSynthesizer', () => ({
    SoundSynthesizer: {
        instance: {
            playClick: jest.fn(),
            playSuccess: jest.fn(),
            playFailure: jest.fn(),
            playChime: jest.fn()
        }
    }
}));

const { MainScene } = require('../js/MainScene');
const { Nadagotchi } = require('../js/Nadagotchi');
const { PersistenceManager } = require('../js/PersistenceManager');
const { Calendar } = require('../js/Calendar');
const { EventManager } = require('../js/EventManager');
const { WorldClock } = require('../js/WorldClock');
const { WeatherSystem } = require('../js/WeatherSystem');
const { EventKeys } = require('../js/EventKeys');

describe('Performance Repro: Event Emission', () => {
    let scene;
    let mockNadagotchi;
    let mockAdd;
    let mockGameEvents;

    beforeEach(() => {
        mockNadagotchi = {
             live: jest.fn(),
             stats: { happiness: 50, hunger: 50, energy: 50 },
             maxStats: { happiness: 100, hunger: 100, energy: 100 },
             mood: 'neutral'
        };
        Nadagotchi.mockImplementation(() => mockNadagotchi);

        PersistenceManager.mockImplementation(() => ({
            loadPet: jest.fn(),
            savePet: jest.fn(),
            loadCalendar: jest.fn(),
            loadFurniture: jest.fn().mockReturnValue([]),
            saveFurniture: jest.fn(),
            loadSettings: jest.fn().mockReturnValue({ volume: 0.5, gameSpeed: 1.0 }),
            saveSettings: jest.fn(),
            loadAchievements: jest.fn().mockReturnValue({ unlocked: [], progress: {} })
        }));

        Calendar.mockImplementation(() => ({
            getDate: jest.fn().mockReturnValue({ season: 'Spring', day: 1 }),
            season: 'Spring',
            advanceDay: jest.fn()
        }));

        EventManager.mockImplementation(() => ({
            getActiveEvent: jest.fn().mockReturnValue(null),
            update: jest.fn()
        }));

        WorldClock.mockImplementation(() => ({
            getCurrentPeriod: jest.fn().mockReturnValue('Day'),
            update: jest.fn().mockReturnValue(false),
            getDaylightFactor: jest.fn().mockReturnValue(1)
        }));

        WeatherSystem.mockImplementation(() => ({
            getCurrentWeather: jest.fn().mockReturnValue('Sunny')
        }));

        mockAdd = {
            sprite: jest.fn(() => new Phaser.GameObjects.Sprite()),
            image: jest.fn(() => new Phaser.GameObjects.Image()),
            graphics: jest.fn(() => new Phaser.GameObjects.Graphics()),
            text: jest.fn(() => new Phaser.GameObjects.Text())
        };

        mockGameEvents = {
            on: jest.fn(),
            emit: jest.fn()
        };

        scene = new MainScene();
        scene.add = mockAdd;
        scene.cameras = {
            main: {
                width: 800,
                height: 600,
                setSize: jest.fn(),
                setViewport: jest.fn()
            }
        };
        scene.game = { events: mockGameEvents };
        scene.scale = {
            width: 800,
            height: 600,
            on: jest.fn()
        };
        scene.textures = {
            get: jest.fn().mockReturnValue({
                getFrameNames: jest.fn().mockReturnValue([]),
                add: jest.fn()
            }),
            createCanvas: jest.fn(() => mockGameObject())
        };
        scene.scene = {
            launch: jest.fn(),
            stop: jest.fn(),
            start: jest.fn(),
            pause: jest.fn(),
            get: jest.fn()
        };
        scene.time = {
            addEvent: jest.fn(),
            delayedCall: jest.fn()
        };
        scene.input = { on: jest.fn(), off: jest.fn() };
        scene.tweens = {
            add: jest.fn(),
            killTweensOf: jest.fn()
        };
    });

    test('should throttle UPDATE_STATS emissions (Optimized)', () => {
        scene.create();

        // Frame 1: Time 1000. Should Emit (1000 - 0 > 100).
        scene.update(1000, 16);

        // Frame 2: Time 1016. Should NOT Emit (1016 - 1000 < 100).
        scene.update(1016, 16);

        // Frame 3: Time 1032. Should NOT Emit (1032 - 1000 < 100).
        scene.update(1032, 16);

        let updateStatsCalls = mockGameEvents.emit.mock.calls.filter(call => call[0] === EventKeys.UPDATE_STATS);
        expect(updateStatsCalls.length).toBe(1);

        // Frame 4: Time 1101. Should Emit (1101 - 1000 > 100).
        scene.update(1101, 16);

        updateStatsCalls = mockGameEvents.emit.mock.calls.filter(call => call[0] === EventKeys.UPDATE_STATS);
        expect(updateStatsCalls.length).toBe(2);
    });
});
