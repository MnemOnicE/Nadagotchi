
// tests/PaletteUX.test.js

// 1. Mock Phaser Global
const mockGameObject = () => {
    const obj = {
        on: jest.fn(function(event, fn) {
            if (!this.listeners) this.listeners = {};
            this.listeners[event] = fn;
            return this;
        }),
        emit: function(event, ...args) {
            if (this.listeners && this.listeners[event]) this.listeners[event](...args);
        },
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(), // Added this
        setVisible: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        add: jest.fn().mockReturnThis(), // For Container.add
        addMultiple: jest.fn().mockReturnThis(),
        width: 100,
        height: 50,
        x: 0,
        y: 0
    };
    return obj;
};

global.Phaser = {
    Scene: class Scene {
        constructor(config) { this.config = config; }
    },
    GameObjects: {
        Container: class Container {
            constructor() { Object.assign(this, mockGameObject()); this.list = []; }
            add(child) {
                if (Array.isArray(child)) this.list = this.list.concat(child);
                else this.list.push(child);
                return this;
            }
        },
        Group: class Group {
             constructor() { Object.assign(this, mockGameObject()); this.children = []; }
             add(child) { this.children.push(child); return this; }
             addMultiple(children) { this.children = this.children.concat(children); return this; }
        },
        Text: class Text { constructor() { Object.assign(this, mockGameObject()); } },
        Graphics: class Graphics { constructor() { Object.assign(this, mockGameObject()); } },
        Sprite: class Sprite { constructor() { Object.assign(this, mockGameObject()); } },
        Rectangle: class Rectangle { constructor() { Object.assign(this, mockGameObject()); } },
        Zone: class Zone { constructor() { Object.assign(this, mockGameObject()); } }
    }
};

// Mock dependencies
jest.mock('../js/PersistenceManager', () => ({
    PersistenceManager: jest.fn().mockImplementation(() => ({
        loadJournal: jest.fn().mockReturnValue([]),
        loadRecipes: jest.fn().mockReturnValue([]),
        loadHallOfFame: jest.fn().mockReturnValue([])
    }))
}));

// We do NOT mock ButtonFactory here because we want to test its new logic.
const { ButtonFactory } = require('../js/ButtonFactory');
const { UIScene } = require('../js/UIScene');

describe('Palette UX Improvements', () => {

    describe('ButtonFactory Hover Effects', () => {
        test('createButton adds a hidden hover overlay', () => {
            const scene = {
                add: {
                    container: jest.fn(() => new Phaser.GameObjects.Container()),
                    rectangle: jest.fn(() => new Phaser.GameObjects.Rectangle()),
                    text: jest.fn(() => new Phaser.GameObjects.Text()),
                    zone: jest.fn(() => new Phaser.GameObjects.Zone())
                },
                tweens: { add: jest.fn() }
            };

            const btn = ButtonFactory.createButton(scene, 0, 0, 'Test', jest.fn());

            // Check if hover overlay was created
            // We expect 7 rectangles: shadow, bg, hoverOverlay, 2 highlights, 2 shades
            expect(scene.add.rectangle).toHaveBeenCalledTimes(7);

            // The hover overlay should be the 3rd one created (index 2)
            const hoverOverlayCall = scene.add.rectangle.mock.calls[2];
            // Params: x, y, width, height, color, alpha
            expect(hoverOverlayCall[4]).toBe(0xFFFFFF); // White
            expect(hoverOverlayCall[5]).toBe(0); // Invisible

            // Check if pointerover listener is added
            const zone = scene.add.zone.mock.results[0].value;
            expect(zone.on).toHaveBeenCalledWith('pointerover', expect.any(Function));

            // Simulate hover
            const pointerOverCallback = zone.listeners['pointerover'];
            pointerOverCallback();

            // Should trigger a tween
            expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
                alpha: 0.2,
                duration: 100
            }));
        });
    });

    describe('UIScene Keyboard Shortcuts', () => {
        let scene;

        beforeEach(() => {
            scene = new UIScene();
            // Setup scene mocks
            scene.add = {
                rectangle: jest.fn(() => new Phaser.GameObjects.Rectangle()),
                text: jest.fn(() => new Phaser.GameObjects.Text()),
                container: jest.fn(() => new Phaser.GameObjects.Container()),
                zone: jest.fn(() => new Phaser.GameObjects.Zone()),
                group: jest.fn(() => new Phaser.GameObjects.Group()),
                graphics: jest.fn(() => new Phaser.GameObjects.Graphics()) // for tutorial
            };
            scene.cameras = { main: { width: 800, height: 600, setSize: jest.fn(), setViewport: jest.fn() } };
            scene.game = { events: { on: jest.fn(), emit: jest.fn() } };
            scene.scale = { on: jest.fn() };
            scene.time = { delayedCall: jest.fn() };
            scene.input = { keyboard: { on: jest.fn() }, on: jest.fn() };
            scene.tweens = { add: jest.fn() };
            scene.scene = { pause: jest.fn(), resume: jest.fn() };
        });

        test('create() attaches keyboard listeners for tabs', () => {
            scene.create();

            expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown-ONE', expect.any(Function));
            expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown-TWO', expect.any(Function));
            expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown-THREE', expect.any(Function));
            expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown-FOUR', expect.any(Function));
        });

        test('shortcuts trigger showTab', () => {
            scene.create();
            // Spy on showTab
            scene.showTab = jest.fn();

            // Helper to manually trigger event
            const triggerKey = (key) => {
                const calls = scene.input.keyboard.on.mock.calls;
                const call = calls.find(c => c[0] === key);
                if (call) call[1](); // Execute callback
            };

            triggerKey('keydown-ONE');
            expect(scene.showTab).toHaveBeenCalledWith('CARE');

            triggerKey('keydown-TWO');
            expect(scene.showTab).toHaveBeenCalledWith('ACTION');

            triggerKey('keydown-THREE');
            expect(scene.showTab).toHaveBeenCalledWith('SYSTEM');

            triggerKey('keydown-FOUR');
            expect(scene.showTab).toHaveBeenCalledWith('ANCESTORS');
        });
    });
});
