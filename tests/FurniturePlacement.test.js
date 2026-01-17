
import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi.js';

// Mock Phaser first
global.Phaser = {
    Scene: class {},
    Math: { Between: jest.fn() },
    Utils: { Array: { GetRandom: jest.fn() } },
    GameObjects: { Sprite: class {} },
    Display: {
        Color: class {
            constructor() {}
            static Interpolate = { ColorWithColor: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 }) };
            static ComponentToHex = jest.fn();
            static GetColor = jest.fn();
        }
    }
};

// Require MainScene after Phaser is defined
const { MainScene } = require('../js/MainScene');

// Mock Config
jest.mock('../js/Config.js', () => ({
    Config: {
        INITIAL_STATE: {
            PERSONALITY_POINTS_STARTER: 10,
            STATS: { hunger: 100, energy: 100, happiness: 100 },
            SKILLS: { logic: 0, research: 0, empathy: 0, navigation: 0, crafting: 0, focus: 0, communication: 0 },
            MOOD_SENSITIVITY_DEFAULT: 5,
            GENOME_STARTER_VAL: 10
        },
        LIMITS: { MAX_STATS: 100 },
        GAME_LOOP: { MS_PER_FRAME: 16 },
        DECAY: { HUNGER: 0.1, ENERGY: 0.1, AGE_INCREMENT: 0.001 },
        THRESHOLDS: { HUNGER_ANGRY: 20, HUNGER_SAD: 50, ENERGY_SAD: 30, HAPPY_MOOD: 80, HAPPY_MOOD_HOMOZYGOUS: 60, AGE_LEGACY: 10 },
        GENETICS: { METABOLISM_NORMALIZER: 5, HOMOZYGOUS_ENERGY_BONUS: 20 },
        ENV_MODIFIERS: {
            FESTIVAL_HAPPINESS: 0,
            RAINY: { ADVENTURER_HAPPINESS: 0, NURTURER_ENERGY_MULT: 1 },
            STORMY: { ADVENTURER_HAPPINESS: 0, RECLUSE_HAPPINESS: 0, ENERGY_MULT: 1 },
            CLOUDY: { ENERGY_MULT: 1 },
            SUNNY: { ADVENTURER_HAPPINESS: 0, ENERGY_MULT: 1 },
            NIGHT: { HUNGER_MULT: 1, RECLUSE_HAPPINESS: 0, ADVENTURER_ENERGY_MULT: 1 },
            TWILIGHT: { ENERGY_MULT: 1 },
            DAY: { INTELLECTUAL_ENERGY_MULT: 1 }
        },
        ACTIONS: {
            FEED: { HUNGER_RESTORE: 20, HAPPINESS_RESTORE: 5 },
            PLAY: { ENERGY_COST: 10, HAPPINESS_RESTORE: 10, RECLUSE_HAPPINESS_PENALTY: 5 },
            STUDY: { ENERGY_COST: 10, HAPPINESS_COST: 5, SKILL_GAIN: 1, HAPPINESS_RESTORE_INTELLECTUAL: 5, NAVIGATION_GAIN_ADVENTURER: 1 },
            INTERACT_BOOKSHELF: { ENERGY_COST: 5, HAPPINESS_COST: 0, SKILL_GAIN: 1, HAPPINESS_RESTORE_INTELLECTUAL: 5 },
            INTERACT_PLANT: { ENERGY_COST: 5, HAPPINESS_RESTORE: 5, HAPPINESS_RESTORE_NURTURER: 5, SKILL_GAIN: 1 },
            INTERACT_FANCY_BOOKSHELF: { ENERGY_COST: 5, HAPPINESS_RESTORE: 10, HAPPINESS_RESTORE_INTELLECTUAL: 10, SKILL_GAIN: 2, PERSONALITY_GAIN: 1 },
            EXPLORE: { ENERGY_COST: 20, HAPPINESS_RESTORE_DEFAULT: 5, HAPPINESS_RESTORE_ADVENTURER: 15, HAPPINESS_PENALTY_RECLUSE: 5, SKILL_GAIN: 2 },
            MEDITATE: { ENERGY_RESTORE: 10, HAPPINESS_RESTORE: 5, SKILL_GAIN: 1, PERSONALITY_GAIN_RECLUSE: 1 },
            PRACTICE_HOBBY: { ENERGY_COST: 10, HAPPINESS_RESTORE: 10 },
            INTERACT_NPC: { ENERGY_COST: 5 },
            CRAFT: { ENERGY_COST: 10, HAPPINESS_RESTORE: 5, HAPPINESS_PENALTY_MISSING_MATS: 5, SKILL_GAIN: 1 }
        },
        MOOD_MULTIPLIERS: { HAPPY: 1.5, SAD: 0.5, ANGRY: 0.8, NEUTRAL: 1.0 },
        CAREER: { XP_PER_WORK: 100, PROMOTION_BONUS: 20 },
        UI: { DASHBOARD_HEIGHT_RATIO: 0.25 },
        SETTINGS: {
            DEFAULT_VOLUME: 0.5,
            DEFAULT_SPEED: 1.0
        }
    }
}));

// Mock SoundSynthesizer
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

// Mock Phaser objects
const mockSprite = {
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setTint: jest.fn(),
    clearTint: jest.fn(),
    x: 100,
    y: 100,
    destroy: jest.fn(),
    setPosition: jest.fn(),
    setScale: jest.fn().mockReturnThis(),
    setAngle: jest.fn(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setBlendMode: jest.fn().mockReturnThis()
};

const mockGraphics = {
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    setPosition: jest.fn(),
    clear: jest.fn(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn()
};

const mockInput = {
    on: jest.fn(),
    off: jest.fn(),
    setDraggable: jest.fn(),
    setDefaultCursor: jest.fn()
};

const mockPersistence = {
    saveFurniture: jest.fn(),
    loadFurniture: jest.fn().mockReturnValue([]),
    loadCalendar: jest.fn().mockReturnValue({}),
    loadPet: jest.fn().mockReturnValue(null), // New pet
    savePet: jest.fn(),
    loadSettings: jest.fn().mockReturnValue({}),
    saveSettings: jest.fn(),
    loadJournal: jest.fn().mockReturnValue([]),
    loadRecipes: jest.fn().mockReturnValue([]),
    loadAchievements: jest.fn().mockReturnValue({ unlocked: [], progress: {} })
};

// MainScene Mocks
const mockAdd = {
    sprite: jest.fn().mockReturnValue(mockSprite),
    graphics: jest.fn().mockReturnValue({
        ...mockGraphics,
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis()
    }),
    text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis()
    }),
    image: jest.fn().mockReturnValue(mockSprite),
    rectangle: jest.fn(),
    tileSprite: jest.fn().mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        x: 0,
        y: 0,
        width: 100,
        height: 100
    }),
    group: jest.fn().mockReturnValue({ get: jest.fn(), create: jest.fn(), add: jest.fn(), clear: jest.fn() }),
    particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
            start: jest.fn(),
            stop: jest.fn(),
            setPosition: jest.fn(),
            setDepth: jest.fn().mockReturnThis()
        }),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    })
};

const mockCameras = {
    main: {
        width: 800,
        height: 600,
        setSize: jest.fn(),
        setViewport: jest.fn()
    }
};

const mockTextures = {
    createCanvas: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({
            createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
            createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
            fillStyle: 'black',
            fillRect: jest.fn()
        }),
        update: jest.fn(),
        setSize: jest.fn(),
        clear: jest.fn(),
        refresh: jest.fn(),
        width: 800,
        height: 600,
        context: {
             createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
             createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
             fillStyle: 'black',
             fillRect: jest.fn()
        }
    })
};

describe('Furniture Placement Logic (Bug Repro)', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();

        scene = new MainScene();
        scene.add = mockAdd;
        scene.cameras = mockCameras;
        scene.input = mockInput;
        scene.textures = mockTextures;
        scene.game = { events: { emit: jest.fn(), on: jest.fn(), off: jest.fn() } };
        scene.events = { on: jest.fn(), off: jest.fn() };
        scene.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        scene.scale = { width: 800, height: 600, on: jest.fn(), off: jest.fn() };
        scene.sys = { settings: { data: {} } };
        scene.scene = { launch: jest.fn(), get: jest.fn() };
        scene.tweens = { add: jest.fn(), killTweensOf: jest.fn() };

        // Mock Managers to avoid instantiation errors
        scene.persistence = mockPersistence;
    });

    // Helper to bypass full create() complexity
    const initScene = () => {
        // Ensure dateText is initialized before create calls update/resize
        scene.dateText = mockAdd.text();

        // Call create - this will now use the mocks
        // NOTE: This will overwrite scene.persistence and scene.nadagotchi with real instances
        scene.create();

        // RE-INJECT Mocks after create()
        scene.persistence = mockPersistence;

        // Mock Nadagotchi behavior
        scene.nadagotchi = {
            placeItem: jest.fn().mockReturnValue(true),
            handleAction: jest.fn(),
            stats: { energy: 100 },
            mood: 'neutral',
            genome: { phenotype: {} },
            maxStats: { energy: 100, happiness: 100, hunger: 100 },
            returnItemToInventory: jest.fn()
        };
    };

    test('Should block placement if Y > gameHeight (Dashboard Area)', () => {
        initScene();
        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Fancy Bookshelf';

        // Config.UI.DASHBOARD_HEIGHT_RATIO is 0.25 (mocked).
        // Default mock height is 600.
        // Dashboard Height = 600 * 0.25 = 150.
        // Game Height = 600 - 150 = 450.

        // We need to simulate the resize behavior where cameras.main.height is updated to gameHeight.
        // Or manually set the camera height as it would be after resize.
        scene.cameras.main.height = 450;

        // Try to place at Y=500 (in dashboard)
        const dashboardY = 500;

        scene.placeFurniture(100, dashboardY);

        expect(scene.nadagotchi.placeItem).not.toHaveBeenCalled();
        expect(scene.placedFurniture['Entryway']).toHaveLength(0);
    });

    test('Should allow placement if Y < gameHeight (Game Area)', () => {
        initScene();
        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Fancy Bookshelf';

        // Set camera height correctly
        scene.cameras.main.height = 450;

        const gameY = 300;

        scene.placeFurniture(100, gameY);

        expect(scene.nadagotchi.placeItem).toHaveBeenCalled();
        expect(scene.placedFurniture['Entryway']).toHaveLength(1);
    });
});
