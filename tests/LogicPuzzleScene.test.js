
// 1. Setup Global Phaser Mock
global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.config = config;
            this.cameras = { main: { width: 800, height: 600, setBackgroundColor: jest.fn() } };
            this.add = {
                text: jest.fn(() => createMockText()),
                rectangle: jest.fn(() => createMockRectangle())
            };
            this.time = {
                delayedCall: jest.fn((delay, callback) => callback()),
                addEvent: jest.fn(() => ({ destroy: jest.fn() }))
            };
            this.tweens = { add: jest.fn() }; // Logic Puzzle uses tweens
            this.sys = { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } };
            this.scene = { stop: jest.fn(), resume: jest.fn(), get: jest.fn() };
            this.game = { events: { emit: jest.fn() } };
            // Simulate input for keys
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

const { LogicPuzzleScene } = require('../js/LogicPuzzleScene');

// Re-use helper
const createMockRectangle = () => {
    const data = {};
    const handlers = {};
    return {
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn((event, fn) => {
            handlers[event] = fn;
        }),
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
        name: '', // LogicPuzzle uses button.name
        emit: (event, ...args) => {
            if (handlers[event]) handlers[event](...args);
        }
    };
};

const createMockText = () => ({
    setOrigin: jest.fn().mockReturnThis(),
    setText: jest.fn(),
    fill: '',
    fontSize: ''
});

describe('LogicPuzzleScene', () => {
    let scene;

    beforeEach(() => {
        scene = new LogicPuzzleScene();
    });

    test('create() initializes buttons and starts sequence', () => {
        scene.create();
        expect(scene.add.rectangle).toHaveBeenCalledTimes(4); // R, G, B, Y
        // delayedCall starts generateSequence
        expect(scene.time.delayedCall).toHaveBeenCalled();
    });

    test('Winning the game (Level 3 -> 6)', () => {
        scene.create();

        // Capture buttons
        // LogicPuzzleScene creates buttons in order: Red, Green, Blue, Yellow
        const buttons = scene.add.rectangle.mock.results.map(r => r.value);
        // We need to know which is which.
        // The test runner doesn't capture assignments to properties like 'name' made *after* the mock return
        // UNLESS the mock object is the *same reference*.
        // `createMockRectangle` returns a new object each time.
        // `scene.add.rectangle` returns that object.
        // The scene code: `button.name = name`.
        // So `buttons[0].name` should be 'red'.

        // Let's rely on creation order:
        // 1. Red
        // 2. Green
        // 3. Blue
        // 4. Yellow
        const redBtn = buttons[0];
        const greenBtn = buttons[1];

        // Logic:
        // GetRandom returns 'red' (arr[0] of ['red', 'green', 'blue', 'yellow']).
        // So sequence is all 'red'.

        // Level 3: 3 reds.
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');

        // Should advance to Level 4.
        // Sequence regen (delayedCall).
        // Level 4: 4 reds.
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');

        // Level 5: 5 reds.
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');
        redBtn.emit('pointerdown');

        // Win!
        expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
            success: true,
            career: 'Innovator'
        });
    });

    test('Losing the game', () => {
        scene.create();
        const buttons = scene.add.rectangle.mock.results.map(r => r.value);
        const redBtn = buttons[0];
        const greenBtn = buttons[1];

        // Sequence is Red.
        // Click Green.
        greenBtn.emit('pointerdown');

        expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
            success: false,
            career: 'Innovator'
        });
    });
});
