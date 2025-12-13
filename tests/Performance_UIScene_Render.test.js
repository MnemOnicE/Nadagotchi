
// tests/Performance_UIScene_Render.test.js

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
            constructor() { Object.assign(this, mockGameObject()); this.list = []; }
            add(child) { this.list.push(child); return this; }
            addMultiple(children) { this.list = this.list.concat(children); return this; }
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
                    setDisabled: jest.fn(function(val) {
                        this.isDisabled = val;
                        return this;
                    }),
                    isDisabled: false,
                    x: x,
                    y: y
                };
                return btn;
            })
        }
    };
});

const mockLoadJournal = jest.fn().mockReturnValue([]);
const mockLoadRecipes = jest.fn().mockReturnValue([]);
const mockLoadHallOfFame = jest.fn().mockReturnValue([]);
const mockLoadAchievements = jest.fn().mockReturnValue({ unlocked: [], progress: {} });

jest.mock('../js/PersistenceManager', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => {
            return {
                loadJournal: mockLoadJournal,
                loadRecipes: mockLoadRecipes,
                loadHallOfFame: mockLoadHallOfFame,
                loadAchievements: mockLoadAchievements
            };
        })
    };
});

jest.mock('../js/utils/SoundSynthesizer', () => ({
    SoundSynthesizer: {
        instance: {
            playFailure: jest.fn(),
            playChime: jest.fn()
        }
    }
}));

const { UIScene } = require('../js/UIScene');
const { EventKeys } = require('../js/EventKeys');

describe('Performance: UIScene Render Throttling', () => {
    let scene;
    let mockGameEvents;
    let mockAdd;

    beforeEach(() => {
        mockAdd = {
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            rectangle: jest.fn(() => new Phaser.GameObjects.Rectangle()),
            group: jest.fn(() => new Phaser.GameObjects.Group()),
            container: jest.fn(() => new Phaser.GameObjects.Container()),
        };

        mockGameEvents = {
            on: jest.fn(),
            emit: jest.fn()
        };

        scene = new UIScene();
        scene.add = mockAdd;
        scene.tweens = { add: jest.fn() };
        scene.cameras = {
            main: {
                width: 800,
                height: 600,
                setSize: jest.fn(),
                setViewport: jest.fn()
            }
        };
        scene.game = { events: mockGameEvents };
        scene.scale = { on: jest.fn() };
        scene.time = { delayedCall: jest.fn() };
        scene.input = { keyboard: { on: jest.fn() } };
        scene.scene = { pause: jest.fn(), resume: jest.fn() };
    });

    test('updateStatsUI should NOT rebuild buttons if state is unchanged', () => {
        scene.create();

        // Mock the internal methods we want to spy on
        const spyShowTab = jest.spyOn(scene, 'showTab');

        // Initial Data
        const data = {
            nadagotchi: {
                stats: { hunger: 50, energy: 50, happiness: 50 },
                skills: { logic: 10, navigation: 10, research: 10, empathy: 10, crafting: 10 },
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
                currentCareer: null, // No career
                isLegacyReady: false
            },
            settings: {}
        };

        // Switch to ACTION tab where 'Work' button exists
        scene.showTab('ACTION');
        spyShowTab.mockClear(); // Clear the call from the manual switch

        // 1. First Update - Should trigger showTab because signature is new/undefined vs "career:false"
        // In unoptimized code, it calls showTab unconditionally if tab is ACTION.

        scene.updateStatsUI(data);
        const callCountAfterFirst = spyShowTab.mock.calls.length;

        // 2. Second Update - Identical data
        scene.updateStatsUI(data);
        const callCountAfterSecond = spyShowTab.mock.calls.length;

        // 3. Third Update - Identical data
        scene.updateStatsUI(data);
        const callCountAfterThird = spyShowTab.mock.calls.length;

        console.log(`showTab calls: ${callCountAfterFirst}, ${callCountAfterSecond}, ${callCountAfterThird}`);

        // We expect NO new calls after the first update if logic is identical
        expect(callCountAfterSecond).toBe(callCountAfterFirst);
        expect(callCountAfterThird).toBe(callCountAfterFirst);
    });

    test('updateStatsUI should NOT call setText if text is unchanged', () => {
        scene.create();
        const spySetText = jest.spyOn(scene.statsText, 'setText');

        const data = {
            nadagotchi: {
                stats: { hunger: 50, energy: 50, happiness: 50 },
                skills: { logic: 10, navigation: 10, research: 10, empathy: 10, crafting: 10 },
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
                currentCareer: null,
                isLegacyReady: false
            },
            settings: {}
        };

        scene.updateStatsUI(data);
        const initialCalls = spySetText.mock.calls.length;

        // Same data
        scene.updateStatsUI(data);

        // Should be same count
        expect(spySetText.mock.calls.length).toBe(initialCalls);
    });

    test('updateStatsUI SHOULD rebuild buttons if state changes', () => {
        scene.create();
        const spyShowTab = jest.spyOn(scene, 'showTab');
        scene.showTab('ACTION');
        spyShowTab.mockClear();

        const data1 = {
            nadagotchi: {
                stats: { hunger: 50, energy: 50, happiness: 50 },
                skills: { logic: 10, navigation: 10, research: 10, empathy: 10, crafting: 10 },
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
                currentCareer: null,
                isLegacyReady: false
            },
            settings: {}
        };

        scene.updateStatsUI(data1);
        const calls1 = spyShowTab.mock.calls.length;

        // Change state: Get a career
        const data2 = {
            ...data1,
            nadagotchi: {
                ...data1.nadagotchi,
                currentCareer: 'Scout'
            }
        };

        scene.updateStatsUI(data2);
        const calls2 = spyShowTab.mock.calls.length;

        expect(calls2).toBeGreaterThan(calls1);
    });
});
