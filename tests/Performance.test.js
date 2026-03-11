
import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi.js';
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

const { MainScene } = require('../js/MainScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');
const { Calendar } = require('../js/Calendar.js');
const { EventManager } = require('../js/EventManager.js');
const { WorldClock } = require('../js/WorldClock.js');
const { WeatherSystem } = require('../js/WeatherSystem.js');
const { EventKeys } = require('../js/EventKeys');

describe('Performance Repro: Event Emission', () => {
    let scene;
    let mockGameEvents;

    beforeEach(() => {
        Nadagotchi.mockImplementation(() => ({
             handleAction: jest.fn(),
             interact: jest.fn().mockReturnValue("Hello!"),
             live: jest.fn(),
             addJournalEntry: jest.fn(),
             stats: { happiness: 50, hunger: 50, energy: 50 },
             maxStats: { happiness: 100, hunger: 100, energy: 100 },
             skills: { logic: 10 },
             currentCareer: 'Innovator',
             inventory: {},
             debris: {}, debrisCount: 0,
             questSystem: {
                 generateDailyQuest: jest.fn(),
                 hasNewQuest: jest.fn().mockReturnValue(false)
             },
             mood: 'happy',
             dominantArchetype: 'Adventurer'
        }));

        PersistenceManager.mockImplementation(() => ({
            loadPet: jest.fn(),
            savePet: jest.fn(),
            loadCalendar: jest.fn(),
            loadFurniture: jest.fn().mockReturnValue([]),
            saveFurniture: jest.fn(),
            loadSettings: jest.fn().mockReturnValue({ volume: 0.5, gameSpeed: 1.0 }),
            saveSettings: jest.fn(),
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
            emit: jest.fn(),
            off: jest.fn()
        };

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
        scene.game = { events: mockGameEvents };
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
            createCanvas: jest.fn(() => mockGameObject()), exists: jest.fn().mockReturnValue(false)
        };
        scene.scene = {
            launch: jest.fn(),
            stop: jest.fn(),
            start: jest.fn(),
            pause: jest.fn(),
            get: jest.fn().mockReturnValue({ // Mocking scene.get('UIScene')
                 showDialogue: jest.fn()
            })
        };
        scene.time = {
            addEvent: jest.fn(),
            delayedCall: jest.fn()
        };
        scene.input = {
            on: jest.fn(),
            off: jest.fn(),
            setDraggable: jest.fn(),
            setDefaultCursor: jest.fn()
        };
        scene.tweens = {
            add: jest.fn(),
            killTweensOf: jest.fn()
        };
        scene.events = {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        };
    });

    test('should throttle UPDATE_STATS emissions (Optimized)', () => {
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
        if (!scene.nadagotchi.init) scene.nadagotchi.init = jest.fn();
        scene.thoughtBubble = { visible: false, setVisible: jest.fn() }; scene.exploreBubble = { visible: false, setVisible: jest.fn() }; scene.sprite = { setFrame: jest.fn(), setPosition: jest.fn(), setScale: jest.fn(), setAngle: jest.fn(), setAlpha: jest.fn(), setTint: jest.fn(), clearTint: jest.fn() };
        scene.lastStatsUpdate = -1000;

        // 1. Initial Update (Time: 0) -> Should Emit
        scene.update(0, 16);
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_STATS, expect.anything());
        mockGameEvents.emit.mockClear();

        // 2. Fast Update (Time: 16ms) -> Should NOT Emit (Throttled)
        scene.update(16, 16);
        expect(mockGameEvents.emit).not.toHaveBeenCalled();

        // 3. Fast Update (Time: 50ms) -> Should NOT Emit
        scene.update(50, 16);
        expect(mockGameEvents.emit).not.toHaveBeenCalled();

        // 4. Slow Update (Time: 101ms) -> Should Emit (> 100ms passed)
        scene.update(101, 16);
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_STATS, expect.anything());
    });
});
