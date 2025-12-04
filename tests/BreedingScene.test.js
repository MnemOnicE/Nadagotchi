
// tests/BreedingScene.test.js

// 1. Mock Phaser Global
const mockGameObject = () => {
    const listeners = {};
    const obj = {
        on: jest.fn((event, fn) => {
            listeners[event] = fn;
            return obj;
        }),
        emit: (event, ...args) => {
            if (listeners[event]) listeners[event](...args);
        },
        setInteractive: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        add: jest.fn().mockReturnThis(),
        fillStyle: jest.fn().mockReturnThis(),
        fillEllipse: jest.fn().mockReturnThis(),
        fillCircle: jest.fn().mockReturnThis(), // Added
        fillRect: jest.fn().mockReturnThis(),
        fillRoundedRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRoundedRect: jest.fn().mockReturnThis(),
        generateTexture: jest.fn().mockReturnThis(),
        list: [] // For Container
    };
    return obj;
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) { this.config = config; }
    },
    GameObjects: {
        Container: class Container {
            constructor() { Object.assign(this, mockGameObject()); this.list = []; }
            add(child) { this.list = this.list.concat(child); return this; }
        },
        Text: class Text { constructor() { Object.assign(this, mockGameObject()); } },
        Graphics: class Graphics { constructor() { Object.assign(this, mockGameObject()); } },
        Sprite: class Sprite { constructor() { Object.assign(this, mockGameObject()); } }
    }
};

// 2. Mock Dependencies
const mockSaveToHallOfFame = jest.fn();
const mockClearActivePet = jest.fn();
jest.mock('../js/PersistenceManager', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => {
            return {
                saveToHallOfFame: mockSaveToHallOfFame,
                clearActivePet: mockClearActivePet
            };
        })
    };
});

// 3. Import System Under Test
const { BreedingScene } = require('../js/BreedingScene');

describe('BreedingScene', () => {
    let scene;
    let mockParentData;
    let mockAdd;
    let mockCameras;

    beforeEach(() => {
        mockSaveToHallOfFame.mockClear();
        mockClearActivePet.mockClear();

        // Setup Scene Mocks
        mockAdd = {
            container: jest.fn(() => new Phaser.GameObjects.Container()),
            text: jest.fn((x, y, text) => {
                const obj = new Phaser.GameObjects.Text();
                obj.text = text;
                return obj;
            }),
            graphics: jest.fn(() => new Phaser.GameObjects.Graphics()),
            image: jest.fn(() => mockGameObject()),
            particles: jest.fn(() => ({ createEmitter: jest.fn() }))
        };

        mockCameras = {
            main: {
                width: 800,
                height: 600,
                setBackgroundColor: jest.fn()
            }
        };

        scene = new BreedingScene();
        scene.add = mockAdd;
        scene.cameras = mockCameras;
        scene.make = { graphics: jest.fn(() => new Phaser.GameObjects.Graphics()) };
        // Auto-complete tweens immediately
        scene.tweens = {
            add: jest.fn((config) => {
                if (config.onComplete) config.onComplete();
            })
        };
        scene.scene = { start: jest.fn() };

        mockParentData = {
            generation: 1,
            dominantArchetype: 'Adventurer',
            inventory: { 'Metabolism-Slowing Tonic': 1 },
            calculateOffspring: jest.fn().mockReturnValue({
                dominantArchetype: 'Intellectual',
                generation: 2
            })
        };

        scene.init(mockParentData);
    });

    test('should initialize with parent data', () => {
        expect(scene.parentData).toBe(mockParentData);
        expect(scene.selectedItems).toEqual([]);
    });

    test('preload should generate pixel texture', () => {
        scene.preload();
        expect(scene.make.graphics).toHaveBeenCalled();
    });

    test('create should setup the scene elements', () => {
        scene.create();
        expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#003300');
        expect(mockAdd.text).toHaveBeenCalled();
        expect(mockAdd.container).toHaveBeenCalled();
        expect(scene.initiateButton).toBeDefined();
        // Check if tonic is in the list (since inventory had it)
        expect(scene.interactiveItems.length).toBe(7); // 6 base + 1 tonic
    });

    test('should select and deselect items', () => {
        scene.create();
        const itemSprite = scene.interactiveItems[0]; // First item (Ancient Tome)

        // First click: Select
        itemSprite.emit('pointerdown');
        expect(scene.selectedItems).toContain('Ancient Tome');

        // Second click: Deselect
        itemSprite.emit('pointerdown');
        expect(scene.selectedItems).not.toContain('Ancient Tome');
    });

    test('should initiate confirmation modal', () => {
        scene.create();
        const initiateBtn = scene.initiateButton;

        // Mock disableInteractive on items
        scene.interactiveItems.forEach(item => item.disableInteractive.mockClear());

        initiateBtn.emit('pointerdown');

        expect(initiateBtn.disableInteractive).toHaveBeenCalled();
        expect(scene.tweens.add).toHaveBeenCalled();
    });

    test('should calculate offspring and display egg on confirmation', () => {
        scene.create();
        scene.selectedItems = ['Ancient Tome'];

        // Open modal
        scene.initiateButton.emit('pointerdown');

        // Find confirm button by text 'Confirm' among all text objects created
        // Note: We need to check objects created *after* the modal open event.
        // But since we mock add.text, we can just search all results.
        const allTextObjects = mockAdd.text.mock.results.map(r => r.value);
        const confirmButton = allTextObjects.find(obj => obj.text === 'Confirm');

        expect(confirmButton).toBeDefined();
        confirmButton.emit('pointerdown');

        expect(scene.parentData.calculateOffspring).toHaveBeenCalledWith(['Ancient Tome']);
        expect(scene.tweens.add).toHaveBeenCalled(); // For fading out
    });

    test('should finalize legacy', () => {
        scene.create();
        const newPetData = { dominantArchetype: 'Intellectual' };

        // Call finalizeLegacy directly
        scene.finalizeLegacy(newPetData);

        expect(mockSaveToHallOfFame).toHaveBeenCalledWith(mockParentData);
        expect(mockClearActivePet).toHaveBeenCalled();
        expect(scene.scene.start).toHaveBeenCalledWith('MainScene', { newPetData });
    });
});
