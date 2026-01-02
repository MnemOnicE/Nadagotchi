
import { jest } from '@jest/globals';

// Mock Phaser Global
global.Phaser = {
    Scene: class {
        constructor(config) {
            this.events = { on: jest.fn(), emit: jest.fn(), off: jest.fn() };
            this.input = { on: jest.fn(), off: jest.fn(), setDefaultCursor: jest.fn(), setDraggable: jest.fn() };
            this.cameras = { main: { width: 800, height: 600, setSize: jest.fn(), setViewport: jest.fn() } };
            this.scale = { width: 800, height: 600, on: jest.fn(), off: jest.fn() };
            this.time = { addEvent: jest.fn(), delayedCall: jest.fn(), now: 0 };
            this.tweens = { add: jest.fn(), killTweensOf: jest.fn() };
            this.add = {
                text: jest.fn(() => ({ setOrigin: jest.fn(), setText: jest.fn(), setPosition: jest.fn(), destroy: jest.fn() })),
                sprite: jest.fn(() => ({
                    setScale: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    setOrigin: jest.fn().mockReturnThis(),
                    setFrame: jest.fn().mockReturnThis(),
                    setPosition: jest.fn().mockReturnThis(),
                    setAngle: jest.fn().mockReturnThis(),
                    setTint: jest.fn().mockReturnThis(),
                    clearTint: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                graphics: jest.fn(() => ({
                    clear: jest.fn(),
                    fillStyle: jest.fn(),
                    fillRect: jest.fn(),
                    lineStyle: jest.fn(),
                    strokeRect: jest.fn(),
                    destroy: jest.fn()
                })),
                tileSprite: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setSize: jest.fn().mockReturnThis(),
                    setPosition: jest.fn().mockReturnThis()
                }))
            };
            this.scene = {
                launch: jest.fn(),
                stop: jest.fn(),
                start: jest.fn(),
                get: jest.fn()
            };
            this.game = { events: { on: jest.fn(), emit: jest.fn(), off: jest.fn() } };
        }
    },
    Math: {
        Between: (min, max) => min, // Deterministic for tests
        FloatBetween: (min, max) => min
    },
    Utils: {
        Array: { GetRandom: (arr) => arr[0] }
    }
};

// Mock dependencies
jest.mock('../js/Nadagotchi.js');
jest.mock('../js/PersistenceManager.js');
jest.mock('../js/Calendar.js');
jest.mock('../js/EventManager.js');
jest.mock('../js/WorldClock.js');
jest.mock('../js/WeatherSystem.js');
jest.mock('../js/SkyManager.js', () => {
    return {
        SkyManager: class {
            constructor(scene) {}
            resize() {}
            update() {}
            setVisible() {}
        }
    };
});
jest.mock('../js/LightingManager.js');
jest.mock('../js/AchievementManager.js');
jest.mock('../js/utils/SoundSynthesizer.js', () => ({
    instance: { playChime: jest.fn(), playFailure: jest.fn(), playSuccess: jest.fn() }
}));

const { MainScene } = require('../js/MainScene.js');

describe('MainScene Pet Movement', () => {
    let scene;

    beforeEach(() => {
        scene = new MainScene();
        // Manually trigger create-like setup
        scene.nadagotchi = {
            mood: 'happy',
            live: jest.fn(),
            handleAction: jest.fn(),
            stats: { energy: 100, happiness: 100 }
        };
        scene.gameSettings = { gameSpeed: 1 };

        // Mock specific objects
        scene.sprite = {
            x: 400,
            y: 300,
            setFlipX: jest.fn(),
            setPosition: jest.fn(),
            setFrame: jest.fn(),
            setScale: jest.fn(),
            setAngle: jest.fn(),
            width: 64 // Assume width
        };

        // Mock Tweens specifically
        scene.tweens = {
            add: jest.fn(),
            killTweensOf: jest.fn()
        };

        // Setup Housing State
        scene.location = 'GARDEN';
        scene.isMoving = false;
        scene.nextMoveTime = 0;

        // Mock Camera
        scene.cameras = { main: { width: 800, height: 600 } };

        // Mock Managers created in create() but here just properties
        scene.skyManager = { setVisible: jest.fn(), update: jest.fn(), resize: jest.fn() };
    });

    test('should NOT move if location is GARDEN', () => {
        scene.location = 'GARDEN';
        scene.updatePetMovement(1000);

        expect(scene.isMoving).toBe(false);
        expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    test('should NOT move if currently moving', () => {
        scene.location = 'INDOOR';
        scene.isMoving = true;
        scene.updatePetMovement(1000);

        expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    test('should NOT move if cooldown active', () => {
        scene.location = 'INDOOR';
        scene.nextMoveTime = 2000;
        scene.updatePetMovement(1000);

        expect(scene.isMoving).toBe(false);
        expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    test('should trigger walk when conditions met', () => {
        scene.location = 'INDOOR';
        scene.nextMoveTime = 0;
        scene.isMoving = false;
        scene.nadagotchi.mood = 'happy';

        // Override random to ensure trigger
        global.Phaser.Math.Between = () => 1; // Always trigger

        scene.updatePetMovement(1000);

        expect(scene.isMoving).toBe(true);
        expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            targets: scene.sprite,
            x: expect.any(Number)
        }));
    });

    test('should flip sprite based on direction', () => {
        scene.location = 'INDOOR';
        scene.sprite.x = 100;

        // Mock walkTo logic directly if needed, or rely on updatePetMovement calling it
        // Let's call walkTo directly to verify direction logic
        scene.walkTo(200); // Moving Right
        expect(scene.sprite.setFlipX).toHaveBeenCalledWith(false);

        scene.walkTo(50); // Moving Left
        expect(scene.sprite.setFlipX).toHaveBeenCalledWith(true);
    });
});
