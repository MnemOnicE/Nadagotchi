
import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi';
import { Calendar } from '../js/Calendar';
import { WorldClock } from '../js/WorldClock';
import { EventManager } from '../js/EventManager';
import { WeatherSystem } from '../js/WeatherSystem';
import { EventKeys } from '../js/EventKeys';
import { setupPhaserMock, createMockAdd, mockGameObject } from './helpers/mockPhaser';

// 1. Setup Phaser Mock
setupPhaserMock();

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
             debris: [],
             relationshipSystem: { dailyUpdate: jest.fn() },
             questSystem: {
                 generateDailyQuest: jest.fn(),
                 hasNewQuest: jest.fn().mockReturnValue(false)
             }
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
        scene.add = createMockAdd();
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
