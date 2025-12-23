
// Mock Phaser Global - Must be defined before requiring the scene
const mockGameObject = {
    setOrigin: jest.fn().mockReturnThis()
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.config = config;
            this.cameras = { main: { width: 800, height: 600 } };
            this.add = {
                rectangle: jest.fn().mockReturnValue(mockGameObject),
                text: jest.fn().mockReturnValue(mockGameObject),
            };
            this.scene = { start: jest.fn() };
        }
    }
};

// Mock ButtonFactory before requiring it
jest.mock('../js/ButtonFactory.js', () => ({
    ButtonFactory: {
        createButton: jest.fn()
    }
}));

// Require the modules after global setup
const { GhostScene } = require('../js/GhostScene.js');
const { ButtonFactory } = require('../js/ButtonFactory.js');

describe('GhostScene', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
        scene = new GhostScene();
    });

    test('create() adds background, text, and return button', () => {
        scene.create();

        // Background
        expect(scene.add.rectangle).toHaveBeenCalledWith(0, 0, 800, 600, 0x111122);

        // Title text
        expect(scene.add.text).toHaveBeenCalledWith(400, 50, "THE ETHER", expect.objectContaining({
            fontFamily: 'VT323', fontSize: '48px', color: '#AA88DD'
        }));

        // Placeholder text
        expect(scene.add.text).toHaveBeenCalledWith(400, 300, "No spirits found... yet.", expect.objectContaining({
            fontFamily: 'VT323', fontSize: '24px', color: '#666688'
        }));

        // Return button
        expect(ButtonFactory.createButton).toHaveBeenCalledWith(
            scene,
            400,
            500, // 600 - 100
            "Return to Life",
            expect.any(Function)
        );
    });

    test('Return button callback starts MainScene', () => {
        scene.create();

        // Get the callback passed to createButton
        // createButton(scene, x, y, text, callback) -> index 4
        const callback = ButtonFactory.createButton.mock.calls[0][4];

        // Execute it
        callback();

        expect(scene.scene.start).toHaveBeenCalledWith('MainScene');
    });
});
