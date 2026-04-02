
import { jest } from '@jest/globals';
import { setupPhaserMock, mockGameObject } from '../helpers/mockPhaser';

setupPhaserMock();

const { SkyManager } = require('../../js/SkyManager');

describe('SkyManager Performance Benchmark', () => {
    let scene;
    let skyManager;
    let mockWorldClock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockWorldClock = {
            getDaylightFactor: jest.fn(),
            getCurrentPeriod: jest.fn()
        };

        scene = new global.Phaser.Scene();
        scene.worldClock = mockWorldClock;
        scene.textures = {
            createCanvas: jest.fn(() => {
                const canvas = mockGameObject();
                // Ensure context is mocked with spies
                canvas.context = {
                    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    fillRect: jest.fn()
                };
                canvas.clear = jest.fn();
                canvas.refresh = jest.fn();
                return canvas;
            })
        };
        scene.add = {
            image: jest.fn(() => mockGameObject())
        };
        scene.scale = { width: 800, height: 600 };
        scene.time = { now: 0 };

        skyManager = new SkyManager(scene);
    });

    test('Benchmark: Canvas operations during slow daylight transition', () => {
        const iterations = 1000;

        const canvas = skyManager.skyTexture;
        const ctx = canvas.context;

        // Spy on operations
        const clearSpy = jest.spyOn(canvas, 'clear');
        const gradientSpy = jest.spyOn(ctx, 'createLinearGradient');
        const fillRectSpy = jest.spyOn(ctx, 'fillRect');
        const refreshSpy = jest.spyOn(canvas, 'refresh');

        // Simulate a slow transition (0.001 per frame)
        // Without optimization: 1001 redraws
        // With optimization (0.01 threshold): ~101 redraws
        for (let i = 0; i <= iterations; i++) {
            const factor = i / iterations; // 0.0 to 1.0
            mockWorldClock.getDaylightFactor.mockReturnValue(factor);

            if (factor < 0.3) mockWorldClock.getCurrentPeriod.mockReturnValue('Night');
            else if (factor < 0.7) mockWorldClock.getCurrentPeriod.mockReturnValue('Dawn');
            else mockWorldClock.getCurrentPeriod.mockReturnValue('Day');

            scene.time.now += 16; // Simulate 16ms per frame
            skyManager.update();
        }

        const totalOps = clearSpy.mock.calls.length +
                         gradientSpy.mock.calls.length +
                         fillRectSpy.mock.calls.length +
                         refreshSpy.mock.calls.length;

        console.log(`[OPTIMIZED] Total canvas operations for ${iterations} transitions: ${totalOps}`);

        // Expect roughly iterations / 10 redraws
        // 1000 * 0.001. Threshold is 0.01.
        // It should redraw at 0.0, 0.01, 0.02 ... 1.0.
        // That is 101 redraws.
        expect(clearSpy.mock.calls.length).toBeLessThan(200);
        expect(clearSpy.mock.calls.length).toBeGreaterThan(90);
    });
});
