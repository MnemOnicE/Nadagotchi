
const { EventKeys } = require('../js/EventKeys.js');
const { ButtonFactory } = require('../js/ButtonFactory.js');

// Mock Dependencies
jest.mock('../js/ButtonFactory.js');
jest.mock('../js/systems/ExpeditionSystem.js');
jest.mock('../js/EventKeys.js', () => ({
    EventKeys: {
        SCENE_COMPLETE: 'SCENE_COMPLETE',
    }
}));

// Setup Global Phaser Mock BEFORE importing the scene
global.Phaser = {
    Scene: class {
        constructor(config) {
            this.config = config;
        }
    },
    Math: {
        Between: jest.fn(() => 1),
        FloatBetween: jest.fn(() => 0.5)
    }
};

// Now import the scene
const { ExpeditionScene } = require('../js/ExpeditionScene.js');

describe('ExpeditionScene', () => {
    let scene;
    let mockPet;
    let mockGameEvents;

    beforeEach(() => {
        // Instantiate Scene
        scene = new ExpeditionScene();

        // Mock Scene Context
        scene.cameras = { main: { width: 800, height: 600 } };
        scene.add = {
            rectangle: jest.fn().mockReturnThis(),
            text: jest.fn().mockReturnThis(),
            container: jest.fn().mockReturnValue({
                add: jest.fn(),
                removeAll: jest.fn()
            }),
            sprite: jest.fn().mockReturnThis()
        };
        // Mock chainer methods
        scene.add.rectangle.mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setStrokeStyle: jest.fn().mockReturnThis()
        });
        scene.add.text.mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            addToDisplayList: jest.fn().mockReturnThis()
        });

        // Mock Scene Management
        scene.scene = {
            stop: jest.fn(),
            resume: jest.fn(),
            get: jest.fn()
        };

        // Mock Game Events
        mockGameEvents = {
            emit: jest.fn()
        };
        scene.game = { events: mockGameEvents };

        // Mock Pet Data
        mockPet = {
            currentSeason: 'Spring',
            rng: {},
            stats: { happiness: 50, energy: 50 },
            maxStats: { happiness: 100, energy: 100 },
            skills: {},
            inventorySystem: { addItem: jest.fn() }
        };

        // Mock ButtonFactory
        ButtonFactory.createButton = jest.fn((scene, x, y, text, callback) => {
             return {
                 trigger: callback
             };
        });
    });

    test('should resume MainScene BEFORE stopping ExpeditionScene on return home', () => {
        // Setup data
        scene.init({ nadagotchi: mockPet, weather: 'Sunny' });

        // Ensure container and loot exist (normally done in create/init)
        scene.contentContainer = scene.add.container();
        scene.loot = {};

        // Manually call showSummary to expose the "Return Home" button logic
        scene.showSummary();

        // Find the "Return Home" button creation call
        const calls = ButtonFactory.createButton.mock.calls;
        const returnHomeCall = calls.find(call => call[3] === "Return Home");

        expect(returnHomeCall).toBeDefined();

        // Trigger the callback
        const callback = returnHomeCall[4];
        callback();

        // Verify Order
        // Current Code: stop() -> resume()
        // Expected Fix: resume() -> stop()

        const stopOrder = scene.scene.stop.mock.invocationCallOrder[0];
        const resumeOrder = scene.scene.resume.mock.invocationCallOrder[0];

        // This expectation asserts the CORRECT behavior (fix verified)
        // So this test SHOULD FAIL if the code is buggy.
        expect(resumeOrder).toBeLessThan(stopOrder);
    });
});
