import { jest } from '@jest/globals';
import { DebugConsole } from '../js/DebugConsole.js';
import { PersistenceManager } from '../js/PersistenceManager.js';
import { setupPhaserMock } from './helpers/mockPhaser.js';

describe('Security Reset Fix', () => {
    let mockScene;
    let debugConsole;
    let mockPersistence;

    beforeAll(() => {
        setupPhaserMock();
    });

    beforeEach(() => {
        // Setup mock environment
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
            key: jest.fn(),
            length: 0
            clear: jest.fn()
        };
        Object.defineProperty(global, 'localStorage', {
            value: localStorageMock,
            writable: true,
            configurable: true
        });

        global.confirm = jest.fn(() => true);

        mockPersistence = new PersistenceManager();
        jest.spyOn(mockPersistence, 'clearAllData');

        mockScene = {
            events: { on: jest.fn(), emit: jest.fn() },
            game: { events: { emit: jest.fn(), on: jest.fn() }, loop: { actualFps: 60 } },
            persistence: mockPersistence,
            worldClock: { update: jest.fn(), getCurrentPeriod: jest.fn().mockReturnValue('Day') },
            calendar: { advanceDay: jest.fn(), season: 'Spring', getDate: jest.fn().mockReturnValue({day: 1, year: 1}) },
            weatherSystem: { setWeather: jest.fn(), getCurrentWeather: jest.fn().mockReturnValue('Sunny') },
            eventManager: { getActiveEvent: jest.fn().mockReturnValue(null) },
            nadagotchi: {
                coins: 0,
                save: jest.fn(),
                stats: { hunger: 100, energy: 100, happiness: 100 },
                inventorySystem: { addItem: jest.fn() },
                unlockAllCareers: jest.fn(),
                inventory: {}
            },
            gameSettings: { gameSpeed: 1.0 },
            add: {
                graphics: jest.fn().mockReturnValue({
                    clear: jest.fn(),
                    destroy: jest.fn(),
                    lineStyle: jest.fn(),
                    strokeRect: jest.fn(),
                    setDepth: jest.fn().mockReturnThis()
                })
            },
            placedFurniture: {},
            currentRoom: 'Entryway'
        };

        debugConsole = new DebugConsole(mockScene);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    test('Hard Reset should call PersistenceManager.clearAllData and not localStorage.clear', () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const hardResetBtn = buttons.find(btn => btn.innerText.includes("Hard Reset (Wipe Save)"));

        expect(hardResetBtn).toBeDefined();

        // Spy on clearAllData
        const clearAllDataSpy = jest.spyOn(mockPersistence, 'clearAllData');

        // Execute action - catch expected JSDOM reload error
        try {
            hardResetBtn.click();
        } catch (e) {
            // Ignore 'Not implemented: navigation' error from JSDOM
        }

        // Verify targeted clear was called
        expect(clearAllDataSpy).toHaveBeenCalled();

        // Verify broad clear was NOT called
        expect(localStorage.clear).not.toHaveBeenCalled();
    });

    test('PersistenceManager.clearAllData should remove game-specific keys and ignore others', () => {
        // Setup localStorage with some keys
        const keys = [
            'nadagotchi_save',
            'nadagotchi_settings',
            'hall_of_fame',
            'other_app_data'
        ];

        localStorage.length = keys.length;
        localStorage.key.mockImplementation((i) => keys[i]);

        mockPersistence.clearAllData();

        expect(localStorage.removeItem).toHaveBeenCalledWith('nadagotchi_save');
        expect(localStorage.removeItem).toHaveBeenCalledWith('nadagotchi_settings');
        expect(localStorage.removeItem).toHaveBeenCalledWith('hall_of_fame');
        expect(localStorage.removeItem).not.toHaveBeenCalledWith('other_app_data');

        // Verify cache cleared
        expect(mockPersistence.lastSavedJson).toEqual({});
        const sections = [];
        const originalAddSection = DebugConsole.prototype.addSection;
        DebugConsole.prototype.addSection = function(title, buttons) {
            sections.push({ title, buttons });
            return originalAddSection.apply(this, arguments);
        };

        const consoleInstance = new DebugConsole(mockScene);
        const debugTools = sections.find(s => s.title === "Debug Tools");
        const hardReset = debugTools.buttons.find(b => b.label === "Hard Reset (Wipe Save)");

        expect(hardReset).toBeDefined();

        const actionStr = hardReset.action.toString();
        expect(actionStr).toContain('this.scene.persistence.clearAllData()');
        expect(actionStr).not.toContain('localStorage.clear()');

        DebugConsole.prototype.addSection = originalAddSection;
    });

    test('PersistenceManager.clearAllData should remove all game-specific keys', () => {
        mockPersistence.clearAllData();

        const expectedKeys = [
            "nadagotchi_save",
            "nadagotchi_journal",
            "nadagotchi_recipes",
            "nadagotchi_calendar",
            "nadagotchi_furniture",
            "nadagotchi_home_config",
            "nadagotchi_settings",
            "nadagotchi_achievements",
            "nadagotchi_wiki",
            "nadagotchi_dna_salt",
            "hall_of_fame",
            "nadagotchi_pet_v1"
        ];

        expectedKeys.forEach(key => {
            expect(localStorage.removeItem).toHaveBeenCalledWith(key);
        });
    });
});
