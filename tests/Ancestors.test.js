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
const { UIScene } = require('../js/UIScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');

describe('Hall of Ancestors UI', () => {
    let uiScene;
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
    });
});
