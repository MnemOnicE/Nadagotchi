
// tests/Performance_UpdateStats.test.js

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
        setTint: jest.fn().mockReturnThis(),
        clearTint: jest.fn().mockReturnThis(),
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
        constructor(config) {
            this.config = config;
            // Ensure this.events exists for all Scenes
            this.events = {
                on: jest.fn(),
                off: jest.fn(),
                emit: jest.fn()
            };
            this.plugins = {
                get: jest.fn()
            };
        }
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

describe('Performance: Update Stats Throttling', () => {
    let scene;
    let mockGameEvents;

    beforeEach(() => {
        Nadagotchi.mockImplementation(() => ({
             handleAction: jest.fn(),
             interact: jest.fn(),
             live: jest.fn(),
             stats: { happiness: 50, hunger: 50, energy: 50 },
             maxStats: { happiness: 100, hunger: 100, energy: 100 },
             inventory: {}
        }));

        PersistenceManager.mockImplementation(() => ({
            loadPet: jest.fn(),
            savePet: jest.fn(),
            loadCalendar: jest.fn(),
            loadFurniture: jest.fn().mockReturnValue([]),
            saveFurniture: jest.fn(),
            loadSettings: jest.fn().mockReturnValue({}),
            loadAchievements: jest.fn().mockReturnValue({ unlocked: [], progress: {} }),
            loadHomeConfig: jest.fn().mockReturnValue({ rooms: { "Entryway": { wallpaperItem: 'Default', flooringItem: 'Default' } } })
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

        mockGameEvents = {
            on: jest.fn(),
            emit: jest.fn()
        };

        scene = new MainScene();
        scene.add = {
            sprite: jest.fn(() => new Phaser.GameObjects.Sprite()),
            image: jest.fn(() => new Phaser.GameObjects.Image()),
            graphics: jest.fn(() => new Phaser.GameObjects.Graphics()),
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            tileSprite: jest.fn(() => new Phaser.GameObjects.Sprite())
        };
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
            on: jest.fn(),
            off: jest.fn()
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
            get: jest.fn().mockReturnValue({ showDialogue: jest.fn() })
        };
        scene.time = {
            addEvent: jest.fn(),
            delayedCall: jest.fn()
        };
        scene.tweens = {
            add: jest.fn(),
            killTweensOf: jest.fn()
        };
        scene.input = {
            on: jest.fn(),
            off: jest.fn(),
            setDraggable: jest.fn(),
            setDefaultCursor: jest.fn()
        };
        scene.events = {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        };
    });

    test('should throttle UPDATE_STATS events', () => {
        scene.create();

        // Simulating 60 frames at 16ms delta
        // Total time: ~1000ms
        let currentTime = 0;
        const delta = 16;

        for (let i = 0; i < 60; i++) {
            currentTime += delta;
            scene.update(currentTime, delta);
        }

        const callCount = mockGameEvents.emit.mock.calls.filter(call => call[0] === EventKeys.UPDATE_STATS).length;

        console.log(`UPDATE_STATS emitted ${callCount} times in 60 frames (~1 sec).`);

        // Without optimization, this should be 60.
        // With optimization (10Hz), this should be roughly 10.

        // Asserting expected behavior for OPTIMIZED code.
        // If unoptimized, this test will fail, confirming the need for optimization.
        expect(callCount).toBeLessThanOrEqual(12); // Allowing slight margin
        expect(callCount).toBeGreaterThanOrEqual(8);
    });
});
