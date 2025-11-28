// Mock Phaser *before* requiring the scene
global.Phaser = {
    Scene: class Scene {}, // A simple class mock for `extends` to work
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0] // Always return the first element for predictability
        }
    }
};

const { LogicPuzzleScene } = require('../js/LogicPuzzleScene');

// Mock Phaser Scene and related functionality
const mockScene = {
    sys: { events: { once: jest.fn(), on: jest.fn() } },
    time: { delayedCall: jest.fn((delay, callback) => callback()) },
    add: { text: jest.fn(() => ({ setOrigin: jest.fn() })), rectangle: jest.fn(() => ({ setInteractive: jest.fn(() => ({ on: jest.fn(), name: 'red' })) })) },
    tweens: { add: jest.fn() },
    cameras: { main: { width: 800, height: 600, setBackgroundColor: jest.fn() } },
    scene: { start: jest.fn(), stop: jest.fn(), launch: jest.fn(), resume: jest.fn() },
    game: { events: { emit: jest.fn() } }
};


describe('LogicPuzzleScene', () => {
    let scene;

    beforeEach(() => {
        scene = new LogicPuzzleScene();
        // Manually call create, as we are not in a real Phaser environment
        Object.assign(scene, mockScene); // Mixin the mocked scene properties
        scene.create();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should generate a sequence of the correct length', () => {
        scene.level = 4;
        scene.generateSequence();
        expect(scene.sequence).toHaveLength(4);
        expect(scene.sequence).toEqual(['red', 'red', 'red', 'red']);
    });

    test('should handle correct player input', () => {
        scene.sequence = ['red', 'green', 'blue'];
        scene.canPlayerClick = true;
        scene.handlePlayerClick('red');
        scene.handlePlayerClick('green');
        scene.handlePlayerClick('blue');

        expect(scene.level).toBe(4);
        expect(mockScene.time.delayedCall).toHaveBeenCalled();
    });

    test('should handle incorrect player input', () => {
        scene.sequence = ['red', 'green', 'blue'];
        scene.canPlayerClick = true;
        scene.handlePlayerClick('red');
        scene.handlePlayerClick('blue');

        expect(mockScene.game.events.emit).toHaveBeenCalledWith('workResult', { success: false, career: 'Innovator' });
        expect(mockScene.scene.resume).toHaveBeenCalledWith('MainScene');
    });

    test('should not allow player input when canPlayerClick is false', () => {
        scene.canPlayerClick = false;
        scene.handlePlayerClick('red');
        expect(scene.playerSequence).toHaveLength(0);
    });

    test('should end the game with success when the player reaches level 6', () => {
        scene.level = 5;
        scene.sequence = ['red', 'green', 'blue', 'yellow', 'red'];
        scene.canPlayerClick = true;
        scene.handlePlayerClick('red');
        scene.handlePlayerClick('green');
        scene.handlePlayerClick('blue');
        scene.handlePlayerClick('yellow');
        scene.handlePlayerClick('red');

        expect(mockScene.game.events.emit).toHaveBeenCalledWith('workResult', { success: true, career: 'Innovator' });
        expect(mockScene.scene.resume).toHaveBeenCalledWith('MainScene');
    });
});
