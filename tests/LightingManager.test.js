import { jest } from '@jest/globals';
import { LightingManager } from '../js/LightingManager';

describe('LightingManager', () => {
    let lightingManager;
    let mockScene;
    let mockRenderTexture;
    let mockDummyLight;
    let mockCanvasTexture;

    beforeEach(() => {
        // Mock RenderTexture
        mockRenderTexture = {
            setVisible: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setBlendMode: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            fill: jest.fn().mockReturnThis(),
            draw: jest.fn().mockReturnThis(),
            resize: jest.fn().mockReturnThis(),
            clear: jest.fn().mockReturnThis()
        };

        // Mock Dummy Light (Image)
        mockDummyLight = {
            setOrigin: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis()
        };

        // Mock Canvas Texture (for Cookie)
        mockCanvasTexture = {
            context: {
                createRadialGradient: jest.fn(() => ({
                    addColorStop: jest.fn()
                })),
                fillRect: jest.fn(),
                fillStyle: ''
            },
            refresh: jest.fn()
        };

        // Mock Scene
        mockScene = {
            scale: { width: 800, height: 600 },
            textures: {
                exists: jest.fn().mockReturnValue(false),
                createCanvas: jest.fn().mockReturnValue(mockCanvasTexture)
            },
            add: {
                renderTexture: jest.fn().mockReturnValue(mockRenderTexture)
            },
            make: {
                image: jest.fn().mockReturnValue(mockDummyLight)
            },
            worldState: {
                time: 'Day'
            },
            location: 'GARDEN',
            sprite: { x: 100, y: 100 },
            // NPCs
            npcScout: { x: 200, y: 200, visible: true },
            npcArtisan: { x: 300, y: 300, visible: true },
            npcVillager: { x: 400, y: 400, visible: true }
        };

        lightingManager = new LightingManager(mockScene);
    });

    test('should initialize and create light cookie if missing', () => {
        expect(mockScene.textures.exists).toHaveBeenCalledWith('light_soft');
        expect(mockScene.textures.createCanvas).toHaveBeenCalledWith('light_soft', 512, 512);
        // Verify render texture creation with scaled size (0.5)
        expect(mockScene.add.renderTexture).toHaveBeenCalledWith(0, 0, 400, 300);
        expect(mockRenderTexture.setScale).toHaveBeenCalledWith(2); // 1 / 0.5
    });

    test('should be invisible during Day', () => {
        mockScene.worldState.time = 'Day';
        lightingManager.update();
        expect(mockRenderTexture.setVisible).toHaveBeenCalledWith(false);
    });

    test('should be visible and draw during Night', () => {
        mockScene.worldState.time = 'Night';
        lightingManager.update();
        expect(mockRenderTexture.setVisible).toHaveBeenCalledWith(true);
        // Verify drawing logic
        expect(mockRenderTexture.fill).toHaveBeenCalledWith(0x000000, 1);
        expect(mockRenderTexture.draw).toHaveBeenCalled();
    });

    test('should be visible during Dusk', () => {
        mockScene.worldState.time = 'Dusk';
        lightingManager.update();
        expect(mockRenderTexture.setVisible).toHaveBeenCalledWith(true);
    });

    test('should be invisible when INDOOR even if Night', () => {
        mockScene.worldState.time = 'Night';
        mockScene.location = 'INDOOR';
        lightingManager.update();
        expect(mockRenderTexture.setVisible).toHaveBeenCalledWith(false);
    });

    test('should not redraw if movement is small (Hysteresis)', () => {
        mockScene.worldState.time = 'Night';

        // First update (Initial draw)
        lightingManager.update();
        expect(mockRenderTexture.draw).toHaveBeenCalledTimes(4); // 4 lights
        mockRenderTexture.draw.mockClear();
        mockRenderTexture.fill.mockClear();

        // Move slightly (0.05px) < Threshold (0.1)
        mockScene.sprite.x += 0.05;
        lightingManager.update();

        // Should NOT redraw
        expect(mockRenderTexture.fill).not.toHaveBeenCalled();
        expect(mockRenderTexture.draw).not.toHaveBeenCalled();
    });

    test('should redraw if movement is significant', () => {
        mockScene.worldState.time = 'Night';

        // First update
        lightingManager.update();
        mockRenderTexture.draw.mockClear();
        mockRenderTexture.fill.mockClear();

        // Move significantly (0.2px) > Threshold (0.1)
        mockScene.sprite.x += 0.2;
        lightingManager.update();

        // Should Redraw
        expect(mockRenderTexture.fill).toHaveBeenCalled();
        expect(mockRenderTexture.draw).toHaveBeenCalled();
    });

    test('should resize render texture correctly', () => {
        lightingManager.resize(1000, 800);
        // Expect scaled resize
        expect(mockRenderTexture.resize).toHaveBeenCalledWith(500, 400); // 1000*0.5, 800*0.5
        expect(mockRenderTexture.setScale).toHaveBeenCalledWith(2);
    });
});
