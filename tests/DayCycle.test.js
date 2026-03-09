
import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi.js';
import { Calendar } from '../js/Calendar';
import { WorldClock } from '../js/WorldClock';
import { EventManager } from '../js/EventManager';
import { WeatherSystem } from '../js/WeatherSystem';
import { EventKeys } from '../js/EventKeys';
import { setupPhaserMock, createMockAdd, mockGameObject } from './helpers/mockPhaser';

// 1. Setup Phaser Mock
setupPhaserMock();

// Required AFTER global.Phaser is set
const { MainScene } = require('../js/MainScene.js');

// Mock Dependencies
jest.mock('../js/Nadagotchi.js');
jest.mock('../js/PersistenceManager.js');
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

const { PersistenceManager } = require('../js/PersistenceManager.js');

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
             debris: {},
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
            exists: jest.fn().mockReturnValue(true),
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
        scene.isReady = true;
        if (!scene.worldClock) scene.worldClock = { update: jest.fn().mockReturnValue(false), getCurrentPeriod: jest.fn() };
        if (!scene.calendar) scene.calendar = { advanceDay: jest.fn(), season: 'Spring', getDate: jest.fn().mockReturnValue({day:1, year:1}) };
        if (!scene.eventManager) scene.eventManager = { getActiveEvent: jest.fn(), update: jest.fn() };
        if (!scene.weatherSystem) scene.weatherSystem = { getCurrentWeather: jest.fn().mockReturnValue('Clear') };
        if (!scene.skyManager) scene.skyManager = { update: jest.fn(), resize: jest.fn() };
        if (!scene.weatherParticles) scene.weatherParticles = { update: jest.fn(), resize: jest.fn() };
        if (!scene.lightingManager) scene.lightingManager = { update: jest.fn(), resize: jest.fn() };
        if (!scene.gameSettings) scene.gameSettings = { gameSpeed: 1.0 };
        if (!scene.worldState) scene.worldState = { time: 'Day', weather: 'Clear', activeEvent: null, season: 'Spring' };
        scene.questIndicators = {};
        scene.debrisGroup = { clear: jest.fn(), add: jest.fn() };
        if (!scene.nadagotchi) scene.nadagotchi = {};
        if (!scene.nadagotchi.stats) scene.nadagotchi.stats = { hunger: 100 };
        if (!scene.nadagotchi.relationshipSystem) scene.nadagotchi.relationshipSystem = { dailyUpdate: jest.fn() };
        if (!scene.nadagotchi.questSystem) scene.nadagotchi.questSystem = { generateDailyQuest: jest.fn(), hasNewQuest: jest.fn() };
        if (!scene.nadagotchi.debrisSystem) scene.nadagotchi.debrisSystem = { spawnDaily: jest.fn(), spawnPoop: jest.fn() };
        if (!scene.nadagotchi.live) scene.nadagotchi.live = jest.fn();
        scene.nadagotchi.debris = {};
        if (!scene.nadagotchi.init) scene.nadagotchi.init = jest.fn();
        scene.thoughtBubble = { visible: false, setVisible: jest.fn() }; scene.exploreBubble = { visible: false, setVisible: jest.fn() }; scene.sprite = { setFrame: jest.fn(), setPosition: jest.fn(), setScale: jest.fn(), setAngle: jest.fn(), setAlpha: jest.fn(), setTint: jest.fn(), clearTint: jest.fn() };
        scene.lastStatsUpdate = 0;

        // 1. Simulate Day Pass
        scene.worldClock.update.mockReturnValue(true);
        mockWorldClock.update.mockReturnValue(true); // Day passed

        scene.update(1000, 16);

        expect(scene.calendar.advanceDay).toHaveBeenCalled();
        expect(scene.nadagotchi.relationshipSystem.dailyUpdate).toHaveBeenCalled();
        expect(scene.nadagotchi.questSystem.generateDailyQuest).toHaveBeenCalled();
        expect(scene.eventManager.update).toHaveBeenCalled();
    });

    test('should NOT advance calendar if day has not passed', () => {
        scene.create();
        scene.isReady = true;
        if (!scene.worldClock) scene.worldClock = { update: jest.fn().mockReturnValue(false), getCurrentPeriod: jest.fn() };
        if (!scene.calendar) scene.calendar = { advanceDay: jest.fn(), season: 'Spring', getDate: jest.fn().mockReturnValue({day:1, year:1}) };
        if (!scene.eventManager) scene.eventManager = { getActiveEvent: jest.fn(), update: jest.fn() };
        if (!scene.weatherSystem) scene.weatherSystem = { getCurrentWeather: jest.fn().mockReturnValue('Clear') };
        if (!scene.skyManager) scene.skyManager = { update: jest.fn(), resize: jest.fn() };
        if (!scene.weatherParticles) scene.weatherParticles = { update: jest.fn(), resize: jest.fn() };
        if (!scene.lightingManager) scene.lightingManager = { update: jest.fn(), resize: jest.fn() };
        if (!scene.gameSettings) scene.gameSettings = { gameSpeed: 1.0 };
        if (!scene.worldState) scene.worldState = { time: 'Day', weather: 'Clear', activeEvent: null, season: 'Spring' };
        scene.questIndicators = {};
        scene.debrisGroup = { clear: jest.fn(), add: jest.fn() };
        if (!scene.nadagotchi) scene.nadagotchi = {};
        if (!scene.nadagotchi.stats) scene.nadagotchi.stats = { hunger: 100 };
        if (!scene.nadagotchi.relationshipSystem) scene.nadagotchi.relationshipSystem = { dailyUpdate: jest.fn() };
        if (!scene.nadagotchi.questSystem) scene.nadagotchi.questSystem = { generateDailyQuest: jest.fn(), hasNewQuest: jest.fn() };
        if (!scene.nadagotchi.debrisSystem) scene.nadagotchi.debrisSystem = { spawnDaily: jest.fn(), spawnPoop: jest.fn() };
        if (!scene.nadagotchi.live) scene.nadagotchi.live = jest.fn();
        scene.nadagotchi.debris = [];
        if (!scene.nadagotchi.init) scene.nadagotchi.init = jest.fn();
        scene.thoughtBubble = { visible: false, setVisible: jest.fn() }; scene.exploreBubble = { visible: false, setVisible: jest.fn() }; scene.sprite = { setFrame: jest.fn(), setPosition: jest.fn(), setScale: jest.fn(), setAngle: jest.fn(), setAlpha: jest.fn(), setTint: jest.fn(), clearTint: jest.fn() };
        scene.lastStatsUpdate = 0;

        // 1. Simulate Tick
        mockWorldClock.update.mockReturnValue(false); // Day NOT passed

        scene.update(1000, 16);

        expect(scene.calendar.advanceDay).not.toHaveBeenCalled();
    });
});
