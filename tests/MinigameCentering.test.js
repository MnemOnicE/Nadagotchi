
const { SceneUIUtils } = require('../js/utils/SceneUIUtils.js');

// Setup Global Phaser Mock
global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.config = config;
            this.events = { on: jest.fn(), off: jest.fn() };
            this.scale = { on: jest.fn(), off: jest.fn() };
            this.add = {
                graphics: jest.fn(() => ({ setDepth: jest.fn() })),
                text: jest.fn(() => ({ setOrigin: jest.fn() }))
            };
            this.cameras = { main: { setBackgroundColor: jest.fn(), width: 800, height: 600 } };
        }
    },
    Utils: {
        Array: {
            Shuffle: jest.fn(arr => arr)
        }
    }
};

const { ArtisanMinigameScene } = require('../js/ArtisanMinigameScene.js');

describe('SceneUIUtils Centering Logic', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            game: {
                registry: {
                    get: jest.fn()
                }
            },
            cameras: {
                main: {
                    width: 800,
                    height: 600
                }
            }
        };
    });

    test('getPadding should return registry value or 0', () => {
        mockScene.game.registry.get.mockReturnValueOnce(50);
        expect(SceneUIUtils.getPadding(mockScene)).toBe(50);

        mockScene.game.registry.get.mockReturnValueOnce(undefined);
        expect(SceneUIUtils.getPadding(mockScene)).toBe(0);
    });

    test('getSafeWidth should calculate width minus padding', () => {
        mockScene.game.registry.get.mockReturnValue(50);
        expect(SceneUIUtils.getSafeWidth(mockScene)).toBe(700);
    });

    test('getSafeHeight should calculate height minus padding', () => {
        mockScene.game.registry.get.mockReturnValue(50);
        expect(SceneUIUtils.getSafeHeight(mockScene)).toBe(500);
    });

    test('getCenterX should return geometric center', () => {
        expect(SceneUIUtils.getCenterX(mockScene)).toBe(400);
    });

    test('getCenterY should return geometric center', () => {
        expect(SceneUIUtils.getCenterY(mockScene)).toBe(300);
    });

    test('drawBezel should not draw if padding is 0', () => {
        mockScene.game.registry.get.mockReturnValue(0);
        const graphics = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn() };
        SceneUIUtils.drawBezel(mockScene, graphics);

        expect(graphics.clear).toHaveBeenCalled();
        expect(graphics.fillStyle).not.toHaveBeenCalled();
    });

    test('drawBezel should draw four rects if padding > 0', () => {
        mockScene.game.registry.get.mockReturnValue(50);
        const graphics = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn() };
        SceneUIUtils.drawBezel(mockScene, graphics);

        expect(graphics.clear).toHaveBeenCalled();
        expect(graphics.fillStyle).toHaveBeenCalledWith(0x000000, 0.5);
        expect(graphics.fillRect).toHaveBeenCalledTimes(4); // Top, Bottom, Left, Right
    });
});

describe('Minigame Resize Logic', () => {
    test('resize should update elements correctly', () => {
        const scene = new ArtisanMinigameScene();
        // Setup mock structure
        scene.cameras = { main: { setViewport: jest.fn(), width: 1000, height: 800 } };
        scene.game = { registry: { get: jest.fn().mockReturnValue(20) } };
        scene.bezelGraphics = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn() };

        const mockTitle = { type: 'Text', y: 50, setX: jest.fn(), setY: jest.fn() };
        const mockFooter = { type: 'Text', y: 750, setX: jest.fn(), setY: jest.fn() };

        scene.children = {
            list: [ mockTitle, mockFooter ]
        };

        scene.resize({ width: 1000, height: 800 });

        expect(scene.cameras.main.setViewport).toHaveBeenCalledWith(0, 0, 1000, 800);
        expect(mockTitle.setX).toHaveBeenCalledWith(500); // Because centerX of 1000 is 500
        expect(mockFooter.setX).toHaveBeenCalledWith(500);
    });
});
