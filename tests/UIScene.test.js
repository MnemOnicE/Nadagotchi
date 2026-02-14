import { jest } from '@jest/globals';
import { setupPhaserMock, createMockAdd, mockGameObject } from './helpers/mockPhaser';

setupPhaserMock();

// Enhance the Container mock for this specific test
// The helper's Container mock is basic; UIScene tests need list management
const originalContainer = global.Phaser.GameObjects.Container;
global.Phaser.GameObjects.Container = class Container {
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
};

const { UIScene } = require('../js/UIScene');
const { EventKeys } = require('../js/EventKeys');

// Mock Dependencies
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

const mockLoadJournal = jest.fn().mockResolvedValue([{ date: 'Day 1', text: 'Diary Entry' }]);
const mockLoadRecipes = jest.fn().mockResolvedValue(['Fancy Bookshelf']);
const mockLoadHallOfFame = jest.fn().mockResolvedValue([]);

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
const mockPlayFailureFn = jest.fn(); // Renamed to avoid confusion, though scoping is the issue
jest.mock('../js/utils/SoundSynthesizer', () => {
    return {
        SoundSynthesizer: {
            instance: {
                playFailure: jest.fn(), // Use a fresh mock here
                playChime: jest.fn()
            }
        }
    };
});

describe('UIScene', () => {
    let scene;
    let mockGameEvents;
    let mockAdd;

    beforeEach(() => {
        mockLoadJournal.mockClear();
        mockLoadRecipes.mockClear();
        mockLoadHallOfFame.mockClear();
        // Access the mocked function from the module if we need to spy on it
        // Or just trust it runs.

        mockAdd = createMockAdd();
        // Override mockAdd.container to use the enhanced container from setupPhaserMock
        mockAdd.container = jest.fn(() => new Phaser.GameObjects.Container());

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
        // Check system buttons (Passport, Journal, Inventory, etc.)
        const systemButtons = scene.actionButtons;
        expect(systemButtons.length).toBeGreaterThan(0);
        expect(systemButtons.find(b => b.textLabel === 'Passport')).toBeDefined();
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
    });

    test('Job Board button emits OPEN_JOB_BOARD when clicked', () => {
        scene.create();

        // Trigger the Job Board click handler
        scene.handleJobBoardClick();

        // Should emit OPEN_JOB_BOARD event
        expect(mockGameEvents.emit).toHaveBeenCalledWith(EventKeys.UI_ACTION, EventKeys.OPEN_JOB_BOARD);
    });

    test('should open modals correctly', async () => {
        scene.create();
        scene.nadagotchiData = { inventory: {} }; // Mock data needed for some modals

        // Journal
        await scene.handleUIActions(EventKeys.OPEN_JOURNAL);
        expect(scene.journalModal.setVisible).toHaveBeenCalledWith(true);
        expect(scene.scene.pause).toHaveBeenCalledWith('MainScene');
        expect(mockLoadJournal).toHaveBeenCalled();

        // Inventory
        await scene.handleUIActions(EventKeys.OPEN_INVENTORY);
        expect(scene.inventoryModal.setVisible).toHaveBeenCalledWith(true);
    });

    test('opening passport should trigger scene launch', () => {
        scene.create();
        scene.nadagotchiData = { some: 'data' };

        scene.handleUIActions(EventKeys.OPEN_SHOWCASE);

        expect(scene.scene.pause).toHaveBeenCalledWith('MainScene');
        expect(scene.scene.sleep).toHaveBeenCalled();
        expect(scene.scene.launch).toHaveBeenCalledWith('ShowcaseScene', { nadagotchi: scene.nadagotchiData });
    });

    test('resize should reposition elements', () => {
        scene.create();

        scene.resize({ width: 1000, height: 800 });

        expect(scene.cameras.main.setSize).toHaveBeenCalledWith(1000, 800);
        expect(scene.dashboardBg.setSize).toHaveBeenCalled();
        // Tabs should be moved
        // ... (hard to verify position without complex mocks, but function called is good)
    });

    test('Settings Modal should open and emit updates', () => {
        scene.create();

        // Open Settings
        scene.handleUIActions(EventKeys.OPEN_SETTINGS);
        expect(scene.settingsModal.setVisible).toHaveBeenCalledWith(true);
        expect(scene.scene.pause).toHaveBeenCalledWith('MainScene');

        // Test Volume buttons
        // settingsModal is now a Container, so use .list
        const volDown = scene.settingsModal.list.find(c => c.textLabel === '-');
        if (!volDown) {
             console.log('Settings Modal Children:', scene.settingsModal.list);
             throw new Error('volDown button not found');
        }
        const volUp = scene.settingsModal.list.find(c => c.textLabel === '+');

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
