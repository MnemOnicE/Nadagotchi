
import { jest } from '@jest/globals';
import { SkyManager } from '../../js/SkyManager.js';
import { WorldClock } from '../../js/WorldClock.js';
import { setupPhaserMock } from '../helpers/mockPhaser.js';

describe('SkyManager Performance', () => {
    let scene;
    let skyManager;
    let worldClock;
    let mockContext;
    let mockTexture;

    beforeEach(() => {
        setupPhaserMock();

        mockContext = {
            createLinearGradient: jest.fn().mockReturnValue({
                addColorStop: jest.fn()
            }),
            fillStyle: '',
            fillRect: jest.fn()
        };

        mockTexture = {
            context: mockContext,
            width: 800,
            height: 600,
            clear: jest.fn(),
            refresh: jest.fn(),
            setSize: jest.fn(),
            destroy: jest.fn() // Add destroy method
        };

        scene = new Phaser.Scene({});
        scene.textures = {
            createCanvas: jest.fn().mockReturnValue(mockTexture)
        };
        scene.add = {
            image: jest.fn().mockReturnValue({
                setOrigin: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setVisible: jest.fn().mockReturnThis(), // Add setVisible mock
                destroy: jest.fn() // Add destroy method
            })
        };
        scene.scale = { width: 800, height: 600 };

        worldClock = new WorldClock(scene);
        scene.worldClock = worldClock;

        skyManager = new SkyManager(scene);
    });

    test('measures redraw count over a simulated day', () => {
        // Reset mocks to clear initialization calls
        mockContext.createLinearGradient.mockClear();
        mockContext.fillRect.mockClear();
        mockTexture.clear.mockClear();

        // Simulate a full day (420 seconds at 60fps)
        // 420 seconds * 60 fps = 25200 frames
        const totalFrames = 420 * 60;
        const delta = 1000 / 60; // ~16.67ms

        for (let i = 0; i < totalFrames; i++) {
            worldClock.update(delta);
            skyManager.update();
        }

        const redrawCount = mockContext.createLinearGradient.mock.calls.length;

        // The optimized redraw count should be significantly lower than the baseline.
        // Based on the PR, this should be around 838, down from ~5000.
        // This assertion will help catch performance regressions.
        expect(redrawCount).toBeLessThan(1000);
    });
});
