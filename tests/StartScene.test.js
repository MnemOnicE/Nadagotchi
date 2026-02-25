// tests/StartScene.test.js
import { jest } from '@jest/globals';
import { setupPhaserMock, createMockAdd, mockGameObject } from './helpers/mockPhaser.js';

// Setup Phaser mock before requiring the scene
setupPhaserMock();

// Mock PersistenceManager
jest.mock('../js/PersistenceManager.js', () => ({
    PersistenceManager: jest.fn().mockImplementation(() => ({
        loadPet: jest.fn(),
        clearAllData: jest.fn(),
        savePet: jest.fn(),
        loadHallOfFame: jest.fn().mockReturnValue([]),
        saveToHallOfFame: jest.fn(),
        loadJournal: jest.fn().mockReturnValue([]),
        saveJournal: jest.fn(),
        loadRecipes: jest.fn().mockReturnValue([]),
        saveRecipes: jest.fn()
    }))
}));

// Mock ButtonFactory
jest.mock('../js/ButtonFactory.js', () => ({
    ButtonFactory: {
        createButton: jest.fn(() => ({
            ...mockGameObject(),
            setOrigin: jest.fn().mockReturnThis(),
        }))
    }
}));

// Require the class under test (must be after setupPhaserMock)
const { StartScene } = require('../js/StartScene.js');
const { PersistenceManager } = require('../js/PersistenceManager.js');
const { ButtonFactory } = require('../js/ButtonFactory.js');

describe('StartScene', () => {
    let scene;
    let mockPersistence;
    let createElementSpy;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Spy on document.createElement
        createElementSpy = jest.spyOn(document, 'createElement').mockImplementation(() => ({
            style: {},
            value: '',
            addEventListener: jest.fn(),
            focus: jest.fn(),
            trim: jest.fn().mockReturnValue(''),
            destroy: jest.fn()
        }));

        // Instantiate the scene
        scene = new StartScene();

        // Setup scene properties
        scene.sys = {
            settings: { data: {} },
            game: { config: {} }
        };

        // Mock add.dom which is specific to this scene
        const mockDom = {
            ...mockGameObject(),
            destroy: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            getChildByName: jest.fn(),
            setOrigin: jest.fn().mockReturnThis()
        };

        // Extend the add factory
        scene.add = {
            ...createMockAdd(),
            dom: jest.fn(() => mockDom),
            container: jest.fn(() => ({
                ...mockGameObject(),
                add: jest.fn(),
                removeAll: jest.fn(),
                setVisible: jest.fn().mockReturnThis(),
                destroy: jest.fn()
            })),
            text: jest.fn(() => ({
                ...mockGameObject(),
                setOrigin: jest.fn().mockReturnThis()
            })),
            image: jest.fn(() => ({
                ...mockGameObject(),
                setOrigin: jest.fn().mockReturnThis(),
                setScale: jest.fn().mockReturnThis(),
                setInteractive: jest.fn().mockReturnThis()
            })),
            rectangle: jest.fn(() => ({
                ...mockGameObject(),
                setOrigin: jest.fn().mockReturnThis()
            }))
        };

        // Mock textures manager
        scene.textures = {
            createCanvas: jest.fn(() => ({
                context: {
                    createLinearGradient: jest.fn(() => ({
                        addColorStop: jest.fn()
                    })),
                    fillStyle: '',
                    fillRect: jest.fn()
                },
                refresh: jest.fn()
            }))
        };

        // Mock scale manager
        scene.scale = {
            width: 800,
            height: 600
        };

        // Mock cameras
        scene.cameras = {
            main: {
                width: 800,
                height: 600
            }
        };

        // Initialize scene
        scene.create();

        // Capture the persistence instance created in create()
        mockPersistence = scene.persistence;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('create() should initialize persistence and UI containers', () => {
        expect(PersistenceManager).toHaveBeenCalled();
        expect(scene.menuContainer).toBeDefined();
        expect(scene.selectionContainer).toBeDefined();
        expect(scene.nameInputContainer).toBeDefined();

        // Check initial visibility states
        expect(scene.selectionContainer.setVisible).toHaveBeenCalledWith(false);
        expect(scene.nameInputContainer.setVisible).toHaveBeenCalledWith(false);
    });

    test('create() should show Resume button if pet exists and handle click', () => {
        jest.clearAllMocks(); // Clear calls from beforeEach

        // Setup mock return value for the NEXT instance
        PersistenceManager.mockImplementationOnce(() => ({
            loadPet: jest.fn().mockReturnValue({ name: 'Fido' }),
            clearAllData: jest.fn(),
            savePet: jest.fn()
        }));

        const newScene = new StartScene();
        // Setup required properties on newScene
        newScene.cameras = scene.cameras;
        newScene.scale = scene.scale;
        newScene.add = scene.add;
        newScene.textures = scene.textures;
        newScene.sys = scene.sys;
        newScene.scene = { start: jest.fn() };

        newScene.create();

        expect(ButtonFactory.createButton).toHaveBeenCalledTimes(2);

        // Find Resume button callback
        const calls = ButtonFactory.createButton.mock.calls;
        const resumeCall = calls.find(call => call[3] === 'ENTER WORLD');
        const resumeCallback = resumeCall[4];

        // Trigger callback
        resumeCallback();

        expect(newScene.scene.start).toHaveBeenCalledWith('MainScene');
    });

    test('create() should show only New Game button and handle click', () => {
        // From beforeEach execution
        expect(ButtonFactory.createButton).toHaveBeenCalledTimes(1);

        const calls = ButtonFactory.createButton.mock.calls;
        const newGameCall = calls.find(call => call[3] === 'ARRIVE (New Game)');
        const newGameCallback = newGameCall[4];

        const spy = jest.spyOn(scene, 'showArchetypeSelection');
        newGameCallback();
        expect(spy).toHaveBeenCalled();
    });

    test('startGame() should clear data and start MainScene', () => {
        const archetype = 'Adventurer';
        const name = 'Hero';

        scene.startGame(archetype, name);

        expect(mockPersistence.clearAllData).toHaveBeenCalled();
        expect(scene.scene.start).toHaveBeenCalledWith('MainScene', {
            newPetData: {
                dominantArchetype: archetype,
                name: name
            },
            startTutorial: true
        });
    });

    test('showArchetypeSelection() should toggle containers and handle Back', () => {
        scene.showArchetypeSelection();

        expect(scene.menuContainer.setVisible).toHaveBeenCalledWith(false);
        expect(scene.selectionContainer.setVisible).toHaveBeenCalledWith(true);
        expect(scene.selectionContainer.removeAll).toHaveBeenCalledWith(true);

        expect(scene.selectionContainer.add).toHaveBeenCalled();

        // Find Back button
        const calls = ButtonFactory.createButton.mock.calls;
        // Last call should be Back button in this flow
        const backCall = calls.find(call => call[3] === 'Back');
        const backCallback = backCall[4];

        // Reset mocks to verify toggle back
        scene.menuContainer.setVisible.mockClear();
        scene.selectionContainer.setVisible.mockClear();

        backCallback();

        expect(scene.selectionContainer.setVisible).toHaveBeenCalledWith(false);
        expect(scene.menuContainer.setVisible).toHaveBeenCalledWith(true);
    });

    test('showNameInput() should setup DOM input and buttons', () => {
        const archetype = 'Nurturer';
        scene.showNameInput(archetype);

        expect(scene.selectionContainer.setVisible).toHaveBeenCalledWith(false);
        expect(scene.nameInputContainer.setVisible).toHaveBeenCalledWith(true);
        expect(scene.nameInputContainer.removeAll).toHaveBeenCalledWith(true);

        // Check DOM creation
        expect(createElementSpy).toHaveBeenCalledWith('input');
        expect(scene.add.dom).toHaveBeenCalled();

        // Check confirm button creation
        expect(ButtonFactory.createButton).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            'Begin Journey',
            expect.any(Function),
            expect.anything()
        );
    });

    test('showNameInput() Back button should return to selection', () => {
        const archetype = 'Nurturer';
        scene.showNameInput(archetype);

        const calls = ButtonFactory.createButton.mock.calls;
        const backCall = calls.find(call => call[3] === 'Back');
        const backCallback = backCall[4];

        const domElement = scene.add.dom.mock.results[0].value;

        backCallback();

        expect(domElement.destroy).toHaveBeenCalled();
        expect(scene.nameInputContainer.setVisible).toHaveBeenCalledWith(false);
        expect(scene.selectionContainer.setVisible).toHaveBeenCalledWith(true);
    });

    test('Entering name via Button should trigger startGame', () => {
        const archetype = 'Nurturer';
        scene.showNameInput(archetype);

        // Find the confirm button callback
        const calls = ButtonFactory.createButton.mock.calls;
        const confirmCall = calls.find(call => call[3] === 'Begin Journey');
        const confirmCallback = confirmCall[4];

        // Setup input value using the spy results
        const mockInput = createElementSpy.mock.results[0].value;
        mockInput.value = 'MyPet';
        mockInput.trim.mockReturnValue('MyPet');

        // Spy on startGame
        const startGameSpy = jest.spyOn(scene, 'startGame');

        // Trigger callback
        confirmCallback();

        expect(startGameSpy).toHaveBeenCalledWith(archetype, 'MyPet');

        // Verify DOM destruction
        const domElement = scene.add.dom.mock.results[0].value;
        expect(domElement.destroy).toHaveBeenCalled();
    });

    test('Entering name via Enter key should trigger startGame', () => {
        const archetype = 'Nurturer';
        scene.showNameInput(archetype);

        const mockInput = createElementSpy.mock.results[0].value;
        mockInput.value = 'MyPet';
        mockInput.trim.mockReturnValue('MyPet');

        const startGameSpy = jest.spyOn(scene, 'startGame');

        // Find keydown listener
        // addEventListener was called on mockInput
        const addListenerSpy = mockInput.addEventListener;
        const keydownCall = addListenerSpy.mock.calls.find(call => call[0] === 'keydown');
        const keydownCallback = keydownCall[1];

        // Simulate event
        keydownCallback({ key: 'Enter' });

        expect(startGameSpy).toHaveBeenCalledWith(archetype, 'MyPet');
    });
});
