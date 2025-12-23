
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

const { UIScene } = require('../js/UIScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');

describe('Hall of Ancestors UI', () => {
    let uiScene;
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
    });
});
