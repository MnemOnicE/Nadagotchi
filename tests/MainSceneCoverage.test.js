
// tests/MainSceneCoverage.test.js
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
jest.mock('../js/WeatherParticleManager');
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
const { WeatherParticleManager } = require('../js/WeatherParticleManager');
const { EventKeys } = require('../js/EventKeys');

describe('MainScene Coverage', () => {
    let scene;
    let mockNadagotchi;
    let mockWeatherParticles;
    let mockAdd;
    let mockGameEvents;

    beforeEach(() => {
        mockNadagotchi = {
             handleAction: jest.fn(),
             interact: jest.fn().mockReturnValue("Hello!"),
             placeItem: jest.fn().mockReturnValue(true),
             live: jest.fn(),
             addJournalEntry: jest.fn(),
             stats: { happiness: 50, hunger: 50, energy: 50 },
             maxStats: { happiness: 100, hunger: 100, energy: 100 },
             skills: { logic: 10, navigation: 10, research: 10, empathy: 10, crafting: 10 },
             currentCareer: 'Innovator',
             inventory: {},
             debris: [],
             mood: 'happy',
             dominantArchetype: 'Adventurer',
             gainCareerXP: jest.fn().mockReturnValue(true),
             completeWorkShift: jest.fn().mockReturnValue({ success: true, happinessChange: 10, skillUp: 'logic', promoted: false, message: 'Work done' }),
             questSystem: {
                 generateDailyQuest: jest.fn(),
                 hasNewQuest: jest.fn().mockReturnValue(false)
             },
             returnItemToInventory: jest.fn()
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

        mockWeatherParticles = {
            resize: jest.fn(),
            update: jest.fn()
        };
        WeatherParticleManager.mockImplementation(() => mockWeatherParticles);

        mockAdd = createMockAdd();

        mockGameEvents = {
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn()
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
            on: jest.fn(),
            off: jest.fn()
        };
        scene.textures = {
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

        // Important: Attach the mock events object to the scene instance
        // This simulates the behavior of the real Phaser.Scene which has this.events
        scene.events = {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        };
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
         expect(scene.scene.get).toHaveBeenCalledWith('UIScene');

         // Default (e.g., FEED)
         scene.handleUIAction('FEED');
         expect(mockNadagotchi.handleAction).toHaveBeenCalledWith('FEED', undefined);
    });

    test('handleWorkResult should call completeWorkShift on success', () => {
        scene.create();

        // Bypass security check by setting the active minigame
        scene.activeMinigameCareer = 'Innovator';
        scene.handleWorkResult({ success: true, career: 'Innovator' });

        expect(mockNadagotchi.completeWorkShift).toHaveBeenCalled();
    });

    test('resize should update viewports', () => {
        scene.create();

        scene.resize({ width: 1000, height: 800 });

        // Dashboard is 35% of 800 = 280. Game height = 520.
        expect(scene.cameras.main.setViewport).toHaveBeenCalledWith(0, 0, 1000, 520);
        expect(scene.cameras.main.setSize).toHaveBeenCalledWith(1000, 520);

        expect(mockWeatherParticles.resize).toHaveBeenCalledWith(1000, 520);
    });

    test('update loop should update nadagotchi and stats', () => {
        scene.create();

        scene.update(1000, 16);

        expect(mockNadagotchi.live).toHaveBeenCalled();
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_STATS, expect.objectContaining({
            nadagotchi: mockNadagotchi,
            settings: scene.gameSettings,
            world: expect.any(Object)
        }));
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
        expect(scene.placedFurniture['Entryway'].length).toBe(1);
        expect(scene.isPlacementMode).toBe(false);
    });
});
