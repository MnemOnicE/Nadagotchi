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
        const textMock = {
            setText: jest.fn(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setStyle: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
        };
        const addMock = {
            text: jest.fn(() => textMock),
            sprite: jest.fn(() => addMock),
            container: jest.fn(() => addMock),
            graphics: jest.fn(() => addMock),
            particles: jest.fn(() => addMock),
            renderTexture: jest.fn(() => addMock),
            image: jest.fn(() => addMock),
            group: jest.fn(() => addMock),
            rectangle: jest.fn(() => ({
                setStrokeStyle: jest.fn(() => ({
                    setOrigin: jest.fn(() => ({
                        setInteractive: jest.fn()
                    }))
                }))
            })),
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
            content: { setText: jest.fn() }
        };
        this.add = addMock;
        this.input = { on: jest.fn() };
        this.time = { addEvent: jest.fn(), delayedCall: jest.fn() };
        this.cameras = { main: { width: 800, height: 600, setBackgroundColor: jest.fn(), setSize: jest.fn() } };
        this.game = { events: { on: jest.fn(), emit: jest.fn() } };
        this.scale = { on: jest.fn() };
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
const Nadagotchi = require('../js/Nadagotchi.js');
const MainScene = require('../js/MainScene.js');
const UIScene = require('../js/UIScene.js');
const PersistenceManager = require('../js/PersistenceManager.js');

// Assign to global scope for dependencies that might expect it
global.Nadagotchi = Nadagotchi;
global.PersistenceManager = PersistenceManager;


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

        // Manually call the create method to initialize scene properties like retireButton
        uiScene.create();

        // Inject the mock event emitter and scene manager
        mainScene.game.events = gameEvents;
        uiScene.game.events = gameEvents;
        mainScene.scene = { start: jest.fn(), stop: jest.fn(), launch: jest.fn() };
        uiScene.scene = { pause: jest.fn(), resume: jest.fn() };

        // Spy on the retireButton's setVisible method
        jest.spyOn(uiScene.retireButton, 'setVisible');

        // Manually establish the event listeners between the two scenes
        gameEvents.on('updateStats', uiScene.updateStatsUI, uiScene);
        gameEvents.on('uiAction', mainScene.handleUIAction, mainScene);
    });

    test('should trigger the legacy scene transition when pet is old enough and user retires it', () => {
        // 1. Arrange: Create a pet that is old enough for retirement
        const oldPet = new Nadagotchi('Adventurer');
        oldPet.age = 51;
        mainScene.nadagotchi = oldPet; // Place the pet in the main scene

        // 2. Act: Run the pet's main lifecycle method. This should set the isLegacyReady flag.
        mainScene.nadagotchi.live();
        expect(mainScene.nadagotchi.isLegacyReady).toBe(true);

        // 3. Act: Simulate the game's update loop, which notifies the UI of the pet's new state.
        gameEvents.emit('updateStats', mainScene.nadagotchi);

        // Assert: Check that the UI has made the retire button visible.
        expect(uiScene.retireButton.setVisible).toHaveBeenCalledWith(true);

        // 4. Act: Simulate the user clicking the retire button.
        gameEvents.emit('uiAction', 'RETIRE');

        // 5. Assert: Verify that the main scene received the action and initiated the scene change.
        expect(mainScene.scene.stop).toHaveBeenCalledWith('UIScene');
        expect(mainScene.scene.start).toHaveBeenCalledWith('BreedingScene', mainScene.nadagotchi);
    });
});

const BreedingScene = require('../js/BreedingScene.js');

describe('BreedingScene', () => {
    let breedingScene;
    let parentData;

    beforeEach(() => {
        breedingScene = new BreedingScene();
        parentData = {
            dominantArchetype: 'Adventurer',
            personalityPoints: {
                Adventurer: 25,
                Nurturer: 15,
                Intellectual: 5,
                Mischievous: 10,
                Recluse: 2,
            },
            generation: 1,
            moodSensitivity: 5,
            legacyTraits: ['Quick Learner'],
        };
        breedingScene.parentData = parentData;
        breedingScene.persistence = {
            saveToHallOfFame: jest.fn(),
            clearActivePet: jest.fn(),
        };
        breedingScene.scene = {
            start: jest.fn(),
        };
    });

    test('calculateLegacy should generate a new pet with inherited and influenced traits', () => {
        // Arrange: Select items to influence the new pet
        breedingScene.selectedItems = ['logic', 'creativity'];

        // Act: Calculate the new pet's data
        const newPetData = breedingScene.calculateLegacy();

        // Assert: Generation should be incremented
        expect(newPetData.generation).toBe(parentData.generation + 1);

        // Assert: The dominant archetype should be inherited
        expect(newPetData.dominantArchetype).toBe(parentData.dominantArchetype);

        // Assert: Personality points should be set based on parentage and influences
        expect(newPetData.personalityPoints.Adventurer).toBe(5); // Primary archetype
        expect(newPetData.personalityPoints.Nurturer).toBe(2); // Secondary archetype
        expect(newPetData.personalityPoints.Intellectual).toBe(5); // from 'logic' item
        expect(newPetData.personalityPoints.Mischievous).toBe(3); // from 'creativity' item
        expect(newPetData.hobbies.painting).toBe(10); // from 'creativity' item

        // Assert: Mood sensitivity should be similar to the parent's
        expect(newPetData.moodSensitivity).toBeGreaterThanOrEqual(4);
        expect(newPetData.moodSensitivity).toBeLessThanOrEqual(6);

        // Assert: Legacy traits have a chance to be inherited (or not), so we can't be certain.
        // We can check if the array exists.
        expect(newPetData.legacyTraits).toBeInstanceOf(Array);
    });

    test('finalizeLegacy should save parent, clear old data, and start the main scene', () => {
        // Arrange
        const newPetData = { generation: 2 };

        // Act
        breedingScene.finalizeLegacy(newPetData);

        // Assert
        expect(breedingScene.persistence.saveToHallOfFame).toHaveBeenCalledWith(parentData);
        expect(breedingScene.persistence.clearActivePet).toHaveBeenCalled();
        expect(breedingScene.scene.start).toHaveBeenCalledWith('MainScene', { newPetData });
    });
});
