
import { LightingManager } from '../js/LightingManager';

describe('LightingManager', () => {
    let lightingManager;
    let mockScene;
    let mockLightImage;
    let mockLightTexture;

    beforeEach(() => {
        mockLightImage = {
            setVisible: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setBlendMode: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
        };

        mockLightTexture = {
            context: {
                globalCompositeOperation: 'source-over',
                fillStyle: '',
                fillRect: jest.fn(),
                createRadialGradient: jest.fn().mockReturnValue({
                    addColorStop: jest.fn()
                }),
            },
            width: 800,
            height: 600,
            refresh: jest.fn(),
            setSize: jest.fn()
        };

        mockScene = {
            scale: { width: 800, height: 600 },
            textures: {
                createCanvas: jest.fn().mockReturnValue(mockLightTexture)
            },
            add: {
                image: jest.fn().mockReturnValue(mockLightImage)
            },
            worldState: {
                time: 'Day'
            },
            location: 'GARDEN',
            sprite: { x: 100, y: 100 }
        };

        lightingManager = new LightingManager(mockScene);
    });

    test('should be invisible during Day', () => {
        mockScene.worldState.time = 'Day';
        lightingManager.update();
        expect(mockLightImage.setVisible).toHaveBeenCalledWith(false);
    });

    test('should be visible and draw during Night', () => {
        mockScene.worldState.time = 'Night';
        lightingManager.update();
        expect(mockLightImage.setVisible).toHaveBeenCalledWith(true);
        // Verify drawing logic (e.g. fillRect called)
        expect(mockLightTexture.context.fillRect).toHaveBeenCalled();
    });

    test('should be visible and draw during Dusk', () => {
        mockScene.worldState.time = 'Dusk';
        lightingManager.update();
        expect(mockLightImage.setVisible).toHaveBeenCalledWith(true);
    });

    test('should be invisible when INDOOR even if Night', () => {
        mockScene.worldState.time = 'Night';
        mockScene.location = 'INDOOR';
        lightingManager.update();
        expect(mockLightImage.setVisible).toHaveBeenCalledWith(false);
    });
});
