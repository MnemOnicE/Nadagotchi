
const mockAddSprite = jest.fn(() => ({
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setBlendMode: jest.fn().mockReturnThis()
}));

const mockAddGraphics = jest.fn(() => ({
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    clear: jest.fn(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis()
}));

const mockAddText = jest.fn(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis()
}));

const mockAddImage = jest.fn(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setBlendMode: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis()
}));

// Define Color class first to attach static property
class MockColor {
    constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
}
MockColor.Interpolate = {
    ColorWithColor: jest.fn(() => ({ r: 0, g: 0, b: 0 }))
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.key = config ? config.key : 'default';
        }

    },
    Display: {
        Color: MockColor
    },
    Math: {
        Between: jest.fn(() => 1)
    },
    Scale: {
        FIT: 1,
        CENTER_BOTH: 1
    }
};

// Use require to ensure Phaser is defined before loading the class
const { MainScene } = require('../js/MainScene.js');
// Nadagotchi is used inside MainScene, but we might want to inspect it
const { Nadagotchi } = require('../js/Nadagotchi.js');

// Mock PersistenceManager
jest.mock('../js/PersistenceManager.js', () => ({
    PersistenceManager: class {
        loadPet() { return null; }
        savePet() {}
        loadCalendar() { return { day: 1, season: 'Spring' }; }
        saveFurniture() {}
        loadFurniture() { return []; }
        loadJournal() { return []; }
        saveJournal() {}
        loadRecipes() { return []; }
        saveRecipes() {}
        loadSettings() { return { volume: 0.5, gameSpeed: 1.0 }; }
        saveSettings() {}
    }
}));

describe('MainScene Furniture Placement Bug', () => {
    let scene;
    let pet;

    beforeEach(() => {
        scene = new MainScene();

        // Manual injection of mocks that usually happen in Phaser lifecycle
        scene.add = {
            sprite: mockAddSprite,
            graphics: mockAddGraphics,
            text: mockAddText,
            image: mockAddImage
        };
        scene.input = {
            on: jest.fn(),
            off: jest.fn()
        };
        scene.game = {
            events: {
                emit: jest.fn(),
                on: jest.fn()
            }
        };
        scene.cameras = {
            main: {
                width: 800,
                height: 600,
                setSize: jest.fn(function(w, h) {
                    this.width = w;
                    this.height = h;
                }),
                setViewport: jest.fn(),
                // Initial values
            }
        };
        scene.scale = {
            width: 800,
            height: 600,
            on: jest.fn()
        };
        scene.textures = {
            get: jest.fn(() => ({
                getFrameNames: jest.fn(() => []),
                add: jest.fn()
            })),
            createCanvas: jest.fn(() => ({
                context: {
                    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    fillStyle: '',
                    fillRect: jest.fn()
                },
                setSize: jest.fn(),
                clear: jest.fn(),
                refresh: jest.fn(),
                width: 800,
                height: 600
            }))
        };
        scene.time = {
            addEvent: jest.fn(),
            delayedCall: jest.fn()
        };
        scene.scene = {
            launch: jest.fn(),
            stop: jest.fn(),
            start: jest.fn(),
            get: jest.fn().mockReturnValue({ showDialogue: jest.fn() })
        };
        scene.tweens = {
            add: jest.fn()
        };

        // Initialize MainScene (calls create)
        scene.create();

        // Get the pet instance
        pet = scene.nadagotchi;

        // Give the pet a Fancy Bookshelf
        pet.inventory['Fancy Bookshelf'] = 1;
    });

    test('placeFurniture should remove item from inventory when placed in valid area', () => {
        // Arrange
        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Fancy Bookshelf';

        // Game height should be 600 * 0.75 = 450.
        // Place at 100 (< 450).
        scene.placeFurniture(100, 100);

        // Assert
        // Check that furniture was placed
        expect(scene.placedFurniture.length).toBe(1);
        expect(scene.placedFurniture[0].key).toBe('Fancy Bookshelf');

        // Check that item was removed from inventory
        expect(pet.inventory['Fancy Bookshelf']).toBeUndefined();
    });

    test('placeFurniture should ignore placement in dashboard area (bottom 25%)', () => {
        // Arrange
        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Fancy Bookshelf';
        const initialInventoryCount = pet.inventory['Fancy Bookshelf'];

        // Game height is 450. Dashboard starts at 450. Height is 600.
        // Place at 500 (> 450).
        scene.placeFurniture(100, 500);

        // Assert no placement occurred
        expect(scene.placedFurniture.length).toBe(0);
        // Assert inventory is unchanged
        expect(pet.inventory['Fancy Bookshelf']).toBe(initialInventoryCount);
        // Assert placement mode is still active
        expect(scene.isPlacementMode).toBe(true);
    });
});
