
// Mock Phaser Global BEFORE imports
global.Phaser = {
    Scene: class {
        constructor(config) { this.events = { emit: jest.fn(), on: jest.fn(), off: jest.fn() }; }
    },
    Math: { Between: () => 1 },
    GameObjects: {
        Sprite: class {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.visible = true;
                this.events = {};
                this.active = true;
            }
            setInteractive() { return this; }
            on(event, fn) { this.events[event] = fn; return this; }
            emit(event, ...args) { if (this.events[event]) this.events[event](...args); }
            destroy() { this.active = false; }
            setVisible() { return this; }
            setDepth() { return this; }
            setPosition(x, y) { this.x = x; this.y = y; return this; }
            setTint() { return this; }
            clearTint() { return this; }
        },
        Graphics: class {
            clear() {}
            fillStyle() {}
            fillRect() {}
            generateTexture() {}
            lineStyle() {}
            strokeRect() {}
            destroy() {}
            setPosition() {}
            setDepth() { return this; }
        },
        Text: class {
            constructor() { this.text = ''; }
            setOrigin() { return this; }
            setDepth() { return this; }
            setText(t) { this.text = t; return this; }
            setPosition() { return this; }
            setInteractive() { return this; }
            destroy() {}
        },
        TileSprite: class {
            setVisible() { return this; }
            setDepth() { return this; }
            setSize() { return this; }
            setPosition() { return this; }
            setTexture() { return this; }
        },
        Container: class {
            destroy() {}
        }
    },
    Display: {
        Color: class { constructor(r,g,b) { this.r=r; this.g=g; this.b=b; } },
    }
};

// Mock other dependencies
jest.mock('../js/Config.js', () => ({
    Config: {
        UI: { DASHBOARD_HEIGHT_RATIO: 0.35 },
        ACTIONS: {
            CRAFT: { ENERGY_COST: 10 },
            FORAGE: { ENERGY_COST: 10 },
            EXPEDITION: { ENERGY_COST: 20 },
            INTERACT_NPC: { ENERGY_COST: 5 }
        },
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
        scene.add = {
            sprite: jest.fn(() => new Phaser.GameObjects.Sprite()),
            graphics: jest.fn(() => new Phaser.GameObjects.Graphics()),
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            tileSprite: jest.fn(() => new Phaser.GameObjects.TileSprite()),
            image: jest.fn(() => ({ setOrigin: () => ({ setDepth: () => {} }) }))
        };
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
        realSprite.events['pointerdown']({ x: 100, y: 100 });

        // Correct Behavior:
        // Total Inventory: 1 (start) + 1 (picked up) = 2.

        console.log("Inventory after fix verification:", scene.nadagotchi.inventory);

        expect(scene.nadagotchi.inventory['Chair']).toBe(2);
    });
});
