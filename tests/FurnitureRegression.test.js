
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
        SECURITY: { DNA_SALT: 'test_salt' },
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
        scene.nadagotchi.inventory = {};
    });

    test('Picking up furniture while holding selectedFurniture does NOT duplicate item', () => {
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
    });
});
