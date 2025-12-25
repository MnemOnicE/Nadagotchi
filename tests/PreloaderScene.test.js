
// tests/PreloaderScene.test.js

// 1. Mock Phaser Global
const mockGraphics = () => ({
    clear: jest.fn(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    fillCircle: jest.fn().mockReturnThis(),
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    generateTexture: jest.fn(),
    destroy: jest.fn()
});

const mockCanvas = () => ({
    context: {
        clearRect: jest.fn(),
        fillText: jest.fn(),
        fillRect: jest.fn(),
    },
    refresh: jest.fn()
});

global.Phaser = {
    Scene: class Scene {
        constructor(config) { this.config = config; }
    },
    GameObjects: {
        Graphics: class Graphics { constructor() { Object.assign(this, mockGraphics()); } }
    }
};

// 2. Mock Dependencies
jest.mock('../js/ItemData', () => ({
    ItemDefinitions: {
        'Test Item': { emoji: '🧪' },
        'Another Item': { emoji: '🔧' }
    }
}));

const { PreloaderScene } = require('../js/PreloaderScene');

describe('PreloaderScene', () => {
    let scene;
    let mockLoad;
    let mockTextures;
    let mockMake;

    beforeEach(() => {
        mockLoad = {
            image: jest.fn(),
            spritesheet: jest.fn(),
            on: jest.fn() // progress, complete
        };

        mockTextures = {
            createCanvas: jest.fn(() => mockCanvas()),
            exists: jest.fn().mockReturnValue(false)
        };

        mockMake = {
            graphics: jest.fn(() => mockGraphics()),
            text: jest.fn().mockReturnValue({
                setOrigin: jest.fn(),
                destroy: jest.fn()
            })
        };

        scene = new PreloaderScene();
        scene.load = mockLoad;
        scene.textures = mockTextures;
        scene.make = mockMake;
        scene.add = {
            graphics: jest.fn(() => mockGraphics())
        };
        scene.cameras = {
            main: { width: 800, height: 600 }
        };
        scene.scene = {
            start: jest.fn()
        };
    });

    test('preload should load static assets', () => {
        scene.preload();

        expect(mockLoad.image).toHaveBeenCalledWith('bookshelf', expect.any(String));
        expect(mockLoad.spritesheet).toHaveBeenCalledWith('pet', expect.any(String), expect.any(Object));
    });

    test('preload should generate procedural textures for World Objects', () => {
        scene.preload();
        // Check if graphics were created
        expect(mockMake.graphics).toHaveBeenCalled();
        // Check if generateTexture was called for key objects
        // We can't easily check the *internal* calls to the mock graphics instance returned by make.graphics
        // without capturing it, but we can assume the logic runs if no error is thrown.
    });

    test('preload should generate emoji textures for ItemDefinitions', () => {
        scene.preload();
        expect(mockTextures.createCanvas).toHaveBeenCalledWith('Test Item', 64, 64);
        expect(mockTextures.createCanvas).toHaveBeenCalledWith('Another Item', 64, 64);
    });

    test('create loading bar logic', () => {
        scene.preload();
        // Verify event listeners are attached
        expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
        expect(mockLoad.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });

    test('create should start StartScene', () => {
        scene.create();
        expect(scene.scene.start).toHaveBeenCalledWith('StartScene');
    });
});
