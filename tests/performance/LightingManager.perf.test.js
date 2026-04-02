import { jest } from '@jest/globals';
import { setupPhaserMock, mockGameObject } from '../helpers/mockPhaser';

setupPhaserMock();

import { LightingManager } from '../../js/LightingManager';

describe('LightingManager Performance Benchmark', () => {
    let scene;
    let lightingManager;
    let mockLightTexture;
    let mockLightImage;
    let mockRenderTexture;
    let mockDummyLight;

    beforeEach(() => {
        jest.clearAllMocks();

        // --- Mock Setup for Canvas (Legacy/Cookie) ---
        mockLightTexture = {
            context: {
                globalCompositeOperation: 'source-over',
                fillStyle: '',
                fillRect: jest.fn(),
                createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
            },
            width: 800,
            height: 600,
            refresh: jest.fn(),
            setSize: jest.fn()
        };

        mockLightImage = {
            ...mockGameObject(),
            setBlendMode: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis()
        };

        // --- Mock Setup for RenderTexture (New Implementation) ---
        mockRenderTexture = {
            ...mockGameObject(),
            draw: jest.fn(),
            clear: jest.fn(),
            fill: jest.fn(),
            setBlendMode: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            beginDraw: jest.fn(),
            endDraw: jest.fn(),
            setScrollFactor: jest.fn().mockReturnThis()
        };

        // --- Mock Dummy Light ---
        mockDummyLight = {
             ...mockGameObject(),
             setOrigin: jest.fn().mockReturnThis(),
             setScale: jest.fn().mockReturnThis(),
             setPosition: jest.fn().mockReturnThis()
        };

        // --- Scene Setup ---
        scene = new global.Phaser.Scene();
        scene.scale = { width: 800, height: 600 };
        scene.worldState = { time: 'Night' }; // Force Night
        scene.location = 'GARDEN';
        scene.sprite = { x: 100, y: 100 }; // Player

        // Mock NPCs
        scene.npcScout = { x: 200, y: 200, visible: true };
        scene.npcArtisan = { x: 300, y: 300, visible: true };
        scene.npcVillager = { x: 400, y: 400, visible: true };

        // Mock Textures Manager
        scene.textures = {
            createCanvas: jest.fn(() => mockLightTexture),
            addGraphics: jest.fn(),
            get: jest.fn().mockReturnValue({ key: 'light_soft' }),
            exists: jest.fn().mockReturnValue(false)
        };

        // Mock Add Factory
        scene.add = {
            image: jest.fn(() => mockLightImage),
            renderTexture: jest.fn(() => mockRenderTexture),
            graphics: jest.fn(() => ({
                fillCircle: jest.fn(),
                generateTexture: jest.fn(),
                destroy: jest.fn(),
                clear: jest.fn()
            }))
        };

        // Mock Make Factory
        scene.make = {
            graphics: jest.fn(() => ({
                fillGradientStyle: jest.fn(),
                fillCircle: jest.fn(),
                generateTexture: jest.fn(),
                destroy: jest.fn(),
                clear: jest.fn()
            })),
            image: jest.fn(() => mockDummyLight)
        };

        // Instantiate
        lightingManager = new LightingManager(scene);
    });

    test('Benchmark: Rendering operations over 1000 frames with micro-movement', () => {
        const frames = 1000;
        const movementSpeed = 0.05; // 0.05px movement per frame (Jitter/Slow movement)

        // Spies
        const fillRectSpy = mockLightTexture.context.fillRect; // Used for Cookie generation
        const rtDrawSpy = mockRenderTexture.draw;
        const rtFillSpy = mockRenderTexture.fill;

        const startTime = Date.now();

        for (let i = 0; i < frames; i++) {
            // Move player slightly
            scene.sprite.x += movementSpeed;
            scene.sprite.y += movementSpeed;

            // Update Lighting
            lightingManager.update();
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`[BENCHMARK] Total Duration: ${duration}ms`);
        console.log(`[BENCHMARK] Canvas fillRect calls (Cookie Generation): ${fillRectSpy.mock.calls.length}`);
        console.log(`[BENCHMARK] RenderTexture fill calls (Clears): ${rtFillSpy.mock.calls.length}`);
        console.log(`[BENCHMARK] RenderTexture draw calls (Lights): ${rtDrawSpy.mock.calls.length}`);

        // With 0.05 movement and 0.1 threshold:
        // It should update roughly every 3 frames.
        // Expect calls < 4000 (total frames * 4 lights).
        // Actual expectation: ~1333 calls.

        expect(rtDrawSpy.mock.calls.length).toBeGreaterThan(0);
        expect(rtDrawSpy.mock.calls.length).toBeLessThan(3500);
        expect(fillRectSpy.mock.calls.length).toBe(1); // Only once!
    });
});
