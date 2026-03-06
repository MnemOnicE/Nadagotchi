
export const mockGameObject = () => {
    const listeners = {};
    const obj = {
        scene: { scene: { get: jest.fn() }, time: { delayedCall: jest.fn((delay, cb, args) => { if(args) cb(...args); else cb(); }) } },
        on: (event, callback) => { listeners[event] = callback; return obj; },
        off: (event) => { delete listeners[event]; return obj; },
        emit: (event, ...args) => { if (listeners[event]) listeners[event](...args); },
        setInteractive: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn(function(v) { this.visible = v; return this; }),
        setOrigin: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setViewport: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        clearTint: jest.fn().mockReturnThis(),
        setFrame: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setAngle: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setFlipX: jest.fn().mockReturnThis(),
        setTilePosition: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setBlendMode: jest.fn().mockReturnThis(),
        fill: jest.fn().mockReturnThis(),
        draw: jest.fn().mockReturnThis(),
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        displayHeight: 100,
        visible: false
    };
    return obj;
};

export const createMockAdd = () => ({
    sprite: jest.fn(() => mockGameObject()),
    image: jest.fn(() => mockGameObject()),
    graphics: jest.fn(() => mockGameObject()),
    text: jest.fn(() => mockGameObject()),
    tileSprite: jest.fn(() => mockGameObject()),
    rectangle: jest.fn(() => mockGameObject()),
    zone: jest.fn(() => mockGameObject()),
    renderTexture: jest.fn(() => mockGameObject()),
    container: jest.fn(() => ({ ...mockGameObject(), add: jest.fn(), removeAll: jest.fn() })),
    group: jest.fn().mockReturnValue({ get: jest.fn(), create: jest.fn(), add: jest.fn(), clear: jest.fn() }),
    particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
            start: jest.fn(),
            stop: jest.fn(),
            setPosition: jest.fn(),
            setDepth: jest.fn().mockReturnThis(),
            setEmitZone: jest.fn().mockReturnThis(),
            setBounds: jest.fn().mockReturnThis(),
            setQuantity: jest.fn().mockReturnThis(),
            setFrequency: jest.fn().mockReturnThis()
        }),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    })
});

export const setupPhaserMock = () => {
    global.Phaser = {
        Scene: class Scene {
            constructor(config) {
                this.config = config;
                this.events = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
                this.scale = { on: jest.fn(), off: jest.fn(), width: 800, height: 600 };
                this.cameras = { main: { width: 800, height: 600, setBackgroundColor: jest.fn(), setSize: jest.fn(), setViewport: jest.fn() } };
                this.add = createMockAdd();
                this.make = {
                    image: jest.fn(() => mockGameObject()),
                    graphics: jest.fn(() => mockGameObject()),
                    renderTexture: jest.fn(() => mockGameObject())
                };
                this.time = {
                    delayedCall: jest.fn((delay, callback) => { callback(); return { destroy: jest.fn() }; }),
                    addEvent: jest.fn(() => ({ destroy: jest.fn(), remove: jest.fn() })),
                    now: 0
                };
                this.tweens = {
                    add: jest.fn((config) => {
                        if (config.onComplete) config.onComplete();
                        return { stop: jest.fn() };
                    }),
                    killTweensOf: jest.fn()
                };
                this.textures = {
                    exists: jest.fn().mockReturnValue(true),
                    createCanvas: jest.fn(() => ({
                        getContext: jest.fn(() => ({
                            createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                            fillRect: jest.fn(),
                            globalCompositeOperation: ''
                        })),
                        refresh: jest.fn()
                    }))
                };
                this.sys = { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } };
                this.scene = { stop: jest.fn(), resume: jest.fn(), get: jest.fn(), launch: jest.fn(), start: jest.fn() };
                this.game = { events: { emit: jest.fn(), on: jest.fn(), off: jest.fn() } };
                this.input = {
                    keyboard: { on: jest.fn(), off: jest.fn() },
                    on: jest.fn(),
                    off: jest.fn(),
                    setDefaultCursor: jest.fn(),
                    setDraggable: jest.fn()
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
            Container: class Container { constructor() { Object.assign(this, mockGameObject()); } },
            RenderTexture: class RenderTexture {
                constructor() {
                    Object.assign(this, mockGameObject());
                }
            }
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
        },
        Geom: {
            Rectangle: class Rectangle {
                constructor(x, y, width, height) {
                    this.x = x; this.y = y; this.width = width; this.height = height;
                }
                contains(x, y) { return true; }
            },
            Intersects: {
                RectangleToRectangle: jest.fn().mockReturnValue(false)
            }
        }
    };
};
