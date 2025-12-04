
// tests/UIScene.test.js

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
             constructor() { Object.assign(this, mockGameObject()); this.children = []; }
             add(child) { this.children.push(child); return this; }
             addMultiple(children) { this.children = this.children.concat(children); return this; }
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
                // Return a simple object that mocks the Container behavior needed
                const btn = {
                    textLabel: text,
                    emit: (event) => {
                         if (event === 'pointerdown' && callback) callback();
                    },
                    setPosition: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
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

describe('UIScene', () => {
    let scene;
    let mockGameEvents;
    let mockAdd;

    beforeEach(() => {
        mockLoadJournal.mockClear();
        mockLoadRecipes.mockClear();
        mockLoadHallOfFame.mockClear();

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
        scene.scene = {
            pause: jest.fn(),
            resume: jest.fn(),
            isPaused: jest.fn().mockReturnValue(true)
        };
    });

    test('create should initialize UI elements and tabs', () => {
        scene.create();

        expect(mockAdd.rectangle).toHaveBeenCalled(); // Backgrounds
        expect(mockAdd.text).toHaveBeenCalled(); // Stats text

        // Check tabs created (4 tabs)
        expect(scene.tabButtons.length).toBe(4);
        expect(scene.tabButtons[0].textLabel).toBe('❤️ CARE');

        // Check event listeners
        expect(mockGameEvents.on).toHaveBeenCalledWith(EventKeys.UPDATE_STATS, expect.any(Function), scene);
        expect(mockGameEvents.on).toHaveBeenCalledWith(EventKeys.UI_ACTION, expect.any(Function), scene);
    });

    test('clicking a tab should update action buttons', () => {
        scene.create();

        // Initial tab is CARE
        expect(scene.currentTab).toBe('CARE');
        // Check care buttons (Feed, Play, Meditate)
        const careButtons = scene.actionButtons;
        expect(careButtons.length).toBe(3);
        expect(careButtons[0].textLabel).toBe('Feed');

        // Switch to SYSTEM tab
        const systemTab = scene.tabButtons.find(b => b.textLabel.includes('SYSTEM'));
        systemTab.emit('pointerdown');

        expect(scene.currentTab).toBe('SYSTEM');
        // Check system buttons (Journal, Inventory, etc.)
        const systemButtons = scene.actionButtons;
        expect(systemButtons.length).toBeGreaterThan(0);
        expect(systemButtons.find(b => b.textLabel === 'Journal')).toBeDefined();
    });

    test('clicking an action button should emit UI_ACTION', () => {
        scene.create();
        // Use 'Feed' button from CARE tab
        const feedBtn = scene.actionButtons.find(b => b.textLabel === 'Feed');

        feedBtn.emit('pointerdown');

        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UI_ACTION, EventKeys.FEED, undefined);
    });

    test('updateStatsUI should update stats text and conditional buttons', () => {
        scene.create();
        const mockPetData = {
            stats: { hunger: 50, energy: 50, happiness: 50 },
            skills: { logic: 1, navigation: 1, research: 1, empathy: 1, crafting: 1, focus: 1 },
            mood: 'happy',
            dominantArchetype: 'Adventurer',
            location: 'Home',
            currentCareer: 'Scout',
            isLegacyReady: true,
            inventory: { 'Genetic Scanner': 1 }
        };

        scene.updateStatsUI(mockPetData);

        // Check stats text updated
        expect(scene.statsText.setText).toHaveBeenCalled();
        const textCall = scene.statsText.setText.mock.calls[0][0];
        expect(textCall).toContain('Adventurer');

        // Check Job Board enabled (since currentCareer exists)
        expect(scene.jobBoardButton.setInteractive).toHaveBeenCalled();

        // Check Retire button visible (isLegacyReady)
        expect(scene.retireButton.setVisible).toHaveBeenCalledWith(true);

        // Check Scanner button visible
        expect(scene.scannerButton.setVisible).toHaveBeenCalledWith(true);
    });

    test('should open modals correctly', () => {
        scene.create();
        scene.nadagotchiData = { inventory: {} }; // Mock data needed for some modals

        // Journal
        scene.handleUIActions(EventKeys.OPEN_JOURNAL);
        expect(scene.journalModal.setVisible).toHaveBeenCalledWith(true);
        expect(scene.scene.pause).toHaveBeenCalledWith('MainScene');
        expect(mockLoadJournal).toHaveBeenCalled();

        // Inventory
        scene.handleUIActions(EventKeys.OPEN_INVENTORY);
        expect(scene.inventoryModal.setVisible).toHaveBeenCalledWith(true);
    });

    test('resize should reposition elements', () => {
        scene.create();

        scene.resize({ width: 1000, height: 800 });

        expect(scene.cameras.main.setSize).toHaveBeenCalledWith(1000, 800);
        expect(scene.dashboardBg.setSize).toHaveBeenCalled();
        // Tabs should be moved
        // ... (hard to verify position without complex mocks, but function called is good)
    });

    test('scanner should display gene info', () => {
        scene.create();
        scene.nadagotchiData = {
            genome: {
                genotype: { Adventurer: [10, 20] }
            },
            inventory: { 'Genetic Scanner': 1 }
        };

        scene.onClickScanner();

        expect(scene.scannerModal.content.setText).toHaveBeenCalled();
        const text = scene.scannerModal.content.setText.mock.calls[0][0];
        expect(text).toContain('Adventurer: [10 | 20]');
        expect(scene.scannerModal.setVisible).toHaveBeenCalledWith(true);
    });
});
