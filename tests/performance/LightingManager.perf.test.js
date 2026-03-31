import { jest } from '@jest/globals';
import { setupPhaserMock, createMockScene } from '../helpers/mockPhaser.js';
import { LightingManager } from '../../js/LightingManager.js';

setupPhaserMock();

describe('LightingManager Performance Benchmark', () => {
    let mockScene;
    let lightingManager;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.worldState = { time: 'Night' };
        mockScene.sprite = { x: 100, y: 100 };
        mockScene.npcScout = { x: 200, y: 200, visible: true };
        mockScene.npcArtisan = { x: 300, y: 300, visible: true };
        mockScene.npcVillager = { x: 400, y: 400, visible: true };

        lightingManager = new LightingManager(mockScene);
    });

    test('Benchmark: Rendering operations over 1000 frames', () => {
        const frames = 1000;
        const movementSpeed = 0.05;
        const rtDrawSpy = mockScene.add.renderTexture().draw;

        const startTime = Date.now();
        for (let i = 0; i < frames; i++) {
            mockScene.sprite.x += movementSpeed;
            mockScene.sprite.y += movementSpeed;
            lightingManager.update();
        }
        const duration = Date.now() - startTime;

        console.log(`[BENCHMARK] Lighting Total Duration: ${duration}ms`);
        expect(rtDrawSpy).toBeDefined();
    });
});
