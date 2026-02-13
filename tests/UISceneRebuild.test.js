
// tests/UISceneRebuild.test.js

// 1. Mock Phaser Global
const mockGameObject = () => {
    const listeners = {};
    const obj = {
        on: jest.fn((event, fn) => {
            listeners[event] = fn;
            return obj;
        }),
        emit: (event, ...args) => {
            if (listeners[event]) listeners[event](...args);
        },
        setInteractive: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setText: jest.fn(function(val) {
            this.textValue = val;
            return this;
        }),
        setStrokeStyle: jest.fn().mockReturnThis(),
        add: jest.fn().mockReturnThis(),
        addMultiple: jest.fn().mockReturnThis(),
        width: 100,
        height: 50,
        list: [],
        textValue: ''
    };
    return obj;
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) { this.config = config; }
    },
    GameObjects: {
        Container: class Container {
            constructor() {
                Object.assign(this, mockGameObject());
                this.list = [];
                this.add = (child) => {
                    if (Array.isArray(child)) {
                        this.list = this.list.concat(child);
                    } else {
                        this.list.push(child);
                    }
                    return this;
                };
                this.addMultiple = (children) => { this.list = this.list.concat(children); return this; };
            }
        },
        Group: class Group {
             constructor() {
                 Object.assign(this, mockGameObject());
                 this.children = [];
                 this.addMultiple = (children) => {
                     this.children = this.children.concat(children);
                     return this;
                 };
             }
             add(child) { this.children.push(child); return this; }
             setVisible(v) { this.visible = v; return this; }
        },
        Text: class Text { constructor() { Object.assign(this, mockGameObject()); } },
        Graphics: class Graphics { constructor() { Object.assign(this, mockGameObject()); } },
        Sprite: class Sprite { constructor() { Object.assign(this, mockGameObject()); } },
        Rectangle: class Rectangle { constructor() { Object.assign(this, mockGameObject()); } }
    }
};

// 2. Mock Dependencies
jest.mock('../js/ButtonFactory', () => {
    return {
        ButtonFactory: {
            createButton: jest.fn((scene, x, y, text, callback, options) => {
                const btn = {
                    textLabel: text,
                    setPosition: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setScale: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    disableInteractive: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    setDisabled: jest.fn().mockReturnThis(),
                    x: x,
                    y: y,
                    destroyCalled: false
                };
                btn.destroy = jest.fn(() => { btn.destroyCalled = true; });

                btn.emit = (event) => {
                    if (event === 'pointerdown' && callback) {
                        callback();
                    }
                };
                return btn;
            })
        }
    };
});

// Mock minimal persistence needed
jest.mock('../js/PersistenceManager', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => {
            return {
                loadJournal: jest.fn().mockReturnValue([]),
                loadRecipes: jest.fn().mockReturnValue([]),
                loadHallOfFame: jest.fn().mockReturnValue([]),
                loadAchievements: jest.fn().mockReturnValue({ unlocked: [] })
            };
        })
    };
});

jest.mock('../js/utils/SoundSynthesizer', () => ({
    SoundSynthesizer: { instance: { playFailure: jest.fn(), playChime: jest.fn() } }
}));

const { UIScene } = require('../js/UIScene');
const { EventKeys } = require('../js/EventKeys');

describe('UIScene Rebuild Logic', () => {
    let scene;
    let mockGameEvents;

    beforeEach(() => {
        mockGameEvents = { on: jest.fn(), emit: jest.fn() };

        scene = new UIScene();
        scene.add = {
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            rectangle: jest.fn(() => new Phaser.GameObjects.Rectangle()),
            container: jest.fn(() => new Phaser.GameObjects.Container()),
        };
        scene.cameras = { main: { width: 800, height: 600, setSize: jest.fn(), setViewport: jest.fn() } };
        scene.game = { events: mockGameEvents };
        scene.scale = { on: jest.fn() };
        scene.input = { keyboard: { on: jest.fn() } };
        scene.time = { delayedCall: jest.fn() };

        // Mock getTabActions to always return a static list for 'CARE'
        // This isolates the optimization test from the actual action generation logic
        // But we can also just rely on the real implementation which is deterministic for CARE
    });

    test('rebuilding: subsequent showTab(false) should NOT destroy buttons if signature matches', () => {
        scene.create();

        // 1. Initial Build
        scene.showTab('CARE');
        expect(scene.actionButtons.length).toBeGreaterThan(0);

        const firstButton = scene.actionButtons[0];

        // 2. Second Build (Background Update)
        // Currently (before fix), this MIGHT destroy buttons if updateStatsUI calls it (though updateStatsUI has its own check)
        // But we want showTab ITSELF to handle this.
        // Calling showTab directly without force should optimize.

        // NOTE: In current implementation, showTab ALWAYS destroys. So this expectation will fail until fixed.
        scene.showTab('CARE', false);

        // If optimization works, firstButton should NOT be destroyed
        // If no optimization, it IS destroyed
        expect(firstButton.destroy).not.toHaveBeenCalled();
    });

    test('rebuilding: showTab(true) SHOULD destroy buttons even if signature matches', () => {
        scene.create();

        scene.showTab('CARE');
        const firstButton = scene.actionButtons[0];

        scene.showTab('CARE', true);

        expect(firstButton.destroy).toHaveBeenCalled();
    });
});
