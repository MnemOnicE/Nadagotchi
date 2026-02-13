import { jest } from '@jest/globals';
import { setupPhaserMock } from './helpers/mockPhaser.js';
import { WeatherParticleManager } from '../js/WeatherParticleManager.js';

describe('WeatherParticleManager', () => {
    let scene;
    let manager;
    let mockEmitter;

    beforeEach(() => {
        setupPhaserMock();

        // Extend Mock for Geom
        global.Phaser.Geom = {
            Rectangle: class Rectangle {
                constructor(x, y, width, height) {
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                }
            }
        };

        mockEmitter = {
            start: jest.fn(),
            stop: jest.fn(),
            setQuantity: jest.fn(),
            setPosition: jest.fn(),
            setEmitZone: jest.fn(),
            setBounds: jest.fn(),
            // Properties accessed by code
            speedY: {},
        };

        const mockParticles = {
            setDepth: jest.fn().mockReturnThis(),
            createEmitter: jest.fn().mockReturnValue(mockEmitter)
        };

        scene = {
            add: {
                particles: jest.fn().mockReturnValue(mockParticles)
            },
            scale: { width: 800, height: 600 }
        };

        manager = new WeatherParticleManager(scene);
    });

    test('resize updates emitter zone using correct API', () => {
        const width = 1024;
        const height = 768;

        manager.resize(width, height);

        // Verify setPosition is called (legacy behavior kept)
        expect(mockEmitter.setPosition).toHaveBeenCalledWith(0, -10);

        // Verify setEmitZone is called with correct source
        // Note: The current code (pre-refactor) sets `emitZone` property directly.
        // This test expects the refactored behavior (setEmitZone call).
        // Since I haven't refactored yet, this test should FAIL initially if I ran it now.
        expect(mockEmitter.setEmitZone).toHaveBeenCalledWith(expect.objectContaining({
            source: expect.any(global.Phaser.Geom.Rectangle)
        }));

        const callArgs = mockEmitter.setEmitZone.mock.calls[0][0];
        const rect = callArgs.source;
        expect(rect.width).toBe(width);
        expect(rect.height).toBe(1);
        expect(rect.x).toBe(0);
        expect(rect.y).toBe(-10);
    });
});
