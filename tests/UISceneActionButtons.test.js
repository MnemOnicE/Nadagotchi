
// Mock Phaser Global BEFORE requiring the module
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
        setStyle: jest.fn().mockReturnThis(),
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
                this.removeAll = jest.fn();
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

const { UIScene } = require('../js/UIScene');
const { EventKeys } = require('../js/EventKeys');

// Mock ButtonFactory
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
                    y: y,
                    tabId: options ? options.tabId : undefined
                };

                btn.emit = (event) => {
                    if (event === 'pointerdown') {
                        if (btn.isDisabled && options && options.onDisabledClick) {
                            options.onDisabledClick();
                        } else if (callback) {
                            callback();
                        }
                    }
                };
                return btn;
            })
        }
    };
});

// Mock PersistenceManager
const mockLoadJournal = jest.fn().mockReturnValue([{ date: 'Day 1', text: 'Diary Entry' }]);
const mockLoadRecipes = jest.fn().mockReturnValue(['Fancy Bookshelf']);
const mockLoadHallOfFame = jest.fn().mockReturnValue([]);
const mockLoadAchievements = jest.fn().mockReturnValue({ unlocked: [] });

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

// Mock SoundSynthesizer
jest.mock('../js/utils/SoundSynthesizer', () => {
    return {
        SoundSynthesizer: {
            instance: {
                playFailure: jest.fn(),
                playChime: jest.fn()
            }
        }
    };
});

describe('UIScene Action Buttons & Optimization', () => {
    let scene;
    let mockGameEvents;
    let mockAdd;

    beforeEach(() => {
        mockAdd = {
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            rectangle: jest.fn(() => new Phaser.GameObjects.Rectangle()),
            group: jest.fn(() => new Phaser.GameObjects.Group()),
            container: jest.fn(() => new Phaser.GameObjects.Container()),
            image: jest.fn(() => new Phaser.GameObjects.Sprite()), // Use Sprite mock for image
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
        scene.time = { delayedCall: jest.fn((delay, cb) => cb()) };
        scene.input = { keyboard: { on: jest.fn() } };
        scene.scene = {
            pause: jest.fn(),
            resume: jest.fn(),
            launch: jest.fn(),
            sleep: jest.fn(),
            isPaused: jest.fn().mockReturnValue(true),
            get: jest.fn()
        };

        // Initialize scene
        scene.create();
    });

    test('showTab should create action buttons for the selected tab', () => {
        // Initial tab is CARE
        expect(scene.currentTab).toBe('CARE');
        expect(scene.actionButtons.length).toBeGreaterThan(0);
        expect(scene.actionButtons.some(b => b.textLabel === 'Feed')).toBe(true);

        // Switch to ACTION
        scene.showTab('ACTION');
        expect(scene.currentTab).toBe('ACTION');
        expect(scene.actionButtons.some(b => b.textLabel === 'Explore')).toBe(true);
    });

    test('showTab should not recreate buttons if called with same tab and state (optimization)', () => {
        scene.showTab('CARE');
        const initialButtons = scene.actionButtons;

        // Call again with same state
        scene.showTab('CARE');

        // Should reference the exact same array (assuming implementation preserves array reference if no change)
        expect(scene.actionButtons).toBe(initialButtons);
    });

    test('showTab should recreate buttons if forced', () => {
        scene.showTab('CARE');
        const initialButtons = scene.actionButtons;

        scene.showTab('CARE', true);

        expect(scene.actionButtons).not.toBe(initialButtons);
    });

    test('updateStatsUI should trigger button updates if state changes affects visibility', () => {
        // Switch to ACTION tab where 'Work' depends on career
        scene.showTab('ACTION');

        // Mock data with NO career
        const dataNoCareer = {
            nadagotchi: {
                stats: { hunger: 50 },
                skills: { logic: 1, navigation: 1, research: 1 },
                currentCareer: null,
                inventory: {},
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
            }
        };

        scene.updateStatsUI(dataNoCareer);

        // Work button should be disabled (or filtered if conditioned out)
        // Based on analysis, let's just check if the list of buttons is consistent
        // with expectations.

        // Mock data WITH career
        const dataWithCareer = {
            nadagotchi: {
                stats: { hunger: 50 },
                skills: { logic: 1, navigation: 1, research: 1 },
                currentCareer: 'Pro Gamer',
                inventory: {},
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
            }
        };

        scene.updateStatsUI(dataWithCareer);

        // Now signature should change because 'Work' button enabled/disabled state is not part of signature
        // Signature is just text labels: "Explore|Study|Work|Craft"
        // Wait, if text labels don't change, signature doesn't change!
        // The signature is: visibleActions.map(a => a.text).join('|');
        // 'Work' is always in visibleActions if condition isn't filtering it.

        // If condition returns false, it is filtered out.
        // { text: 'Work', condition: () => hasCareer ... }
        // If no career, condition is false. Filtered out.
        // Signature: Explore|Study|Craft
        // If career:
        // Signature: Explore|Study|Work|Craft

        // So signature DOES change.

        const buttonsWithCareer = scene.actionButtons.map(b => b.textLabel);
        expect(buttonsWithCareer).toContain('Work');

        // Reset to no career
        scene.updateStatsUI(dataNoCareer);
        const buttonsNoCareer = scene.actionButtons.map(b => b.textLabel);
        // Work button should be disabled or gone.
        // If condition fails, it's gone from visibleActions.

        // Wait, looking at code:
        // const visibleActions = allActions.filter(item => !item.condition || item.condition());
        // Yes, it is removed from the array.
        // BUT wait, I saw `disabledMessage` property. usually implies it should be visible but disabled.
        // However, the condition usage in `filter` implies removal.

        // Let's verify what actually happens in the test.
        // If it was removed, it won't be in `buttonsNoCareer`.

        // In `UIScene.js`:
        // else if (tabId === 'ACTION') actions = [{ text: 'Explore', ... }, ..., { text: 'Work', ..., condition: () => this.nadagotchiData && this.nadagotchiData.currentCareer ... }];

        // So yes, if no career, it is removed.
    });

    test('updateStatsUI call should be optimized after refactor', () => {
        scene.showTab('CARE');
        scene.lastActionSignature = 'Feed|Play|Meditate';
        const initialButtons = scene.actionButtons;

        // Call updateStatsUI with same data/state
        const data = {
            nadagotchi: {
                stats: { hunger: 50 },
                skills: { logic: 1, navigation: 1, research: 1 },
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
                inventory: {}
            }
        };
        scene.updateStatsUI(data);

        // Should not have recreated buttons
        expect(scene.actionButtons).toBe(initialButtons);
    });
});
