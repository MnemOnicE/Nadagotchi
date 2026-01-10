
import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi';
import { Calendar } from '../js/Calendar';
import { WorldClock } from '../js/WorldClock';
import { EventManager } from '../js/EventManager';
import { WeatherSystem } from '../js/WeatherSystem';
import { EventKeys } from '../js/EventKeys';

// Mock Phaser Global
const mockGameObject = () => {
    return {
        on: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        setInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setBlendMode: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAngle: jest.fn().mockReturnThis(),
        setFrame: jest.fn().mockReturnThis(),
        clear: jest.fn(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
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
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.config = config;
            // Ensure this.events exists
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

// Required AFTER global.Phaser is set
const { MainScene } = require('../js/MainScene');

// Mock Dependencies
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

const { PersistenceManager } = require('../js/PersistenceManager');

describe('Day Cycle Integration', () => {
    let scene;
    let mockNadagotchi;
    let mockCalendar;
    let mockWorldClock;
    let mockEventManager;
    let mockWeatherSystem;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        mockNadagotchi = {
             handleAction: jest.fn(),
             interact: jest.fn(),
             live: jest.fn(),
             stats: { happiness: 50, hunger: 50, energy: 50 },
             maxStats: { happiness: 100, hunger: 100, energy: 100 },
             inventory: {},
             relationshipSystem: { dailyUpdate: jest.fn() },
             questSystem: { generateDailyQuest: jest.fn() }
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

        mockCalendar = {
            getDate: jest.fn().mockReturnValue({ season: 'Spring', day: 1 }),
            season: 'Spring',
            advanceDay: jest.fn()
        };
        Calendar.mockImplementation(() => mockCalendar);

        mockEventManager = {
            getActiveEvent: jest.fn().mockReturnValue(null),
            update: jest.fn()
        };
        EventManager.mockImplementation(() => mockEventManager);

        mockWorldClock = {
            getCurrentPeriod: jest.fn().mockReturnValue('Day'),
            update: jest.fn().mockReturnValue(false),
            getDaylightFactor: jest.fn().mockReturnValue(1)
        };
        WorldClock.mockImplementation(() => mockWorldClock);

        mockWeatherSystem = {
            getCurrentWeather: jest.fn().mockReturnValue('Sunny')
        };
        WeatherSystem.mockImplementation(() => mockWeatherSystem);

        scene = new MainScene();
        scene.add = {
            sprite: jest.fn(() => new Phaser.GameObjects.Sprite()),
            image: jest.fn(() => new Phaser.GameObjects.Image()),
            graphics: jest.fn(() => new Phaser.GameObjects.Graphics()),
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            tileSprite: jest.fn(() => {
                const sprite = new Phaser.GameObjects.Sprite();
                sprite.setTilePosition = jest.fn().mockReturnThis();
                return sprite;
            })
        };
        scene.cameras = {
            main: {
                width: 800,
                height: 600,
                setSize: jest.fn(),
                setViewport: jest.fn()
            }
        };
        scene.game = { events: { emit: jest.fn(), on: jest.fn(), off: jest.fn() } };
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
        // Add events directly to scene
        scene.events = {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        };
    });

    test('should advance calendar day when full day passes', () => {
        scene.create();

        // 1. Simulate Day Pass
        mockWorldClock.update.mockReturnValue(true); // Day passed

        scene.update(1000, 16);

        expect(mockCalendar.advanceDay).toHaveBeenCalled();
        expect(mockNadagotchi.relationshipSystem.dailyUpdate).toHaveBeenCalled();
        expect(mockNadagotchi.questSystem.generateDailyQuest).toHaveBeenCalled();
        expect(mockEventManager.update).toHaveBeenCalled();
    });

    test('should NOT advance calendar if day has not passed', () => {
        scene.create();

        // 1. Simulate Tick
        mockWorldClock.update.mockReturnValue(false); // Day NOT passed

        scene.update(1000, 16);

        expect(mockCalendar.advanceDay).not.toHaveBeenCalled();
    });
});
