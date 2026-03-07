import { jest } from '@jest/globals';
import { setupPhaserMock } from './helpers/mockPhaser';
import { DebugConsole } from '../js/DebugConsole';

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
            worldClock: { update: jest.fn(), gameSpeed: 1, getCurrentPeriod: jest.fn().mockReturnValue('Day') },
            calendar: { advanceDay: jest.fn(), getDate: jest.fn().mockReturnValue({ year: 1, season: 'Spring', day: 1 }) },
            weatherSystem: { setWeather: jest.fn(), getCurrentWeather: jest.fn().mockReturnValue('Sunny') },
            eventManager: { getActiveEvent: jest.fn().mockReturnValue(null) },
            nadagotchi: {
                coins: 0,
                save: jest.fn(),
                stats: {},
                inventorySystem: { addItem: jest.fn() },
                unlockAllCareers: jest.fn(),
                inventory: {}
            },
            add: {
                graphics: jest.fn().mockReturnValue({
                    setDepth: jest.fn().mockReturnThis(),
                    clear: jest.fn().mockReturnThis(),
                    lineStyle: jest.fn().mockReturnThis(),
                    strokeRect: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })
            },
            children: { list: [] },
            refreshGame: jest.fn()
        };

        // Reset DOM before each test
        document.body.innerHTML = '';

        // Mock global window prompt/alert/confirm
        window.prompt = jest.fn();
        window.alert = jest.fn();
        window.confirm = jest.fn().mockReturnValue(true);
    });

    test('should create debug toggle button', () => {
        debugConsole = new DebugConsole(mockScene);
        const toggleBtn = document.getElementById('debug-toggle');
        expect(toggleBtn).toBeDefined();
    });

    test('should use showToast for +1000 Coins button instead of alert', () => {
        debugConsole = new DebugConsole(mockScene);

        // Find the button
        const buttons = Array.from(document.querySelectorAll('button'));
        const coinButton = buttons.find(btn => btn.innerText.includes("+1000 Coins"));

        expect(coinButton).toBeDefined();

        // Click the button
        coinButton.click();

        // Verify alert was NOT called (it is currently called, so this test fails initially)
        // And verify showToast WAS called
        expect(window.alert).not.toHaveBeenCalled();
        expect(mockUIScene.showToast).toHaveBeenCalled();
    });

    test('should use showToast for addAllItems', () => {
        debugConsole = new DebugConsole(mockScene);
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.innerText.includes("+10 All Items"));
        expect(btn).toBeDefined();

        btn.click();
        expect(mockUIScene.showToast).toHaveBeenCalled();
    });

    test('should use showToast for toggleBounds', () => {
        debugConsole = new DebugConsole(mockScene);
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.innerText.includes("Toggle Hitbox Bounds"));
        expect(btn).toBeDefined();

        btn.click();
        expect(mockUIScene.showToast).toHaveBeenCalled();
    });
});