<<<<<<< HEAD
// tests/Ancestors.test.js
import { jest } from '@jest/globals';
import { EventKeys } from '../js/EventKeys.js';

// Mocks must be defined before requiring module under test if relying on hoisting,
// but since we are fixing a ReferenceError due to imports, we will use deferred require.

// Mock PersistenceManager
const mockLoadHallOfFame = jest.fn().mockResolvedValue([]);
jest.mock('../js/PersistenceManager.js', () => ({
    PersistenceManager: jest.fn().mockImplementation(() => ({
        loadHallOfFame: mockLoadHallOfFame
    }))
}));

// Mock ButtonFactory
jest.mock('../js/ButtonFactory.js', () => ({
    ButtonFactory: {
        createButton: jest.fn(() => ({
            setAlpha: jest.fn(),
            destroy: jest.fn(),
            setPosition: jest.fn(),
            setDisabled: jest.fn()
        }))
    }
}));

// Mock Phaser Global BEFORE importing UIScene
global.Phaser = {
    Scene: class {
        constructor(config) { this.key = config.key; }
        add = {
            rectangle: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis(), setStrokeStyle: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), setSize: jest.fn().mockReturnThis(), setPosition: jest.fn().mockReturnThis() }),
            text: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), setText: jest.fn().mockReturnThis(), setPosition: jest.fn().mockReturnThis() }),
            container: jest.fn().mockReturnValue({ add: jest.fn(), setVisible: jest.fn(), setPosition: jest.fn(), setDepth: jest.fn() }),
            image: jest.fn().mockReturnValue({ setScale: jest.fn().mockReturnThis(), setOrigin: jest.fn().mockReturnThis() })
        };
        scale = { on: jest.fn() };
        cameras = { main: { width: 800, height: 600, setSize: jest.fn() } };
        input = { keyboard: { on: jest.fn() } };
        game = { events: { on: jest.fn(), emit: jest.fn() } };
        scene = { get: jest.fn(), pause: jest.fn(), resume: jest.fn(), sleep: jest.fn(), launch: jest.fn() };
        time = { delayedCall: jest.fn() };
    }
};

// Now import the scene using require to ensure global.Phaser is set first
=======

// tests/Ancestors.test.js

// Mock Phaser scenes and game objects (Copied from legacy.test.js, shortened)
class Scene {
    constructor(key) {
        this.key = key;
        this.scene = {
            start: jest.fn(),
            stop: jest.fn(),
            launch: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            isPaused: jest.fn().mockReturnValue(false),
        };
        // Simple mock object builder
        const mockGO = () => ({
            setText: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            disableInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setStyle: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setStrokeStyle: jest.fn().mockReturnThis(),
            add: jest.fn(),
            setPosition: jest.fn().mockReturnThis(),
            setSize: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
            clear: jest.fn(),
        });
        const addMock = {
            text: jest.fn(mockGO),
            sprite: jest.fn(mockGO),
            container: jest.fn(mockGO),
            graphics: jest.fn(mockGO),
            particles: jest.fn(mockGO),
            renderTexture: jest.fn(mockGO),
            image: jest.fn(mockGO),
            group: jest.fn(() => ({
                addMultiple: jest.fn(),
                add: jest.fn(),
                setVisible: jest.fn(),
                content: { setText: jest.fn() }
            })),
            rectangle: jest.fn(mockGO),
            zone: jest.fn(mockGO),
        };
        this.add = addMock;
        this.input = { on: jest.fn(), keyboard: { on: jest.fn() } };
        this.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        this.cameras = {
            main: { width: 800, height: 600, setBackgroundColor: jest.fn(), setSize: jest.fn(), setViewport: jest.fn() },
            resize: jest.fn()
        };
        this.game = { events: { on: jest.fn(), emit: jest.fn() } };
        this.scale = { on: jest.fn(), width: 800, height: 600 };
        this.textures = {
             createCanvas: jest.fn().mockReturnValue({ context: {}, width:800, height:600 })
        };
    }
}

global.Phaser = {
    Scene,
    Utils: { Array: { GetRandom: (arr) => arr[0] } },
    Math: { Between: (min, max) => min, Clamp: (v, min, max) => Math.min(Math.max(v, min), max) },
    Display: { Color: { Interpolate: { ColorWithColor: jest.fn(() => ({ r: 0, g: 0, b: 0 })) } } }
};

class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

>>>>>>> 74fdaab (Update js/DebugConsole.js)
const { UIScene } = require('../js/UIScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');

describe('Hall of Ancestors UI', () => {
    let uiScene;
<<<<<<< HEAD
    let mockPersistenceInstance;

    beforeEach(() => {
        uiScene = new UIScene();

        // Ensure the scene uses our mock persistence
        mockPersistenceInstance = {
            loadHallOfFame: mockLoadHallOfFame
        };
        uiScene.persistence = mockPersistenceInstance;

        // Reset mocks
        mockLoadHallOfFame.mockClear();
    });

    test('showTab ANCESTORS should create buttons for each ancestor', async () => {
        const ancestors = [
            { generation: 1, dominantArchetype: 'Adventurer' },
            { generation: 2, dominantArchetype: 'Intellectual' }
        ];
        mockLoadHallOfFame.mockResolvedValue(ancestors);

        // We need to simulate the async load flow manually because we can't await inside constructor
        await uiScene.loadAsyncUIData();

        const actions = uiScene.getTabActions('ANCESTORS');

        expect(actions).toHaveLength(2);
        expect(actions[0].text).toContain('Gen 1: Adventurer');
        expect(actions[1].text).toContain('Gen 2: Intellectual');
        expect(actions[0].action).toBe(EventKeys.OPEN_ANCESTOR_MODAL);
    });

    test('showTab ANCESTORS should show empty state if no ancestors', async () => {
        mockLoadHallOfFame.mockResolvedValue([]);
        await uiScene.loadAsyncUIData();

        const actions = uiScene.getTabActions('ANCESTORS');

        expect(actions).toHaveLength(1);
        expect(actions[0].text).toBe('No Ancestors Yet');
=======
    let gameEvents;

    beforeEach(() => {
        global.localStorage.clear();

        // Mock event emitter
        const events = {};
        gameEvents = {
            on: jest.fn((event, fn, context) => {
                if (!events[event]) events[event] = [];
                events[event].push({ fn, context });
            }),
            emit: jest.fn((event, ...args) => {
                if (events[event]) {
                    events[event].forEach(listener => listener.fn.apply(listener.context, args));
                }
            }),
        };

        uiScene = new UIScene();
        uiScene.game = { events: gameEvents };
        uiScene.scene = { pause: jest.fn(), resume: jest.fn(), isPaused: jest.fn() };
        uiScene.scale = { on: jest.fn(), width: 800, height: 600 };

        // Setup mock hall of fame
        const ancestors = [
            { generation: 1, dominantArchetype: 'Adventurer', stats: { happiness: 80 }, skills: { logic: 2, empathy: 1 }, currentCareer: 'Scout' },
            { generation: 2, dominantArchetype: 'Intellectual', stats: { happiness: 90 }, skills: { logic: 10, empathy: 2 }, currentCareer: 'Innovator' }
        ];
        new PersistenceManager().saveToHallOfFame(ancestors[0]);
        new PersistenceManager().saveToHallOfFame(ancestors[1]);

        uiScene.create();
    });

    test('should have ANCESTORS tab', () => {
        // Check that we have 4 tabs now
        expect(uiScene.tabButtons.length).toBe(4);
    });

    test('showTab ANCESTORS should create buttons for each ancestor', () => {
        uiScene.showTab('ANCESTORS');

        // Check that actionButtons were populated.
        expect(uiScene.actionButtons.length).toBe(2);
    });

    test('clicking an ancestor button should open the ancestor modal', () => {
        const ancestor = { generation: 1, dominantArchetype: 'Adventurer', stats: { happiness: 80 }, skills: { logic: 2, empathy: 1 } };

        // Simulate the UI action
        uiScene.handleUIActions('OPEN_ANCESTOR_MODAL', ancestor);

        // Check if modal became visible
        expect(uiScene.ancestorModal.setVisible).toHaveBeenCalledWith(true);

        // Check if content was set (checking for presence of archetype and advice)
        expect(uiScene.ancestorModal.content.setText).toHaveBeenCalled();
        const setTextArg = uiScene.ancestorModal.content.setText.mock.calls[0][0];
        expect(setTextArg).toContain('Generation 1');
        expect(setTextArg).toContain('Adventurer');
        expect(setTextArg).toContain('Advice');
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    });
});
