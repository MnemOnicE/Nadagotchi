import { jest } from '@jest/globals';
import { DebugConsole } from '../js/DebugConsole.js';
import { setupPhaserMock, createMockScene } from './helpers/mockPhaser.js';

describe('DebugConsole', () => {
    let debugConsole;
    let mockScene;
    let mockUIScene;

    beforeAll(() => {
        setupPhaserMock();
    });

    beforeEach(() => {
        mockUIScene = { showToast: jest.fn() };
        mockScene = createMockScene();
        mockScene.scene.get.mockReturnValue(mockUIScene);

        // Mock window.alert
        window.alert = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    test('should use showToast for +1000 Coins button instead of alert', () => {
        debugConsole = new DebugConsole(mockScene);
        const coinButton = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.innerText.includes("+1000 Coins"));

        expect(coinButton).toBeDefined();
        coinButton.click();

        expect(window.alert).not.toHaveBeenCalled();
        expect(mockUIScene.showToast).toHaveBeenCalledWith("Added Coins", "+1000 Coins", "💰");
        expect(mockScene.nadagotchi.save).toHaveBeenCalled();
    });

    test('should use showToast for addAllItems', () => {
        debugConsole = new DebugConsole(mockScene);
        const btn = Array.from(document.querySelectorAll('button'))
            .find(b => b.innerText.includes("+10 All Items"));
        expect(btn).toBeDefined();
        btn.click();
        expect(mockUIScene.showToast).toHaveBeenCalledWith("Added Items", expect.any(String), expect.any(String));
    });

    test('should use showToast for toggleBounds', () => {
        debugConsole = new DebugConsole(mockScene);
        const btn = Array.from(document.querySelectorAll('button'))
            .find(b => b.innerText.includes("Toggle Hitbox Bounds"));
        expect(btn).toBeDefined();
        btn.click();
        expect(mockUIScene.showToast).toHaveBeenCalledWith(expect.stringContaining("Bounds"), expect.any(String), expect.any(String));
    });
});
