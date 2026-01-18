
import { jest } from '@jest/globals';

export const mockGameObject = () => {
    const listeners = {};
    const obj = {
        listeners, // Expose listeners for direct access in tests if needed
        on: jest.fn((event, fn) => {
            listeners[event] = fn;
            return obj;
        }),
        emit: (event, ...args) => {
            if (listeners[event]) listeners[event](...args);
        },
        setInteractive: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setBlendMode: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setAngle: jest.fn().mockReturnThis(),
        setFrame: jest.fn().mockReturnThis(),
        clear: jest.fn(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        refresh: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        clearTint: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setTilePosition: jest.fn().mockReturnThis(),
        context: {
             createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
             createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
             fillStyle: '',
             fillRect: jest.fn()
        },
        width: 800,
        height: 600,
        x: 0,
        y: 0
    };
    return obj;
};

export const setupPhaserMock = () => {
    global.Phaser = {
        Scene: class Scene {
            constructor(config) {
                this.config = config;
                this.events = {
                    on: jest.fn(),
                    off: jest.fn(),
                    emit: jest.fn()
                };
                this.plugins = {
                    get: jest.fn()
                };
            }
        },
        GameObjects: {
            Sprite: class Sprite {
                constructor() {
                    Object.assign(this, mockGameObject());
                    this.events = {}; // Ensure events object exists
                }
            },
            Image: class Image { constructor() { Object.assign(this, mockGameObject()); } },
            Graphics: class Graphics { constructor() { Object.assign(this, mockGameObject()); } },
            Text: class Text { constructor() { Object.assign(this, mockGameObject()); } },
            TileSprite: class TileSprite { constructor() { Object.assign(this, mockGameObject()); } },
            Container: class Container { constructor() { Object.assign(this, mockGameObject()); } }
        },
        Math: {
            Between: jest.fn().mockReturnValue(1),
            FloatBetween: jest.fn().mockReturnValue(0.5)
        },
        Display: {
            Color: class Color {
                constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
                static Interpolate = {
                    ColorWithColor: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 })
                }
                static ComponentToHex = jest.fn();
                static GetColor = jest.fn();
            }
        },
        Utils: {
            Array: {
                GetRandom: (arr) => arr && arr.length > 0 ? arr[0] : null
            }
        }
    };
};

export const createMockAdd = () => ({
    sprite: jest.fn(() => new Phaser.GameObjects.Sprite()),
    image: jest.fn(() => new Phaser.GameObjects.Image()),
    graphics: jest.fn(() => new Phaser.GameObjects.Graphics()),
    text: jest.fn(() => new Phaser.GameObjects.Text()),
    tileSprite: jest.fn(() => new Phaser.GameObjects.TileSprite()),
    rectangle: jest.fn(() => mockGameObject()),
    zone: jest.fn(() => mockGameObject()),
    container: jest.fn(() => ({ ...mockGameObject(), add: jest.fn(), removeAll: jest.fn() })),
    group: jest.fn().mockReturnValue({ get: jest.fn(), create: jest.fn(), add: jest.fn(), clear: jest.fn() }),
    particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
            start: jest.fn(),
            stop: jest.fn(),
            setPosition: jest.fn(),
            setDepth: jest.fn().mockReturnThis()
        }),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    })
});
