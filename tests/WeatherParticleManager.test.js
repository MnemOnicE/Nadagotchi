
import { setupPhaserMock, createMockAdd } from './helpers/mockPhaser';

// Mock dependencies
setupPhaserMock();

const { WeatherParticleManager } = require('../js/WeatherParticleManager');

describe('WeatherParticleManager', () => {
    let scene;
    let manager;
    let mockEmitter;

    beforeEach(() => {
        // Mock add.particles behavior to capture the emitter
        mockEmitter = {
            start: jest.fn(),
            stop: jest.fn(),
            setPosition: jest.fn(),
            setDepth: jest.fn().mockReturnThis(),
            setEmitZone: jest.fn().mockReturnThis(),
            setBounds: jest.fn().mockReturnThis(),
            setQuantity: jest.fn().mockReturnThis(),
            setFrequency: jest.fn().mockReturnThis(),
            emitZone: null // Initially null or undefined
        };

        const mockParticleManager = {
            setDepth: jest.fn().mockReturnThis(),
            createEmitter: jest.fn().mockReturnValue(mockEmitter)
        };

        const mockAdd = createMockAdd();
        mockAdd.particles = jest.fn().mockReturnValue(mockParticleManager);

        scene = new Phaser.Scene({});
        scene.add = mockAdd;
        scene.scale = { width: 800, height: 600 }; // Mock scale

        manager = new WeatherParticleManager(scene);
    });

    test('should create emitters on initialization', () => {
        expect(scene.add.particles).toHaveBeenCalledTimes(3); // Rain, Snow, Leaf
        expect(manager.emitters.rain).toBeDefined();
        expect(manager.emitters.snow).toBeDefined();
        expect(manager.emitters.leaf).toBeDefined();
    });

    test('resize should update emitter position and emit zone using setEmitZone', () => {
        const newWidth = 1000;
        const newHeight = 800;

        manager.resize(newWidth, newHeight);

        // Verify setPosition called for all emitters
        Object.values(manager.emitters).forEach(emitter => {
            expect(emitter.setPosition).toHaveBeenCalledWith(0, -10);

            // The goal is to replace the direct assignment with setEmitZone
            // But currently the code does direct assignment.
            // So this test is expected to fail or pass depending on implementation state.
            // Since we haven't implemented the fix yet, let's see what happens.
            // The current code does: e.emitZone = { ... }
            // So setEmitZone should NOT be called yet.
        });

        // Verify setEmitZone is called with the expected shape
        Object.values(manager.emitters).forEach(emitter => {
             expect(emitter.setEmitZone).toHaveBeenCalledWith(expect.objectContaining({
                 source: expect.objectContaining({
                     width: newWidth
                 })
             }));
        });

        // Also check setBounds for rain
        expect(manager.emitters.rain.setBounds).toHaveBeenCalledWith(0, 0, newWidth, newHeight);
    });
});
