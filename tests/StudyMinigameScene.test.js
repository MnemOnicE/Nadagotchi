
import { jest } from '@jest/globals';

// 1. Setup Global Phaser Mock (Must be done before imports that use Phaser)
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
        setTint: jest.fn().mockReturnThis(),
        clearTint: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        width: 100,
        height: 100
    };
};

const createMockText = () => ({
    setOrigin: jest.fn().mockReturnThis(),
    setText: jest.fn(),
    setTint: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    fill: '',
    fontSize: ''
});

const createMockContainer = () => ({
    add: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    setPosition: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    width: 100,
    height: 100,
    setAlpha: jest.fn().mockReturnThis()
});

const createMockRectangle = () => {
    const data = {};
    const handlers = {};
    return {
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn((event, fn) => {
            handlers[event] = fn;
        }),
        off: jest.fn(),
        setData: jest.fn((key, value) => {
            if (typeof key === 'object') {
                Object.assign(data, key);
            } else {
                data[key] = value;
            }
        }),
        getData: jest.fn((key) => data[key]),
        setFillStyle: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        // Helper to trigger event manually in tests
        emit: (event, ...args) => {
            if (handlers[event]) handlers[event](...args);
        }
    };
};

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
                    if (config.onComplete) config.onComplete();
                    return { stop: jest.fn() };
                }),
                killTweensOf: jest.fn()
            };
            this.sys = { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } };
            this.scene = { stop: jest.fn(), resume: jest.fn(), get: jest.fn(), launch: jest.fn() };
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
    },
    Math: {
        Between: (min, max) => min
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
        STUDY_COMPLETE: 'studyComplete'
    }
}));

// 4. Import Scene
const { StudyMinigameScene } = require('../js/StudyMinigameScene');
const { SoundSynthesizer } = require('../js/utils/SoundSynthesizer.js');

describe('StudyMinigameScene Test Suite', () => {
    let scene;

    beforeEach(() => {
        scene = new StudyMinigameScene();
        jest.clearAllMocks();
    });

    test('create() initializes grid and buttons', () => {
        scene.create();
        // Check grid initialization
        expect(scene.grid.length).toBe(5); // 5x5 grid
        expect(scene.grid[0].length).toBe(5);
        // Check container creation
        expect(scene.add.container).toHaveBeenCalled();
        // Check buttons created (Submit, Clear, Exit)
        // ButtonFactory creates container, rectangle (shadow, bg, hover, highlights...), text, zone.
        // We expect at least 3 containers for buttons + 1 for grid
        expect(scene.add.container).toHaveBeenCalledTimes(4);
    });

    test('selecting adjacent cells builds a word', () => {
        scene.create();

        // Mock grid cells to have specific characters for predictable word forming
        // grid[0][0] = 'B', grid[0][1] = 'O', grid[0][2] = 'O', grid[0][3] = 'K'
        scene.grid[0][0].char = 'B';
        scene.grid[0][1].char = 'O';
        scene.grid[0][2].char = 'O';
        scene.grid[0][3].char = 'K';

        // Select cells
        scene.handleCellClick(scene.grid[0][0]); // B
        scene.handleCellClick(scene.grid[0][1]); // O
        scene.handleCellClick(scene.grid[0][2]); // O
        scene.handleCellClick(scene.grid[0][3]); // K

        expect(scene.selectedCells.length).toBe(4);
        expect(scene.selectedCells.map(c => c.char).join('')).toBe('BOOK');
    });

    test('submitting a valid word updates score and increments foundWords', () => {
        scene.create();

        // Manually set up a valid word selection
        scene.grid[0][0].char = 'B';
        scene.grid[0][1].char = 'O';
        scene.grid[0][2].char = 'O';
        scene.grid[0][3].char = 'K';

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1],
            scene.grid[0][2],
            scene.grid[0][3]
        ];

        // Ensure BOOK is in validWords (it is by default)
        expect(scene.validWords.has('BOOK')).toBe(true);

        scene.submitWord();

        // Expect score update: 4 letters * 10 = 40
        expect(scene.score).toBe(40);
        expect(scene.foundWords).toBe(1);
        expect(SoundSynthesizer.instance.playSuccess).toHaveBeenCalled();
        // Should clear selection (replaceSelected sets selectedCells to empty)
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a 4+ letter invalid word triggers Research Note', () => {
        scene.create();

        // ABCD (Invalid, Length 4)
        scene.grid[0][0].char = 'A';
        scene.grid[0][1].char = 'B';
        scene.grid[0][2].char = 'C';
        scene.grid[0][3].char = 'D';

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1],
            scene.grid[0][2],
            scene.grid[0][3]
        ];

        // Ensure ABCD is NOT in validWords
        expect(scene.validWords.has('ABCD')).toBe(false);

        scene.submitWord();

        // Expect Research Note behavior
        expect(scene.score).toBe(4); // 4 * 1
        expect(scene.foundWords).toBe(0); // Not incremented
        expect(SoundSynthesizer.instance.playChime).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0); // Cleared/Replaced
    });

    test('submitting a 3 letter invalid word fails', () => {
        scene.create();

        // ABC (Invalid, Length 3)
        scene.grid[0][0].char = 'A';
        scene.grid[0][1].char = 'B';
        scene.grid[0][2].char = 'C';

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1],
            scene.grid[0][2]
        ];

        scene.submitWord();

        // Expect Failure
        expect(scene.score).toBe(0);
        expect(scene.foundWords).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a short word fails', () => {
        scene.create();

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1]
        ];
        scene.grid[0][0].char = 'H';
        scene.grid[0][1].char = 'I';

        scene.submitWord();

        // Should be rejected for length < 3
        expect(scene.score).toBe(0);
        expect(scene.foundWords).toBe(0);
        // Does not call playFailure/Success, just shows feedback and clears
        expect(scene.selectedCells.length).toBe(0);
    });
});
