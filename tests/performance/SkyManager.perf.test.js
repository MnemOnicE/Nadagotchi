import { jest } from '@jest/globals';
import { setupPhaserMock, createMockScene } from '../helpers/mockPhaser.js';
import { SkyManager } from '../../js/SkyManager.js';

setupPhaserMock();

describe('SkyManager Performance Benchmark', () => {
    let mockScene;
    let skyManager;

    beforeEach(() => {
        mockScene = createMockScene();
        skyManager = new SkyManager(mockScene);
    });

    test('Benchmark: Canvas operations during slow daylight transition', () => {
        const iterations = 1000;
        const canvas = skyManager.skyTexture;
        const clearSpy = jest.spyOn(canvas, 'clear');

        for (let i = 0; i <= iterations; i++) {
            const factor = i / iterations;
            mockScene.worldClock.getDaylightFactor.mockReturnValue(factor);
            skyManager.update();
        }

        console.log(`[OPTIMIZED] Sky total redraws for ${iterations} transitions: ${clearSpy.mock.calls.length}`);
        expect(clearSpy.mock.calls.length).toBeLessThan(200);
    });
});
