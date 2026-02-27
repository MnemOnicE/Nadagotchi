// tests/Performance_UpdateStats.test.js
import { setupPhaserMock, createMockAdd, mockGameObject } from './helpers/mockPhaser';

// 1. Setup Phaser Mock
setupPhaserMock();

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
             inventory: {},
             debris: [],
             questSystem: {
                 generateDailyQuest: jest.fn(),
                 hasNewQuest: jest.fn().mockReturnValue(false)
             }
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
        scene.add = createMockAdd();
        scene.make = {
            image: jest.fn().mockReturnValue(mockGameObject()),
            graphics: jest.fn().mockReturnValue(mockGameObject()),
            text: jest.fn()
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
            exists: jest.fn().mockReturnValue(false),
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
