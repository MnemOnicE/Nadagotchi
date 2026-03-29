import { jest } from '@jest/globals';
import { setupPhaserMock, createMockAdd } from './helpers/mockPhaser';

setupPhaserMock();

const { ShowcaseScene } = require('../js/ShowcaseScene');
const { ButtonFactory } = require('../js/ButtonFactory');

// Mock Dependencies
jest.mock('../js/ButtonFactory', () => ({
    ButtonFactory: {
        createButton: jest.fn((scene, x, y, text, callback) => {
            const btn = {
                textLabel: text,
                setPosition: jest.fn().mockReturnThis(),
                setVisible: jest.fn().mockReturnThis(),
                destroy: jest.fn()
            };
            btn.emit = (event) => {
                if (event === 'pointerdown' && callback) callback();
            };
            return btn;
        })
    }
}));

jest.mock('../js/systems/ToastManager', () => ({
    ToastManager: jest.fn().mockImplementation(() => ({
        show: jest.fn()
    }))
}));

describe('ShowcaseScene', () => {
    let scene;
    let mockPet;
    let mockAdd;

    beforeEach(() => {
        mockAdd = createMockAdd();
        mockPet = {
            uuid: 'test-uuid-12345',
            dominantArchetype: 'Adventurer',
            generation: 1,
            currentCareer: 'Scout',
            age: 5.5,
            mood: 'happy',
            exportDNA: jest.fn().mockResolvedValue('MOCK_DNA_SEQUENCE')
        };

        // Reset navigator mock
        Object.defineProperty(global, 'navigator', {
            value: {
                clipboard: {
                    writeText: jest.fn().mockResolvedValue()
                }
            },
            configurable: true,
            writable: true
        });

        scene = new ShowcaseScene();
        scene.add = mockAdd;
        scene.cameras = {
            main: {
                width: 800,
                height: 600
            }
        };
        scene.tweens = {
            add: jest.fn()
        };
        scene.scene = {
            resume: jest.fn(),
            stop: jest.fn(),
            wake: jest.fn()
        };

        scene.init({ nadagotchi: mockPet });
    });

    test('create should initialize UI elements', async () => {
        scene.create();
        expect(mockAdd.rectangle).toHaveBeenCalled();
        expect(mockAdd.text).toHaveBeenCalled();
        expect(mockAdd.container).toHaveBeenCalled();
        expect(mockAdd.sprite).toHaveBeenCalled();
        expect(scene.tweens.add).toHaveBeenCalled();

        // Wait for DNA generation
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mockPet.exportDNA).toHaveBeenCalled();
    });

    test('should show error if DNA generation fails', async () => {
        const error = new Error('DNA failed');
        mockPet.exportDNA.mockRejectedValue(error);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        scene.create();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(consoleSpy).toHaveBeenCalledWith("Failed to generate DNA:", error);
        consoleSpy.mockRestore();
    });

    test('close should resume MainScene and stop current scene', () => {
        scene.create();
        scene.close();
        expect(scene.scene.resume).toHaveBeenCalledWith('MainScene');
        expect(scene.scene.stop).toHaveBeenCalled();
        expect(scene.scene.wake).toHaveBeenCalledWith('UIScene');
    });

    test('clicking copy button should call copyToClipboard', async () => {
        const copySpy = jest.spyOn(ShowcaseScene.prototype, 'copyToClipboard').mockImplementation(() => Promise.resolve());

        scene.create();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Find the copy button (it's created after exportDNA resolves)
        const copyBtnCall = jest.mocked(ButtonFactory.createButton).mock.calls.find(call => call[3] === "COPY TO CLIPBOARD");
        const registeredCallback = copyBtnCall[4];

        registeredCallback();

        expect(copySpy).toHaveBeenCalledWith('MOCK_DNA_SEQUENCE');
        copySpy.mockRestore();
    });

    test('clicking back button should call close', () => {
        const closeSpy = jest.spyOn(ShowcaseScene.prototype, 'close').mockImplementation(() => {});

        scene.create();

        const backBtnCall = jest.mocked(ButtonFactory.createButton).mock.calls.find(call => call[3] === "<- BACK");
        const registeredCallback = backBtnCall[4];

        registeredCallback();

        expect(closeSpy).toHaveBeenCalled();
        closeSpy.mockRestore();
    });

    test('copyToClipboard should show success toast on successful copy', async () => {
        scene.create();
        // Wait for DNA generation promise to resolve
        await new Promise(resolve => setTimeout(resolve, 0));

        await scene.copyToClipboard('MOCK_DNA_SEQUENCE');

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MOCK_DNA_SEQUENCE');
        expect(scene.toastManager.show).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Copied!',
            message: 'DNA copied to clipboard.'
        }));
    });

    test('copyToClipboard should show error toast on clipboard failure', async () => {
        const error = new Error('Clipboard denied');

        scene.create();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Mock writeText to reject
        const writeTextMock = jest.fn().mockRejectedValue(error);
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: writeTextMock
            },
            configurable: true
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await scene.copyToClipboard('MOCK_DNA_SEQUENCE');

        expect(writeTextMock).toHaveBeenCalledWith('MOCK_DNA_SEQUENCE');
        expect(consoleSpy).toHaveBeenCalledWith('Clipboard failed', error);
        expect(scene.toastManager.show).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Error',
            message: 'Could not copy DNA.'
        }));

        consoleSpy.mockRestore();
    });

    test('copyToClipboard should show console fallback toast if clipboard API is missing', async () => {
        // Remove clipboard API
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true
        });

        scene.create();
        await new Promise(resolve => setTimeout(resolve, 0));

        scene.copyToClipboard('MOCK_DNA_SEQUENCE');

        expect(scene.toastManager.show).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Console',
            message: 'DNA logged to console (Clipboard API missing).'
        }));
    });
});
