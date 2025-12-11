
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
            Shuffle: (arr) => arr // Identity for deterministic testing
        }
    },
    GameObjects: {
        Rectangle: class {}
    }
};

// 2. Import Scenes
const { ArtisanMinigameScene } = require('../js/ArtisanMinigameScene');
const { HealerMinigameScene } = require('../js/HealerMinigameScene');
const { ScoutMinigameScene } = require('../js/ScoutMinigameScene');

// 3. Helper to create a mock rectangle with data capability
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
        // Helper to trigger event manually in tests
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

describe('Minigames Test Suite', () => {

    describe('ArtisanMinigameScene', () => {
        let scene;

        beforeEach(() => {
            scene = new ArtisanMinigameScene();
        });

        test('create() initializes grid and displays pattern', () => {
            scene.create();
            // 9 grid buttons
            expect(scene.add.rectangle).toHaveBeenCalledTimes(9);
            // Check if delayedCall was made to hide the pattern
            expect(scene.time.delayedCall).toHaveBeenCalled();
        });

        test('handleGridClick functionality (Success Path)', () => {
            scene.create();

            // Capture the 9 buttons created.
            // The createGrid loop runs 0..8.
            // Mocks are pushed to results.
            const buttons = scene.add.rectangle.mock.results.map(r => r.value);

            // The logic uses:
            // patternIndices = slice(0, 4) of indices [0..8].
            // Shuffle is identity.
            // So pattern is true for indices 0, 1, 2, 3.

            // Click the correct buttons
            buttons[0].emit('pointerdown');
            buttons[1].emit('pointerdown');
            buttons[2].emit('pointerdown');
            buttons[3].emit('pointerdown');

            expect(buttons[0].setFillStyle).toHaveBeenCalledWith(0x4169E1); // Blue

            // Check success event
            // The checkPattern has a delayedCall(1500, endGame)
            // Our mock calls it immediately.

            expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Artisan',
                craftedItem: 'Fancy Bookshelf'
            });
        });

        test('handleGridClick functionality (Failure Path)', () => {
            scene.create();
            const buttons = scene.add.rectangle.mock.results.map(r => r.value);

            // Click a wrong button (index 8)
            buttons[8].emit('pointerdown');

            expect(buttons[8].setFillStyle).toHaveBeenCalledWith(0x4169E1);

            // This doesn't trigger end game yet because active tiles (1) != pattern tiles (4)
            // We need to click 4 tiles to trigger the check.

            // Click 3 more wrong ones? Or just correct ones?
            // If we click 0, 1, 2 (Correct) and 8 (Wrong).
            buttons[0].emit('pointerdown');
            buttons[1].emit('pointerdown');
            buttons[2].emit('pointerdown');

            // Now we have 4 active tiles. Check triggers.
            expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: false,
                career: 'Artisan'
            });
        });
    });

    describe('HealerMinigameScene', () => {
        let scene;

        beforeEach(() => {
            scene = new HealerMinigameScene();
        });

        test('create() selects ailment and creates remedy buttons', () => {
            scene.create();
            // 3 remedy buttons created
            expect(scene.add.rectangle).toHaveBeenCalledTimes(3);
        });

        test('Selecting correct remedy sends success event', () => {
            scene.create();
            // GetRandom returns arr[0] -> High Temperature
            // Remedy -> Cooling Herb
            // setupRemedyOptions logic:
            // options = [Cooling Herb]
            // push distractors[0], [1] -> [Cooling, Happy Potion, Soothing Syrup]
            // Shuffle -> Identity
            // So options[0] is correct.

            const buttons = scene.add.rectangle.mock.results.map(r => r.value);
            // Button 0 is correct
            buttons[0].emit('pointerdown');

            expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Healer'
            });
        });

        test('Selecting incorrect remedy sends failure event', () => {
            scene.create();
            const buttons = scene.add.rectangle.mock.results.map(r => r.value);
            // Button 1 is incorrect (Happy Potion)
            buttons[1].emit('pointerdown');

            expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: false,
                career: 'Healer'
            });
        });
    });

    describe('ScoutMinigameScene', () => {
        let scene;

        beforeEach(() => {
            scene = new ScoutMinigameScene();
            scene.init();
        });

        test('create() sets up grid and timer', () => {
            scene.create();
            // 12 cards created
            expect(scene.add.rectangle).toHaveBeenCalledTimes(12);
            expect(scene.time.addEvent).toHaveBeenCalled();
        });

        test('Matching pair logic', () => {
            scene.create();
            const cards = scene.add.rectangle.mock.results.map(r => r.value);

            // Logic:
            // icons = ['A', 'B', 'C', 'D', 'E', 'F']
            // grid = icons.concat(icons) = ['A', 'B', 'C', 'D', 'E', 'F', 'A', 'B', 'C', 'D', 'E', 'F']
            // (assuming Shuffle is identity)
            // So Index 0 matches Index 6.

            // Click card 0
            cards[0].emit('pointerdown');
            expect(cards[0].setData).toHaveBeenCalledWith('revealed', true);

            // Click card 6 (Match)
            cards[6].emit('pointerdown');
            expect(cards[6].setData).toHaveBeenCalledWith('revealed', true);

            // Check if they stay revealed (no reset)
            expect(cards[0].getData('revealed')).toBe(true);
            expect(cards[6].getData('revealed')).toBe(true);
        });

        test('Mismatch pair logic', () => {
            scene.create();
            const cards = scene.add.rectangle.mock.results.map(r => r.value);

            // Card 0 (A) and Card 1 (B) -> Mismatch

            cards[0].emit('pointerdown');
            cards[1].emit('pointerdown');

            // Mismatch -> delayedCall -> reset
            // Mock executes delayedCall immediately.

            // Check if reset
            expect(cards[0].setData).toHaveBeenCalledWith('revealed', false);
            expect(cards[1].setData).toHaveBeenCalledWith('revealed', false);
        });

        test('Win condition', () => {
            scene.create();
            const cards = scene.add.rectangle.mock.results.map(r => r.value);

            // We need 6 matches. 12 cards.
            // Pairs are (0,6), (1,7), (2,8), (3,9), (4,10), (5,11).

            const pairs = [
                [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]
            ];

            pairs.forEach(pair => {
                cards[pair[0]].emit('pointerdown');
                cards[pair[1]].emit('pointerdown');
            });

            expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Scout'
            });
        });
    });
});
