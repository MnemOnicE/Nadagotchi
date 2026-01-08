
// tests/UISceneModalManagement.test.js

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
        setVisible: jest.fn(function(v) {
            this.visible = v;
            return this;
        }),
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
        textValue: '',
        visible: true // Default visible
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
                 // Override the mockGameObject's addMultiple to ensure logic runs
                 this.addMultiple = (children) => {
                     this.children = this.children.concat(children);
                     return this;
                 };
             }
             add(child) { this.children.push(child); return this; }
             // IMPORTANT: The mock needs to actually update the visible property
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
            createButton: jest.fn((scene, x, y, text, callback) => {
                const btn = {
                    textLabel: text,
                    emit: (event) => {
                         if (event === 'pointerdown' && callback) callback();
                    },
                    setPosition: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setScale: jest.fn().mockReturnThis(),
                    setDisabled: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    x: x,
                    y: y
                };
                return btn;
            })
        }
    };
});

const mockLoadJournal = jest.fn().mockReturnValue([{ date: 'Day 1', text: 'Diary Entry' }]);
const mockLoadRecipes = jest.fn().mockReturnValue(['Fancy Bookshelf']);
const mockLoadHallOfFame = jest.fn().mockReturnValue([]);

jest.mock('../js/PersistenceManager', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => {
            return {
                loadJournal: mockLoadJournal,
                loadRecipes: mockLoadRecipes,
                loadHallOfFame: mockLoadHallOfFame
            };
        })
    };
});

const { UIScene } = require('../js/UIScene');
const { EventKeys } = require('../js/EventKeys');

describe('UIScene Modal Management', () => {
    let scene;
    let mockGameEvents;

    beforeEach(() => {
        mockLoadJournal.mockClear();
        mockLoadRecipes.mockClear();
        mockLoadHallOfFame.mockClear();

        mockGameEvents = {
            on: jest.fn(),
            emit: jest.fn()
        };

        scene = new UIScene();
        scene.add = {
            text: jest.fn(() => new Phaser.GameObjects.Text()),
            rectangle: jest.fn(() => new Phaser.GameObjects.Rectangle()),
            group: jest.fn(() => new Phaser.GameObjects.Group()),
            container: jest.fn(() => new Phaser.GameObjects.Container()),
        };
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
        scene.scene = {
            pause: jest.fn(),
            resume: jest.fn(),
            launch: jest.fn(),
            sleep: jest.fn(),
            isPaused: jest.fn().mockReturnValue(true)
        };
        scene.create();
        scene.nadagotchiData = {
            inventory: {},
            recipes: {},
            hobbies: {},
            relationships: {},
            genome: { genotype: {} } // Add genome to pass checks
        };
    });

    test('opening a new modal should close existing open modals', () => {
        // 1. Open Journal
        scene.handleUIActions(EventKeys.OPEN_JOURNAL);
        expect(scene.journalModal.visible).toBe(true);

        // 2. Open Inventory
        scene.handleUIActions(EventKeys.OPEN_INVENTORY);
        expect(scene.inventoryModal.visible).toBe(true);

        // 3. Assert Journal is CLOSED (This is the bug fix requirement)
        expect(scene.journalModal.visible).toBe(false);
    });

    test('opening settings should close other modals', () => {
        scene.handleUIActions(EventKeys.OPEN_RECIPES);
        expect(scene.recipeModal.visible).toBe(true);

        scene.handleUIActions(EventKeys.OPEN_SETTINGS);
        expect(scene.settingsModal.visible).toBe(true);
        expect(scene.recipeModal.visible).toBe(false);
    });

    test('opening passport should pause MainScene and sleep UIScene', () => {
        scene.handleUIActions(EventKeys.OPEN_SHOWCASE);
        expect(scene.scene.pause).toHaveBeenCalledWith('MainScene');
        expect(scene.scene.sleep).toHaveBeenCalled();
        expect(scene.scene.launch).toHaveBeenCalledWith('ShowcaseScene', expect.anything());
    });

    test('showing dialogue should close other modals', () => {
        scene.handleUIActions(EventKeys.DECORATE);
        expect(scene.decorateModal.visible).toBe(true);

        scene.showDialogue('NPC', 'Hello');
        expect(scene.dialogueModal.visible).toBe(true);
        expect(scene.decorateModal.visible).toBe(false);
    });
});
