
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
    destroy: jest.fn()
    };
};

const createMockText = () => ({
    setOrigin: jest.fn().mockReturnThis(),
    setText: jest.fn(),
    fill: '',
    fontSize: ''
});

const createMockContainer = () => ({
    add: jest.fn(),
    setPosition: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    destroy: jest.fn()
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
            this.sys = { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } };
            this.scene = { stop: jest.fn(), resume: jest.fn(), get: jest.fn() };
            this.game = { events: { emit: jest.fn() } };
            this.events = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
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
        WORK_RESULT: 'workResult'
    }
}));

// 4. Import Scenes
const { ArtisanMinigameScene } = require('../js/ArtisanMinigameScene');
const { HealerMinigameScene } = require('../js/HealerMinigameScene');
const { ScoutMinigameScene } = require('../js/ScoutMinigameScene');

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
            // Timer (2) + Options (4) + Cure Button parts (2) = ~8 rectangles
            expect(scene.add.rectangle.mock.calls.length).toBeGreaterThanOrEqual(6);
        });

        test('Selecting correct remedies and clicking Cure sends success event', () => {
            scene.create();
            // Layout: Timer(0,1), Options(2,3,4,5). Difficulty 2 = First 2 are required.

            const rects = scene.add.rectangle.mock.results.map(r => r.value);

            // Select Required Remedies (Indices 2 and 3)
            rects[2].emit('pointerdown');
            rects[3].emit('pointerdown');

            // Find Cure Button Zone (ButtonFactory uses zone)
            const zones = scene.add.zone.mock.results.map(r => r.value);
            const cureButtonZone = zones[zones.length - 1];

            // Debug: Trigger callback directly if possible, or verify emission
            cureButtonZone.emit('pointerdown');

            // Expect workResult event. Note: The mock for delayedCall executes the callback immediately.
            // If checkSolution works, it calls endGame, which calls delayedCall, which emits.

            // If failed, it might be due to requiredRemedies Set logic or mocked Set behavior?
            // Set in JS works with strings.
            // Let's verify what checkSolution does by checking event arguments

            expect(scene.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Healer'
            });
        });

        test('Selecting incorrect remedy sends failure event', () => {
            scene.create();
            const rects = scene.add.rectangle.mock.results.map(r => r.value);

            // Select Wrong Remedy (Index 4 - Distractor)
            rects[4].emit('pointerdown');

            // Click Cure
            const zones = scene.add.zone.mock.results.map(r => r.value);
            const cureButtonZone = zones[zones.length - 1];
            cureButtonZone.emit('pointerdown');

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
