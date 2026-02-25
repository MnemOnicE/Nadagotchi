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
        scene.nadagotchi.inventory = {};
    });

    test('Picking up furniture while holding selectedFurniture does NOT duplicate item', () => {
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
    });
});
