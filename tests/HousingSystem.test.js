
// Mock Phaser first
global.Phaser = {
    Scene: class {},
    Math: { Between: jest.fn() },
    Utils: { Array: { GetRandom: jest.fn() } },
    GameObjects: { Sprite: class {} },
    Display: {
        Color: class {
            constructor() {}
            static Interpolate = { ColorWithColor: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 }) };
            static ComponentToHex = jest.fn();
            static GetColor = jest.fn();
        }
    }
};

const { MainScene } = require('../js/MainScene');
const { EventKeys } = require('../js/EventKeys');

// Mock Phaser objects
const mockSprite = {
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setTint: jest.fn(),
    clearTint: jest.fn(),
    x: 100,
    y: 100,
    destroy: jest.fn(),
    setPosition: jest.fn(),
    setScale: jest.fn().mockReturnThis(),
    setAngle: jest.fn(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setBlendMode: jest.fn().mockReturnThis()
};

const mockGraphics = {
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    setPosition: jest.fn(),
    clear: jest.fn(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn()
};

const mockInput = {
    on: jest.fn(),
    off: jest.fn(),
    setDraggable: jest.fn(),
    setDefaultCursor: jest.fn()
};

const mockPersistence = {
    saveFurniture: jest.fn(),
    loadFurniture: jest.fn().mockReturnValue([]),
    loadCalendar: jest.fn().mockReturnValue({}),
    loadPet: jest.fn().mockReturnValue(null), // New pet
    savePet: jest.fn(),
    loadSettings: jest.fn().mockReturnValue({}),
    saveSettings: jest.fn(),
    loadJournal: jest.fn().mockReturnValue([]),
    loadRecipes: jest.fn().mockReturnValue([]),
    loadAchievements: jest.fn().mockReturnValue({ unlocked: [], progress: {} })
};

// MainScene Mocks
const mockAdd = {
    sprite: jest.fn().mockReturnValue(mockSprite),
    graphics: jest.fn().mockReturnValue(mockGraphics),
    text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis()
    }),
    image: jest.fn().mockReturnValue(mockSprite),
    rectangle: jest.fn()
};

const mockCameras = {
    main: {
        width: 800,
        height: 600,
        setSize: jest.fn(),
        setViewport: jest.fn()
    }
};

const mockTextures = {
    createCanvas: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({
            createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
            createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
            fillStyle: 'black',
            fillRect: jest.fn()
        }),
        update: jest.fn(),
        setSize: jest.fn(),
        clear: jest.fn(),
        refresh: jest.fn(),
        width: 800,
        height: 600,
        context: {
             createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
             createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
             fillStyle: 'black',
             fillRect: jest.fn()
        }
    })
};

describe('Housing System (MainScene)', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();

        scene = new MainScene();
        scene.add = mockAdd;
        scene.cameras = mockCameras;
        scene.input = mockInput;
        scene.textures = mockTextures;
        scene.game = { events: { emit: jest.fn(), on: jest.fn() } };
        scene.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        scene.scale = { width: 800, height: 600, on: jest.fn() };
        scene.sys = { settings: { data: {} } };
        scene.scene = { launch: jest.fn(), get: jest.fn() };
        scene.tweens = { add: jest.fn(), killTweensOf: jest.fn() };

        // Mock Managers to avoid instantiation errors
        scene.persistence = mockPersistence;
    });

    // Helper to bypass full create() complexity
    const initScene = () => {
        // Ensure dateText is initialized before create calls update/resize
        scene.dateText = mockAdd.text();

        // Call create - this will now use the mocks
        // NOTE: This will overwrite scene.persistence and scene.nadagotchi with real instances
        scene.create();

        // RE-INJECT Mocks after create()
        scene.persistence = mockPersistence;

        // Mock Nadagotchi behavior
        scene.nadagotchi = {
            placeItem: jest.fn().mockReturnValue(true),
            handleAction: jest.fn(),
            stats: { energy: 100 },
            mood: 'neutral',
            genome: { phenotype: {} },
            maxStats: { energy: 100, happiness: 100, hunger: 100 }
        };
    };

    test('toggleDecorationMode should switch mode and update cursor', () => {
        initScene();
        expect(scene.isDecorationMode).toBe(false);

        scene.toggleDecorationMode();

        expect(scene.isDecorationMode).toBe(true);
        expect(scene.input.setDefaultCursor).toHaveBeenCalledWith('move');
    });

    test('toggleDecorationMode should make furniture draggable when enabled', () => {
        initScene();
        // Add some dummy furniture
        const sprite1 = { ...mockSprite };
        scene.placedFurniture = [{ key: 'Chair', x: 10, y: 10, sprite: sprite1 }];

        scene.toggleDecorationMode(); // Enable

        expect(sprite1.setTint).toHaveBeenCalledWith(0xDDDDDD);
        expect(scene.input.setDraggable).toHaveBeenCalledWith(sprite1);
    });

    test('toggleDecorationMode should disable drag and save when disabled', () => {
        initScene();
        const sprite1 = { ...mockSprite };
        scene.placedFurniture = [{ key: 'Chair', x: 10, y: 10, sprite: sprite1 }];
        scene.isDecorationMode = true;

        scene.toggleDecorationMode(); // Disable

        expect(sprite1.clearTint).toHaveBeenCalled();
        expect(scene.input.setDraggable).toHaveBeenCalledWith(sprite1, false);
        expect(mockPersistence.saveFurniture).toHaveBeenCalled();
    });

    test('placeFurniture should add sprite with drag listeners', () => {
        initScene();
        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Fancy Bookshelf';

        // Mock add.sprite to return a new object we can inspect
        const newSprite = { ...mockSprite, on: jest.fn() };
        scene.add.sprite.mockReturnValue(newSprite);

        scene.placeFurniture(200, 200);

        expect(scene.nadagotchi.placeItem).toHaveBeenCalledWith('Fancy Bookshelf');
        expect(scene.add.sprite).toHaveBeenCalledWith(200, 200, 'fancy_bookshelf');

        // Check that 'drag' and 'dragend' listeners were added
        expect(newSprite.on).toHaveBeenCalledWith('drag', expect.any(Function));
        expect(newSprite.on).toHaveBeenCalledWith('dragend', expect.any(Function));

        // Verify it was added to the list
        expect(scene.placedFurniture).toHaveLength(1);
        expect(scene.placedFurniture[0].sprite).toBe(newSprite);
    });

    test('Drag event handler should update sprite position in Decoration Mode', () => {
        initScene();
        scene.isDecorationMode = true;

        // Manually trigger the drag logic
        let dragCallback;
        const newSprite = {
            ...mockSprite,
            on: jest.fn((event, cb) => {
                if (event === 'drag') dragCallback = cb;
                return newSprite;
            }),
            x: 0, y: 0
        };
        scene.add.sprite.mockReturnValue(newSprite);

        // Place item to register handlers
        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Chair';
        scene.placeFurniture(100, 100);

        // Verify callback was captured
        expect(dragCallback).toBeDefined();

        // Simulate Drag
        dragCallback({}, 150, 150); // pointer, dragX, dragY

        expect(newSprite.x).toBe(150);
        expect(newSprite.y).toBe(150);
    });

    test('Drag event handler should NOT update sprite position if NOT in Decoration Mode', () => {
        initScene();
        scene.isDecorationMode = false; // Normal mode

        let dragCallback;
        const newSprite = {
            ...mockSprite,
            on: jest.fn((event, cb) => {
                if (event === 'drag') dragCallback = cb;
                return newSprite;
            }),
            x: 100, y: 100
        };
        scene.add.sprite.mockReturnValue(newSprite);

        scene.isPlacementMode = true;
        scene.selectedFurniture = 'Chair';
        scene.placeFurniture(100, 100);

        // Simulate Drag
        dragCallback({}, 200, 200);

        // Position should NOT change
        expect(newSprite.x).toBe(100);
        expect(newSprite.y).toBe(100);
    });
});
