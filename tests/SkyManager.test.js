import { jest } from '@jest/globals';
import { setupPhaserMock, mockGameObject } from './helpers/mockPhaser';

// Setup global phaser mock
setupPhaserMock();

// Enhance Display.Color to behave nicely with the SkyManager's expectations
global.Phaser.Display.Color = class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
};

global.Phaser.Display.Color.Interpolate = {
    ColorWithColor: jest.fn().mockImplementation((color1, color2, length, index) => {
        return new global.Phaser.Display.Color(
            Math.round(color1.r + (color2.r - color1.r) * index),
            Math.round(color1.g + (color2.g - color1.g) * index),
            Math.round(color1.b + (color2.b - color1.b) * index)
        );
    })
};

// Import after globals are set
const { SkyManager } = require('../js/SkyManager');

describe('SkyManager', () => {
    let mockScene;
    let skyManager;
    let mockTextureContext;
    let mockCanvasTexture;

    beforeEach(() => {
        mockTextureContext = {
            createLinearGradient: jest.fn().mockReturnValue({
                addColorStop: jest.fn()
            }),
            fillRect: jest.fn(),
            fillStyle: ''
        };

        mockCanvasTexture = mockGameObject();
        mockCanvasTexture.context = mockTextureContext;
        mockCanvasTexture.width = 800;
        mockCanvasTexture.height = 600;
        mockCanvasTexture.clear = jest.fn();
        mockCanvasTexture.refresh = jest.fn();
        mockCanvasTexture.setSize = jest.fn();

        mockScene = new global.Phaser.Scene();
        mockScene.scale = { width: 800, height: 600 };
        mockScene.textures.createCanvas = jest.fn().mockReturnValue(mockCanvasTexture);
        mockScene.add.image = jest.fn().mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setVisible: jest.fn()
        });

        mockScene.worldClock = {
            getDaylightFactor: jest.fn().mockReturnValue(0.5),
            getCurrentPeriod: jest.fn().mockReturnValue('Day')
        };
        mockScene.time = { now: 0 };

        skyManager = new SkyManager(mockScene);
    });

    test('constructor should initialize correctly', () => {
        expect(mockScene.textures.createCanvas).toHaveBeenCalledWith('sky', 800, 600);
        expect(skyManager.stars).toHaveLength(100);
        expect(skyManager.lastDaylightFactor).toBe(-1);
    });

    test('update should skip drawing if no context', () => {
        skyManager.skyTexture = null;
        skyManager.update();
        expect(mockTextureContext.fillRect).not.toHaveBeenCalled();
    });

    test('update should redraw on first call', () => {
        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
        expect(mockTextureContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
        expect(mockCanvasTexture.refresh).toHaveBeenCalled();
        expect(skyManager.lastDaylightFactor).toBe(0.5);
    });

    test('update should not redraw if factor change is small and time change is small', () => {
        skyManager.update(); // first draw
        mockCanvasTexture.clear.mockClear();

        mockScene.worldClock.getDaylightFactor.mockReturnValue(0.505); // change < 0.01
        mockScene.time.now = 1000; // time < 3000

        skyManager.update();
        expect(mockCanvasTexture.clear).not.toHaveBeenCalled();
    });

    test('update should redraw if factor change is significant', () => {
        skyManager.update(); // first draw
        mockCanvasTexture.clear.mockClear();

        mockScene.worldClock.getDaylightFactor.mockReturnValue(0.6); // change >= 0.01
        mockScene.time.now = 1000;

        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
    });

    test('update should redraw if time has elapsed sufficiently', () => {
        skyManager.update(); // first draw
        mockCanvasTexture.clear.mockClear();

        mockScene.worldClock.getDaylightFactor.mockReturnValue(0.505); // change < 0.01
        mockScene.time.now = 4000; // time >= 3000

        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
    });

    test('update should handle Dawn period', () => {
        mockScene.worldClock.getCurrentPeriod.mockReturnValue('Dawn');
        mockScene.worldClock.getDaylightFactor.mockReturnValue(0.5);
        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
    });

    test('update should handle Dusk period', () => {
        mockScene.worldClock.getCurrentPeriod.mockReturnValue('Dusk');
        mockScene.worldClock.getDaylightFactor.mockReturnValue(0.5);
        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
    });

    test('update should handle Day period with daylight factor 1', () => {
        mockScene.worldClock.getCurrentPeriod.mockReturnValue('Day');
        mockScene.worldClock.getDaylightFactor.mockReturnValue(1);
        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
    });

    test('update should handle Date.now() fallback if scene.time is missing', () => {
        mockScene.time = undefined;
        // Mock Date.now
        const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(5000);
        skyManager.update();
        expect(mockCanvasTexture.clear).toHaveBeenCalled();
        expect(skyManager.lastUpdateTimestamp).toBe(5000);
        dateSpy.mockRestore();
    });

    test('update should draw stars at night', () => {
        mockScene.worldClock.getCurrentPeriod.mockReturnValue('Night');
        mockScene.worldClock.getDaylightFactor.mockReturnValue(0.2); // < 0.5 triggers stars
        skyManager.update();

        // 1 fillRect for sky + 100 fillRects for stars
        expect(mockTextureContext.fillRect).toHaveBeenCalledTimes(101);
    });

    test('resize should update texture size and force redraw', () => {
        skyManager.resize(1024, 768);
        expect(mockCanvasTexture.setSize).toHaveBeenCalledWith(1024, 768);
        expect(skyManager.lastDaylightFactor).toBe(0.5); // was reset to -1 then updated to 0.5
    });

    test('resize should gracefully handle missing texture', () => {
        skyManager.skyTexture = null;
        skyManager.resize(1024, 768); // Should not throw
    });

    test('setVisible should update image visibility', () => {
        skyManager.setVisible(true);
        expect(skyManager.skyImage.setVisible).toHaveBeenCalledWith(true);

        skyManager.setVisible(false);
        expect(skyManager.skyImage.setVisible).toHaveBeenCalledWith(false);
    });

    test('setVisible should gracefully handle missing image', () => {
        skyManager.skyImage = null;
        skyManager.setVisible(true); // Should not throw
    });
});
