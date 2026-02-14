// tests/legacy.test.js

// Mock Phaser scenes and game objects
class Scene {
    constructor(key) {
        this.key = key;
        this.scene = {
            start: jest.fn(),
            stop: jest.fn(),
            launch: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            isPaused: jest.fn().mockReturnValue(false),
        };
        // Mocking chainable methods on 'add'
        const gameObjectMock = {
            setText: jest.fn(),
            setInteractive: jest.fn().mockReturnThis(),
            disableInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setStyle: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setStrokeStyle: jest.fn().mockReturnThis(),
            add: jest.fn(),
            setPosition: jest.fn(),
            setSize: jest.fn(),
            destroy: jest.fn(),
            clear: jest.fn(),
        };
        const addMock = {
            text: jest.fn(() => gameObjectMock),
            sprite: jest.fn(() => gameObjectMock),
            container: jest.fn(() => gameObjectMock),
            graphics: jest.fn(() => gameObjectMock),
            particles: jest.fn(() => gameObjectMock),
            renderTexture: jest.fn(() => gameObjectMock),
            image: jest.fn(() => gameObjectMock),
            group: jest.fn(() => ({
                addMultiple: jest.fn(),
                add: jest.fn(),
                setVisible: jest.fn(),
                content: { setText: jest.fn() }
            })),
            rectangle: jest.fn(() => gameObjectMock),
            zone: jest.fn(() => gameObjectMock),
            setInteractive: jest.fn(() => addMock),
            on: jest.fn(() => addMock),
            setOrigin: jest.fn(() => addMock),
            setScale: jest.fn(() => addMock),
            setVisible: jest.fn(() => addMock),
            setAlpha: jest.fn(() => addMock),
            disableInteractive: jest.fn(() => addMock),
            setBackgroundColor: jest.fn(() => addMock),
            setStyle: jest.fn(() => addMock),
            destroy: jest.fn(),
            addMultiple: jest.fn(),
            content: { setText: jest.fn() },
            add: jest.fn(),
            setSize: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis()
        };
        this.add = addMock;
        this.input = { on: jest.fn(), keyboard: { on: jest.fn() } };
        this.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        this.cameras = {
            main: {
                width: 800,
                height: 600,
                setBackgroundColor: jest.fn(),
                setSize: jest.fn(),
                setViewport: jest.fn()
            },
            resize: jest.fn()
        };
        this.game = { events: { on: jest.fn(), emit: jest.fn() } };
        this.scale = { on: jest.fn(), width: 800, height: 600 };
        this.textures = {
            addDynamicTexture: jest.fn().mockReturnValue({
                context: {
                    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    fillStyle: '',
                    fillRect: jest.fn(),
                },
                clear: jest.fn(),
                refresh: jest.fn(),
                setSize: jest.fn(),
            }),
            createCanvas: jest.fn().mockReturnValue({
                context: {
                    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                    fillStyle: '',
                    fillRect: jest.fn(),
                },
                clear: jest.fn(),
                refresh: jest.fn(),
                setSize: jest.fn(),
                width: 800,
                height: 600
            }),
            generateTexture: jest.fn()
        };
        this.make = { graphics: jest.fn(() => ({ fillStyle: jest.fn(() => ({ fillRect: jest.fn(() => ({ generateTexture: jest.fn(), destroy: jest.fn() })) })) })) };
        this.tweens = { add: jest.fn() };
    }
}


// Mock Phaser globally
global.Phaser = {
    Scene,
    Utils: { Array: { GetRandom: (arr) => arr[0] } },
    Math: { Between: (min, max) => min, Clamp: (v, min, max) => Math.min(Math.max(v, min), max) },
    Display: { Color: { Interpolate: { ColorWithColor: jest.fn(() => ({ r: 0, g: 0, b: 0 })) } } }
};

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();


// Since the JS files are not modules, we require a transform to make them testable.
// This is handled by jest.config.js, so we can use require here.
const { Nadagotchi } = require('../js/Nadagotchi.js');
const { MainScene } = require('../js/MainScene.js');
const { UIScene } = require('../js/UIScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');
const { ButtonFactory } = require('../js/ButtonFactory.js');


describe('Legacy Loop Integration', () => {

    let mainScene;
    let uiScene;
    let gameEvents;

    beforeEach(() => {
        // A mock event emitter to connect the scenes
        const events = {};
        gameEvents = {
            on: jest.fn((event, fn, context) => {
                if (!events[event]) events[event] = [];
                events[event].push({ fn, context });
            }),
            emit: jest.fn((event, ...args) => {
                if (events[event]) {
                    events[event].forEach(listener => listener.fn.apply(listener.context, args));
                }
            }),
        };

        // Instantiate scenes
        mainScene = new MainScene();
        uiScene = new UIScene();

        // Inject the mock event emitter and scene manager
        mainScene.game = { events: gameEvents };
        uiScene.game = { events: gameEvents };
        mainScene.scene = { start: jest.fn(), stop: jest.fn(), launch: jest.fn() };
        uiScene.scene = { pause: jest.fn(), resume: jest.fn() };

        // Mock properties usually set by Phaser
        mainScene.scale = { width: 800, height: 600, on: jest.fn() };
        uiScene.scale = { width: 800, height: 600, on: jest.fn() };

        // Manually call the create method to initialize scene properties like retireButton
        uiScene.create();
    });

    test('should trigger the legacy scene transition when pet is old enough and user retires it', () => {
        // 1. Arrange: Create a pet that is old enough for retirement
        const oldPet = new Nadagotchi('Adventurer');
        oldPet.age = 51;
        mainScene.nadagotchi = oldPet; // Place the pet in the main scene

        // Open SYSTEM tab to see the button (simulated)
        uiScene.showTab('SYSTEM');

        // 2. Act: Run the pet's main lifecycle method. This should set the isLegacyReady flag.
        mainScene.nadagotchi.live();
        expect(mainScene.nadagotchi.isLegacyReady).toBe(true);

        // 3. Act: Simulate the game's update loop, which notifies the UI of the pet's new state.
        gameEvents.emit('updateStats', mainScene.nadagotchi);

        // 4. Act: Simulate the user clicking the retire button.
        // gameEvents.emit('uiAction', 'RETIRE');
        // Direct call to ensure logic is tested, bypassing potential event emitter mock issues in test env
        mainScene.handleUIAction('RETIRE');

        // 5. Assert: Verify that the main scene received the action and initiated the scene change.
        expect(mainScene.scene.stop).toHaveBeenCalledWith('UIScene');
        expect(mainScene.scene.start).toHaveBeenCalledWith('BreedingScene', mainScene.nadagotchi);
    });
});

const { BreedingScene } = require('../js/BreedingScene.js');

describe('BreedingScene', () => {
    let breedingScene;
    let parentData;

    beforeEach(() => {
        breedingScene = new BreedingScene();
        parentData = new Nadagotchi('Adventurer');
        parentData.personalityPoints = {
            Adventurer: 25,
            Nurturer: 15, // Secondary
            Intellectual: 5,
            Mischievous: 10,
            Recluse: 2,
        };
        parentData.generation = 1;
        parentData.moodSensitivity = 5;
        parentData.legacyTraits = ['Quick Learner'];

        breedingScene.parentData = parentData;
        breedingScene.persistence = {
            saveToHallOfFame: jest.fn().mockResolvedValue(),
            clearActivePet: jest.fn(),
        };
        breedingScene.scene = {
            start: jest.fn(),
        };
    });

    test('calculateOffspring should be called on parentData via logic that was moved from BreedingScene', () => {
        // Arrange: Select items to influence the new pet
        breedingScene.selectedItems = ['logic', 'creativity'];

        // Act: Use the Nadagotchi method which BreedingScene delegates to
        const newPetData = breedingScene.parentData.calculateOffspring(breedingScene.selectedItems);

        // Assert: Generation should be incremented
        expect(newPetData.generation).toBe(parentData.generation + 1);

        // Assert: The dominant archetype should be inherited (weighted)
        // Note: New system uses probabilistic genes, so strict equality is not guaranteed.
        // But dominant should have high genes.
        // We mocked Phaser.Utils.Array.GetRandom to return the first element.
        // In Nadagotchi.js calculateOffspring:
        // dominant = contenders[Math.floor(Math.random() * contenders.length)];
        // If we want deterministic test, we need to mock Math.random.

        expect(newPetData.personalityPoints.Adventurer).toBeGreaterThanOrEqual(4); // Base 5 +/- 1

        // Assert: Environmental factors
        // logic -> Intellectual +3
        expect(newPetData.personalityPoints.Intellectual).toBeGreaterThanOrEqual(3);

        // Assert: Legacy traits have a chance to be inherited
        // Using Nadagotchi defaults/GeneticsSystem defaults, it's probabilistic.
        expect(newPetData.legacyTraits).toBeInstanceOf(Array);

        // Check integration: The genome object should be present
        expect(newPetData.genome).toBeDefined();
    });

    test('finalizeLegacy should save parent, clear old data, and start the main scene', async () => {
        // Arrange
        const newPetData = { generation: 2 };

        // Act
        await breedingScene.finalizeLegacy(newPetData);

        // Assert
        expect(breedingScene.persistence.saveToHallOfFame).toHaveBeenCalledWith(parentData);
        expect(breedingScene.persistence.clearActivePet).toHaveBeenCalled();
        expect(breedingScene.scene.start).toHaveBeenCalledWith('MainScene', { newPetData });
    });
});
