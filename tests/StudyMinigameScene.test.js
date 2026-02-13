
import { jest } from '@jest/globals';

// 1. Setup Global Phaser Mock
const createMockGameObject = () => {
    const handlers = {};
    return {
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn((event, fn) => {
            handlers[event] = fn;
            return this;
        }),
        emit: jest.fn((event, ...args) => {
            if (handlers[event]) handlers[event](...args);
        }),
        setData: jest.fn(),
        getData: jest.fn(),
        setFillStyle: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setTint: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis()
    };
};

const createMockText = () => ({
    ...createMockGameObject(),
    setText: jest.fn(),
    fill: '',
    fontSize: ''
});

const createMockContainer = () => ({
    ...createMockGameObject(),
    add: jest.fn(),
    removeAll: jest.fn()
});

const createMockRectangle = () => createMockGameObject();

global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.config = config;
            this.cameras = { main: { width: 800, height: 600, setBackgroundColor: jest.fn() } };
            this.add = {
                text: jest.fn(() => createMockText()),
                rectangle: jest.fn(() => createMockRectangle()),
                container: jest.fn(() => createMockContainer()),
                group: jest.fn(() => ({ get: jest.fn(), create: jest.fn(), clear: jest.fn(), add: jest.fn() })),
                image: jest.fn(() => createMockGameObject()),
                sprite: jest.fn(() => createMockGameObject()),
                zone: jest.fn(() => createMockGameObject())
            };
            this.time = {
                delayedCall: jest.fn((delay, callback) => { callback(); return { destroy: jest.fn() }; }),
                addEvent: jest.fn(() => ({ destroy: jest.fn(), remove: jest.fn() }))
            };
            this.tweens = {
                add: jest.fn((config) => {
                    if (config.onComplete) config.onComplete(); // Execute immediately for testing
                    return { stop: jest.fn() };
                })
            };
            this.sys = { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } };
            this.scene = { stop: jest.fn(), resume: jest.fn(), get: jest.fn() };
            this.game = { events: { emit: jest.fn() } };
            this.events = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
            this.input = { keyboard: { on: jest.fn() } };
        }
    },
    Utils: {
        Array: {
            GetRandom: (arr) => arr && arr.length > 0 ? arr[0] : null,
            Shuffle: (arr) => arr
        }
    },
    GameObjects: {
        Rectangle: class {}
    }
};

// 2. Mock SoundSynthesizer BEFORE imports
jest.mock('../js/utils/SoundSynthesizer.js', () => ({
    SoundSynthesizer: {
        instance: {
            playClick: jest.fn(),
            playSuccess: jest.fn(),
            playFailure: jest.fn(),
            playChime: jest.fn()
        }
    }
}));

// 3. Mock EventKeys
jest.mock('../js/EventKeys.js', () => ({
    EventKeys: {
        STUDY_COMPLETE: 'STUDY_COMPLETE'
    }
}));

// 4. Import Scene
const { StudyMinigameScene } = require('../js/StudyMinigameScene');

describe('StudyMinigameScene', () => {
    let scene;

    beforeEach(() => {
        scene = new StudyMinigameScene();
    });

    test('create() initializes grid', () => {
        scene.create();
        // Check if grid is generated (5x5 = 25 cells)
        // renderGrid adds to gridContainer. gridContainer.add is called 25 times with [bg, text]
        // Actually, renderGrid calls gridContainer.removeAll(true) then loop.
        // inside loop: this.gridContainer.add([bg, text]);

        // Wait, gridContainer is created via scene.add.container
        expect(scene.add.container).toHaveBeenCalled();
        const gridContainerMock = scene.add.container.mock.results[0].value;
        expect(gridContainerMock.add).toHaveBeenCalledTimes(25);

        expect(scene.grid.length).toBe(5);
        expect(scene.grid[0].length).toBe(5);
        expect(scene.grid[0][0]).toHaveProperty('char');
    });

    test('valid word submission updates score and replaces cells', () => {
        scene.create();

        // Manually set up a valid word "BOOK"
        // We need to find cells adjacent to each other.
        // Let's just force the chars in the grid to be B, O, O, K at (0,0), (0,1), (0,2), (0,3)
        scene.grid[0][0].char = 'B';
        scene.grid[0][1].char = 'O';
        scene.grid[0][2].char = 'O';
        scene.grid[0][3].char = 'K';

        // Simulate clicking them
        scene.handleCellClick(scene.grid[0][0]);
        scene.handleCellClick(scene.grid[0][1]);
        scene.handleCellClick(scene.grid[0][2]);
        scene.handleCellClick(scene.grid[0][3]);

        expect(scene.selectedCells.length).toBe(4);

        // Submit
        scene.submitWord();

        // Check Score
        expect(scene.score).toBe(40); // 4 * 10
        expect(scene.foundWords).toBe(1);

        // Check Replacement
        // The selected cells should have new characters (random)
        // Since we force mocked them to BOOK, if they are replaced, they likely won't be BOOK unless RNG says so.
        // But more importantly, renderGrid() should be called again.
        // renderGrid clears container and adds again.
        // gridContainer.removeAll was called once in create(), and once in renderGrid (called by create), and once in replaceSelected -> renderGrid.
        // So total calls to removeAll should be 2.

        const gridContainerMock = scene.add.container.mock.results[0].value;
        // 1 initial renderGrid call in create
        // 1 renderGrid call in replaceSelected
        expect(gridContainerMock.removeAll).toHaveBeenCalledTimes(2);
    });

    test('invalid word submission clears selection', () => {
        scene.create();

        scene.grid[0][0].char = 'X';
        scene.grid[0][1].char = 'Y';
        scene.grid[0][2].char = 'Z';

        scene.handleCellClick(scene.grid[0][0]);
        scene.handleCellClick(scene.grid[0][1]);
        scene.handleCellClick(scene.grid[0][2]);

        scene.submitWord();

        expect(scene.score).toBe(0);
        expect(scene.selectedCells.length).toBe(0);
        // Should trigger feedback (tweens)
        expect(scene.tweens.add).toHaveBeenCalled();
    });
});
