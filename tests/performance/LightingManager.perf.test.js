import { jest } from '@jest/globals';
import { setupPhaserMock, createMockScene } from '../helpers/mockPhaser.js';
import { LightingManager } from '../../js/LightingManager.js';

setupPhaserMock();

describe('LightingManager Performance Benchmark', () => {
    let mockScene;
    let lightingManager;

    beforeEach(() => {
        mockScene = createMockScene();
        // Force cookie creation for the benchmark
        mockScene.textures.exists.mockReturnValue(false);

        mockScene.worldState = { time: 'Night' };
        mockScene.sprite = { x: 100, y: 100 };
        mockScene.npcScout = { x: 200, y: 200, visible: true };
        mockScene.npcArtisan = { x: 300, y: 300, visible: true };
        mockScene.npcVillager = { x: 400, y: 400, visible: true };

        lightingManager = new LightingManager(mockScene);
    });

    test('Benchmark: Rendering operations over 1000 frames', () => {
        const frames = 1000;
        const movementSpeed = 0.05; // 0.05px movement per frame (Jitter/Slow movement)

        // Spies
        const rtDrawSpy = lightingManager.renderTexture.draw;
        const rtFillSpy = lightingManager.renderTexture.fill;
        const fillRectSpy = mockScene.textures.createCanvas.mock.results[0].value.context.fillRect;

        const startTime = Date.now();
        for (let i = 0; i < frames; i++) {
            // Move player slightly
            mockScene.sprite.x += movementSpeed;
            mockScene.sprite.y += movementSpeed;
            lightingManager.update();
        }
        const duration = Date.now() - startTime;

        console.log(`[BENCHMARK] Lighting Total Duration: ${duration}ms`);
        console.log(`[BENCHMARK] Canvas fillRect calls (Cookie Generation): ${fillRectSpy.mock.calls.length}`);
        console.log(`[BENCHMARK] RenderTexture fill calls (Clears): ${rtFillSpy.mock.calls.length}`);
        console.log(`[BENCHMARK] RenderTexture draw calls (Lights): ${rtDrawSpy.mock.calls.length}`);

        // With 0.05 movement and 0.1 threshold:
        // It should update roughly every 3 frames (0.05 * 3 = 0.15 > 0.1).
        // Without optimization: 1000 frames * 4 lights = 4000 draw calls.
        // With optimization: ~333 updates * 4 lights = ~1332 draw calls.

        expect(rtDrawSpy.mock.calls.length).toBeGreaterThan(0);
        expect(rtDrawSpy.mock.calls.length).toBeLessThan(2000); // Validates optimization
        expect(rtFillSpy.mock.calls.length).toBeLessThan(500); // Allow some headroom for initial frames
        expect(fillRectSpy.mock.calls.length).toBe(1); // Only once!

        expect(rtDrawSpy).toBeDefined();
    });
});
