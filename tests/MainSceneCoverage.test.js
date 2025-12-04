
// tests/MainSceneCoverage.test.js

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

const { MainScene } = require('../js/MainScene');
const { Nadagotchi } = require('../js/Nadagotchi');
const { PersistenceManager } = require('../js/PersistenceManager');
const { Calendar } = require('../js/Calendar');
const { EventManager } = require('../js/EventManager');
const { WorldClock } = require('../js/WorldClock');
const { WeatherSystem } = require('../js/WeatherSystem');
const { EventKeys } = require('../js/EventKeys');

describe('MainScene Coverage', () => {
    let scene;
    let mockNadagotchi;
    let mockAdd;
    let mockGameEvents;

    beforeEach(() => {
        mockNadagotchi = {
             handleAction: jest.fn(),
             interact: jest.fn(),
             placeItem: jest.fn().mockReturnValue(true),
             live: jest.fn(),
             addJournalEntry: jest.fn(),
             stats: { happiness: 50, hunger: 50, energy: 50 },
             maxStats: { happiness: 100, hunger: 100, energy: 100 },
             skills: { logic: 10, navigation: 10, research: 10, empathy: 10, crafting: 10 },
             currentCareer: 'Innovator',
             inventory: {},
             mood: 'happy',
             dominantArchetype: 'Adventurer'
        };
        Nadagotchi.mockImplementation(() => mockNadagotchi);

        PersistenceManager.mockImplementation(() => ({
            loadPet: jest.fn(),
            savePet: jest.fn(),
            loadCalendar: jest.fn(),
            loadFurniture: jest.fn().mockReturnValue([]),
            saveFurniture: jest.fn()
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
            pause: jest.fn()
        };
        scene.time = {
            addEvent: jest.fn(),
            delayedCall: jest.fn()
        };
        scene.input = { on: jest.fn(), off: jest.fn() };
    });

    test('create should initialize systems and objects', () => {
        scene.create();
        expect(scene.nadagotchi).toBeDefined();
        expect(mockAdd.sprite).toHaveBeenCalled();
        expect(scene.scene.launch).toHaveBeenCalledWith('UIScene');
    });

    test('handleUIAction should route actions correctly', () => {
         scene.create();

         // WORK
         scene.handleUIAction('WORK');
         expect(scene.scene.launch).toHaveBeenCalledWith('LogicPuzzleScene', {});

         // RETIRE
         scene.handleUIAction('RETIRE');
         expect(scene.scene.start).toHaveBeenCalledWith('BreedingScene', mockNadagotchi);

         // INTERACT_SCOUT
         scene.handleUIAction('INTERACT_SCOUT');
         expect(mockNadagotchi.interact).toHaveBeenCalledWith('Grizzled Scout');

         // Default (e.g., FEED)
         scene.handleUIAction('FEED');
         expect(mockNadagotchi.handleAction).toHaveBeenCalledWith('FEED', undefined);
    });

    test('handleWorkResult should improve skills on success', () => {
        scene.create();

        scene.handleWorkResult({ success: true, career: 'Innovator' });

        expect(mockNadagotchi.skills.logic).toBeGreaterThan(10);
        expect(mockNadagotchi.addJournalEntry).toHaveBeenCalled();
    });

    test('resize should update viewports', () => {
        scene.create();

        scene.resize({ width: 1000, height: 800 });

        // Dashboard is 25% of 800 = 200. Game height = 600.
        expect(scene.cameras.main.setViewport).toHaveBeenCalledWith(0, 0, 1000, 600);
        expect(scene.cameras.main.setSize).toHaveBeenCalledWith(1000, 600);
    });

    test('update loop should update nadagotchi and stats', () => {
        scene.create();

        scene.update(1000, 16);

        expect(mockNadagotchi.live).toHaveBeenCalled();
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_STATS, mockNadagotchi);
    });

    test('furniture placement logic', () => {
        scene.create();

        // Enable placement mode
        scene.handleUIAction(EventKeys.DECORATE, 'Fancy Chair');
        expect(scene.isPlacementMode).toBe(true);
        expect(scene.selectedFurniture).toBe('Fancy Chair');

        // Place it
        scene.handleUIAction(EventKeys.PLACE_FURNITURE, { x: 100, y: 100 });

        expect(mockNadagotchi.placeItem).toHaveBeenCalledWith('Fancy Chair');
        expect(scene.placedFurniture.length).toBe(1);
        expect(scene.isPlacementMode).toBe(false);
    });
});
