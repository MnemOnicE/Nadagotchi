<<<<<<< HEAD
// tests/FurnitureRegression.test.js
import { setupPhaserMock, createMockAdd } from './helpers/mockPhaser';

setupPhaserMock();

// Mock dependencies
jest.mock('../js/Nadagotchi');
jest.mock('../js/PersistenceManager');
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
const { EventKeys } = require('../js/EventKeys');

describe('MainScene Duplication Bug', () => {
    let scene;
    let mockNadagotchi;

    beforeEach(async () => {
        // Setup Mocks
        mockNadagotchi = {
            placeItem: jest.fn().mockReturnValue(true),
            returnItemToInventory: jest.fn(),
            inventory: {},
            homeConfig: { rooms: { "Entryway": { wallpaper: 'w', flooring: 'f' } } },
            isRoomUnlocked: jest.fn().mockReturnValue(true),
            init: jest.fn().mockResolvedValue(),
            live: jest.fn(),
            stats: { hunger: 50, energy: 50, happiness: 50 },
            skills: { logic: 0 },
            debris: []
        };
        Nadagotchi.mockImplementation(() => mockNadagotchi);

        PersistenceManager.mockImplementation(() => ({
            loadPet: jest.fn().mockResolvedValue(null),
            savePet: jest.fn().mockResolvedValue(),
            loadFurniture: jest.fn().mockResolvedValue({ "Entryway": [] }),
            saveFurniture: jest.fn().mockResolvedValue(),
            loadCalendar: jest.fn().mockResolvedValue({}),
            loadSettings: jest.fn().mockResolvedValue({}),
            loadAchievements: jest.fn().mockResolvedValue({ unlocked: [], progress: {} })
        }));

        scene = new MainScene();
        scene.add = createMockAdd();
        scene.cameras = { main: { width: 800, height: 600, setSize: jest.fn(), setViewport: jest.fn() } };
        scene.scale = { width: 800, height: 600, on: jest.fn() };
        scene.game = { events: { on: jest.fn(), emit: jest.fn(), off: jest.fn() } };
        scene.scene = { launch: jest.fn(), get: jest.fn(), start: jest.fn() }; // Mock scene manager

        // Fix for SkyManager.resize calling setSize/clear on texture and LightingManager using createRadialGradient
        scene.textures = {
            get: jest.fn().mockReturnValue({ getFrameNames: jest.fn().mockReturnValue([]) }),
            createCanvas: jest.fn(() => ({
                context: {
                    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })), // ADDED
                    fillRect: jest.fn()
                },
                refresh: jest.fn(),
                setSize: jest.fn(),
                clear: jest.fn(),
                height: 600,
                width: 800
            }))
        };

        scene.input = { on: jest.fn(), off: jest.fn(), setDraggable: jest.fn(), setDefaultCursor: jest.fn() };
        scene.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        scene.tweens = { add: jest.fn(), killTweensOf: jest.fn() };
        scene.events = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };

        scene.create();

        // Wait for async initialization
        await scene._initPromise;

        // Ensure InventorySystem is linked (mocked by simple object in tests usually, but here we check property access)
=======

import { setupPhaserMock, createMockAdd } from './helpers/mockPhaser';

// 1. Setup Phaser Mock
setupPhaserMock();

// Mock other dependencies
jest.mock('../js/Config.js', () => ({
    Config: {
        UI: { DASHBOARD_HEIGHT_RATIO: 0.35 },
        INITIAL_STATE: {
            STATS: { hunger: 100, energy: 100, happiness: 100 },
            SKILLS: { logic: 0, research: 0, empathy: 0, navigation: 0, crafting: 0, focus: 0, communication: 0 },
            PERSONALITY_POINTS_STARTER: 10,
            MOOD_SENSITIVITY_DEFAULT: 5,
            GENOME_STARTER_VAL: 10
        },
        ACTIONS: {
            CRAFT: { ENERGY_COST: 10 },
            FORAGE: { ENERGY_COST: 10 },
            EXPEDITION: { ENERGY_COST: 20 },
            INTERACT_NPC: { ENERGY_COST: 5 }
        },
        LIMITS: { MAX_STATS: 100 },
        SECURITY: { DNA_SALT: '' },
        GENETICS: { HOMOZYGOUS_ENERGY_BONUS: 5, METABOLISM_NORMALIZER: 5 },
        DECAY: { AGE_INCREMENT: 0.001 },
        THRESHOLDS: { AGE_LEGACY: 50 },
        SETTINGS: { DEFAULT_VOLUME: 0.5, DEFAULT_SPEED: 1.0 },
        CAREER: { XP_PER_WORK: 10 }
    }
}));
jest.mock('../js/PersistenceManager.js');
jest.mock('../js/utils/SoundSynthesizer.js');
jest.mock('../js/SkyManager.js', () => ({
    SkyManager: class {
        constructor() {}
        update() {}
        resize() {}
        setVisible() {}
    }
}));
jest.mock('../js/LightingManager.js', () => ({
    LightingManager: class {
        constructor() {}
        update() {}
        resize() {}
    }
}));
jest.mock('../js/Calendar.js');
jest.mock('../js/EventManager.js');
jest.mock('../js/WorldClock.js');
jest.mock('../js/WeatherSystem.js');
jest.mock('../js/AchievementManager.js');

// Now import MainScene (after Phaser is globally defined)
const { MainScene } = require('../js/MainScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');
const { SoundSynthesizer } = require('../js/utils/SoundSynthesizer.js');

describe('MainScene Duplication Bug', () => {
    let scene;

    beforeEach(() => {
        // Setup SoundSynthesizer mock
        SoundSynthesizer.instance = {
            playChime: jest.fn(),
            playFailure: jest.fn(),
            playSuccess: jest.fn()
        };

        scene = new MainScene();

        // Mock Scene properties
        scene.add = createMockAdd();
        // Customize text mock specific to this test if needed, or rely on helper
        scene.cameras = { main: { width: 800, height: 600, setSize: jest.fn(), setViewport: jest.fn() } };
        scene.scale = { width: 800, height: 600, on: jest.fn(), off: jest.fn() };
        scene.time = { addEvent: jest.fn(() => ({ remove: jest.fn() })), delayedCall: jest.fn() };
        scene.game = { events: { emit: jest.fn(), on: jest.fn(), off: jest.fn() } };
        scene.input = { on: jest.fn(), off: jest.fn(), setDraggable: jest.fn(), setDefaultCursor: jest.fn() };
        scene.tweens = { add: jest.fn(), killTweensOf: jest.fn() };
        scene.scene = { launch: jest.fn(), get: jest.fn() };
        scene.textures = { createCanvas: jest.fn(() => ({ context: {} })) };

        // Mock Persistence returns
        PersistenceManager.prototype.loadCalendar.mockReturnValue({ season: 'Spring', day: 1 });
        PersistenceManager.prototype.loadPet.mockReturnValue(null);
        PersistenceManager.prototype.loadHomeConfig.mockReturnValue({ rooms: { 'Entryway': {} } });
        PersistenceManager.prototype.loadSettings.mockReturnValue({});
        PersistenceManager.prototype.loadFurniture.mockReturnValue({});
        PersistenceManager.prototype.loadRecipes.mockReturnValue([]); // Fix: Return empty array for recipes
        PersistenceManager.prototype.loadJournal.mockReturnValue([]);

        // Manually trigger create to setup nadagotchi
        scene.create();

        // Ensure InventorySystem is linked
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        scene.nadagotchi.inventory = {};
    });

    test('Picking up furniture while holding selectedFurniture does NOT duplicate item', () => {
<<<<<<< HEAD
        // 1. Setup: User has 'Chair' selected for placement
        scene.selectedFurniture = 'Chair';
        scene.isPlacementMode = true;

        // 2. Setup: A 'Table' is already placed at 100, 100
        const tableSprite = {
            x: 100, y: 100,
            destroy: jest.fn(),
            on: jest.fn((event, cb) => {
                if (event === 'pointerdown') tableSprite.clickCallback = cb;
            }),
            setInteractive: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis()
        };
        // Mock add.sprite to return our interactive object
        scene.add.sprite = jest.fn().mockReturnValue(tableSprite);

        // Manually add to placedFurniture
        scene.placedFurniture['Entryway'] = [{ key: 'Table', x: 100, y: 100, sprite: tableSprite }];

        // Re-create sprite via createPlacedFurnitureSprite to attach listeners
        const realSprite = scene.createPlacedFurnitureSprite(100, 100, 'table', 'Table');
        // Replace the manually added one with the one that has listeners
        scene.placedFurniture['Entryway'][0].sprite = realSprite;

        // 3. Action: User clicks the 'Table' to pick it up
        // Simulate click
        realSprite.clickCallback();

        // 4. Assertions
        // The item picked up ('Table') should be returned
        expect(mockNadagotchi.returnItemToInventory).toHaveBeenCalledWith('Table');

        // The item selected ('Chair') should NOT be returned just because we clicked something else
        expect(mockNadagotchi.returnItemToInventory).not.toHaveBeenCalledWith('Chair');

        // Selected furniture should switch to the picked up item
        expect(scene.selectedFurniture).toBe('Table');
=======
        // Setup:
        // 1. Have 1 Chair in inventory (for selection).
        // 2. Have 1 Chair already placed in the world.

        scene.nadagotchi.inventory['Chair'] = 1;

        // Manually place a chair in the world
        const realSprite = scene.createPlacedFurnitureSprite(100, 100, 'chair', 'Chair');
        scene.placedFurniture['Entryway'] = [{ key: 'Chair', x: 100, y: 100, sprite: realSprite }];

        // Verify Initial State
        expect(scene.nadagotchi.inventory['Chair']).toBe(1);

        // Step 1: Enter Placement Mode selecting "Chair"
        scene.togglePlacementMode('Chair');
        expect(scene.isPlacementMode).toBe(true);
        expect(scene.selectedFurniture).toBe('Chair');
        // Inventory should still be 1 (placement doesn't consume until placed)
        expect(scene.nadagotchi.inventory['Chair']).toBe(1);

        // Step 2: Click the PLACED chair to pick it up
        // This triggers the pointerdown event on the sprite
        realSprite.emit('pointerdown', { x: 100, y: 100 });

        // Correct Behavior:
        // Total Inventory: 1 (start) + 1 (picked up) = 2.

        console.log("Inventory after fix verification:", scene.nadagotchi.inventory);

        expect(scene.nadagotchi.inventory['Chair']).toBe(2);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    });
});
