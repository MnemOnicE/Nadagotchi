import { jest } from '@jest/globals';
import { setupPhaserMock, createMockAdd, mockGameObject } from './helpers/mockPhaser';

// Setup global Phaser mock BEFORE imports that rely on it
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
        this.removeAll = jest.fn(() => { this.list = []; });
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
        mockAdd = createMockAdd();

        // Enhance mockAdd for specific UIScene needs if strictly necessary
        // The helper provides basic functionality. UIScene uses 'container', 'text', 'rectangle' etc.
        // We override 'container' to use our enhanced class
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

        const buttonsWithNoCareer = scene.actionButtons.map(b => b.textLabel);
        // Work button should NOT be present if filtered by condition
        // In UIScene: condition: () => hasCareer.
        expect(buttonsWithNoCareer).not.toContain('Work');

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

        const buttonsWithCareer = scene.actionButtons.map(b => b.textLabel);
        expect(buttonsWithCareer).toContain('Work');
    });

    test('updateStatsUI call should be optimized after refactor', () => {
        scene.showTab('CARE');
        scene.lastActionSignature = 'CARE:Feed|Play|Meditate';
        const initialButtons = scene.actionButtons;

        // Call updateStatsUI with same data/state
        const data = {
            nadagotchi: {
                stats: { hunger: 50, energy: 50, happiness: 50 },
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
