
import { jest } from '@jest/globals';
import { DebugConsole } from '../js/DebugConsole.js';
import { setupPhaserMock } from './helpers/mockPhaser.js';

describe('DebugConsole', () => {
    let debugConsole;
    let mockScene;
    let mockUIScene;

    beforeAll(() => {
        setupPhaserMock();
    });

    beforeEach(() => {
        mockUIScene = {
            showToast: jest.fn()
        };

        mockScene = {
            events: { on: jest.fn(), emit: jest.fn() },
            game: { events: { emit: jest.fn(), on: jest.fn() }, loop: { actualFps: 60 } },
            scene: {
                get: jest.fn().mockReturnValue(mockUIScene)
            },
            worldClock: { update: jest.fn(), getCurrentPeriod: jest.fn().mockReturnValue('Day') },
            calendar: { advanceDay: jest.fn(), season: 'Spring', getDate: jest.fn().mockReturnValue({day: 1, year: 1}) },
            weatherSystem: { setWeather: jest.fn(), getCurrentWeather: jest.fn().mockReturnValue('Sunny') },
            eventManager: { getActiveEvent: jest.fn().mockReturnValue(null) },
            nadagotchi: {
                stats: {},
                inventorySystem: { addItem: jest.fn() },
                unlockAllCareers: jest.fn(),
                inventory: {}
            },
            gameSettings: {},
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

        // Mock window.alert
        window.alert = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    test('should use showToast for +1000 Coins button instead of alert', () => {
        debugConsole = new DebugConsole(mockScene);

        // Find the button
        const buttons = Array.from(document.querySelectorAll('button'));
        const coinButton = buttons.find(btn => btn.innerText.includes("+1000 Coins"));

        expect(coinButton).toBeDefined();

        // Execute click
        coinButton.click();

        // Verify alert was NOT called (it is currently called, so this test fails initially)
        // And verify showToast WAS called
        expect(window.alert).not.toHaveBeenCalled();
        expect(mockUIScene.showToast).toHaveBeenCalledWith("Not Implemented", expect.stringContaining("No currency system"), expect.any(String));
    });

    test('should use showToast for addAllItems', () => {
        debugConsole = new DebugConsole(mockScene);
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.innerText.includes("+10 All Items"));
        expect(btn).toBeDefined();

        btn.click();

        expect(window.alert).not.toHaveBeenCalled();
        expect(mockUIScene.showToast).toHaveBeenCalledWith("Added Items", expect.any(String), expect.any(String));
    });

    test('should use showToast for toggleBounds', () => {
        debugConsole = new DebugConsole(mockScene);
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.innerText.includes("Toggle Hitbox Bounds"));
        expect(btn).toBeDefined();

        btn.click();

        expect(window.alert).not.toHaveBeenCalled();
        expect(mockUIScene.showToast).toHaveBeenCalledWith(expect.stringContaining("Bounds"), expect.any(String), expect.any(String));
    });
});
