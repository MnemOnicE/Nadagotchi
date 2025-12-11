
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
                    setScale: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    disableInteractive: jest.fn().mockReturnThis(),
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

// Mock SoundSynthesizer
const mockPlayFailure = jest.fn();
jest.mock('../js/utils/SoundSynthesizer', () => {
    return {
        SoundSynthesizer: {
            instance: {
                playFailure: mockPlayFailure,
                playChime: jest.fn()
            }
        }
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
        mockPlayFailure.mockClear();

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
        scene.time = { delayedCall: jest.fn((delay, cb) => cb()) };
        scene.input = { keyboard: { on: jest.fn() } };
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
        // Correct behavior: alpha set to 1.0 (not setInteractive)
        expect(scene.jobBoardButton.setAlpha).toHaveBeenCalledWith(1.0);

        // Check Retire button visible (isLegacyReady)
        expect(scene.retireButton.setVisible).toHaveBeenCalledWith(true);

        // Check Scanner button visible
        expect(scene.scannerButton.setVisible).toHaveBeenCalledWith(true);
    });

    test('Job Board button provides feedback when disabled', () => {
        scene.create();

        // Mock data with NO career
        scene.nadagotchiData = { currentCareer: null };

        // Manually trigger the Job Board click handler
        // Note: We need to ensure jobBoardButton is created and callback calls handleJobBoardClick
        // But since we are unit testing the scene method:
        scene.handleJobBoardClick();

        // Should NOT emit WORK event
        expect(mockGameEvents.emit).not.toHaveBeenCalledWith(EventKeys.UI_ACTION, EventKeys.WORK);

        // Should play failure sound
        expect(mockPlayFailure).toHaveBeenCalled();

        // Should show toast (check add.container called)
        expect(mockAdd.container).toHaveBeenCalled();
        // Check text in toast
        expect(mockAdd.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), "Job Board Locked", expect.anything());
    });

    test('Job Board button emits WORK when enabled', () => {
        scene.create();

        // Mock data WITH career
        scene.nadagotchiData = { currentCareer: 'Innovator' };

        scene.handleJobBoardClick();

        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UI_ACTION, EventKeys.WORK);
        expect(mockPlayFailure).not.toHaveBeenCalled();
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

    test('Settings Modal should open and emit updates', () => {
        scene.create();

        // Open Settings
        scene.handleUIActions(EventKeys.OPEN_SETTINGS);
        expect(scene.settingsModal.setVisible).toHaveBeenCalledWith(true);
        expect(scene.scene.pause).toHaveBeenCalledWith('MainScene');

        // Test Volume buttons
        const volDown = scene.settingsModal.children.find(c => c.textLabel === '-');
        if (!volDown) {
             console.log('Settings Modal Children:', scene.settingsModal.children);
             throw new Error('volDown button not found');
        }
        const volUp = scene.settingsModal.children.find(c => c.textLabel === '+');

        volDown.emit('pointerdown');
        // Default 0.5 -> 0.4
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_SETTINGS, { volume: 0.4 });

        volUp.emit('pointerdown');
        // 0.4 -> 0.5 (assuming previous state isn't persisted in test mock)
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_SETTINGS, { volume: 0.5 });

        // Test Speed Buttons
        const speedButtons = scene.settingsModal.speedButtons;
        const fastBtn = speedButtons.find(b => b.textLabel === '2x');

        fastBtn.emit('pointerdown');
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UPDATE_SETTINGS, { gameSpeed: 2.0 });
    });

    test('updateStatsUI should handle new data structure with settings', () => {
        scene.create();
        const mockData = {
            nadagotchi: {
                stats: { hunger: 50, energy: 50, happiness: 50 },
                skills: { logic: 1, navigation: 1, research: 1, empathy: 1, crafting: 1, focus: 1 },
                mood: 'happy',
                dominantArchetype: 'Adventurer',
                location: 'Home',
                currentCareer: null,
                isLegacyReady: false,
                inventory: {}
            },
            settings: { volume: 0.8, gameSpeed: 2.0 }
        };

        scene.updateStatsUI(mockData);

        expect(scene.nadagotchiData).toBe(mockData.nadagotchi);
        expect(scene.settingsData).toBe(mockData.settings);
    });
});
