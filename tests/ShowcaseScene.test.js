import { jest } from '@jest/globals';
import { setupPhaserMock, mockGameObject } from './helpers/mockPhaser';

setupPhaserMock();

// Enhance Container mock for list management
const originalContainer = global.Phaser.GameObjects.Container;
global.Phaser.GameObjects.Container = class Container {
    constructor() {
        Object.assign(this, mockGameObject());
        this.list = [];
        this.add = (child) => {
            if (Array.isArray(child)) {
                this.list = this.list.concat(child);
            } else {
                this.list.push(child);
            }
            return this;
        };
        this.addMultiple = (children) => { this.list = this.list.concat(children); return this; };
    }
};

const { ShowcaseScene } = require('../js/ShowcaseScene');

jest.mock('../js/ButtonFactory', () => ({
    ButtonFactory: {
        createButton: jest.fn().mockReturnValue({ width: 100, height: 40 })
    }
}));

jest.mock('../js/systems/ToastManager', () => ({
    ToastManager: jest.fn().mockImplementation(() => ({
        show: jest.fn()
    }))
}));

jest.mock('../js/Config', () => ({
    Config: {
        MOOD_VISUALS: {
            DEFAULT_FRAME: 1,
            FRAMES: {
                'happy': 0,
                'sad': 2
            }
        }
    }
}));

describe('ShowcaseScene', () => {
    // Ensure we have a circle mock on the scene add object specifically for this test file
    const originalAdd = global.Phaser.Scene.prototype.add;
    let scene;
    let mockNadagotchi;

    beforeEach(() => {
        jest.clearAllMocks();
        scene = new ShowcaseScene();
        scene.sys = {
            events: { on: jest.fn(), off: jest.fn(), once: jest.fn() }
        };
        scene.cameras = { main: { width: 800, height: 600 } };
        scene.add = require('./helpers/mockPhaser').createMockAdd(); scene.add.circle = jest.fn(() => mockGameObject());
        scene.tweens = { ...global.Phaser.Scene.prototype.tweens, add: jest.fn() };
        scene.scene = { ...global.Phaser.Scene.prototype.scene, resume: jest.fn(), stop: jest.fn(), wake: jest.fn() };

        mockNadagotchi = {
            uuid: '12345678-abcd',
            dominantArchetype: 'ADVENTURER',
            generation: 2,
            currentCareer: 'Scout',
            age: 15.5,
            mood: 'happy',
            exportDNA: jest.fn().mockResolvedValue('MOCK_DNA_STRING_THAT_IS_LONG_ENOUGH_TO_BE_TRUNCATED')
        };
    });



    describe('init', () => {
        it('should correctly set petData from input', () => {
            scene.init({ nadagotchi: mockNadagotchi });
            expect(scene.petData).toBe(mockNadagotchi);
        });
    });

    describe('create', () => {
        beforeEach(() => {
            scene.init({ nadagotchi: mockNadagotchi });
            // Spy on class methods before calling create
            jest.spyOn(scene, 'copyToClipboard').mockImplementation(() => {});
            jest.spyOn(scene, 'close').mockImplementation(() => {});
        });

        it('should render main UI elements and pet stats', async () => {
            scene.create();

            // Check background
            expect(scene.add.rectangle).toHaveBeenCalledWith(400, 300, 800, 600, 0x1a237e);

            // Check pet sprite (mood frame 0 for 'happy')
            expect(scene.add.sprite).toHaveBeenCalledWith(0, 0, 'pet', 0);

            // Check stats rendered
            expect(scene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                "12345678...", // UUID truncated
                expect.any(Object)
            );
            expect(scene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                "ADVENTURER",
                expect.any(Object)
            );

            // Wait for microtasks (DNA export promise)
            await Promise.resolve();
            await Promise.resolve(); // another tick to be safe

            // Check DNA text update and button creation
            const { ButtonFactory } = require('../js/ButtonFactory');
            expect(ButtonFactory.createButton).toHaveBeenCalledWith(
                scene,
                expect.any(Number),
                expect.any(Number),
                "COPY TO CLIPBOARD",
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should handle DNA generation failure', async () => {
            // override mock for this test
            scene.petData.exportDNA.mockRejectedValue(new Error('DNA Failed'));

            // We need a mock object returned by add.text to verify color/text changes
            const mockTextObj = { setText: jest.fn().mockReturnThis(), setColor: jest.fn().mockReturnThis(), setOrigin: jest.fn().mockReturnThis() };
            scene.add.text.mockImplementation((x, y, text) => {
                if (text === "Generating Secure DNA...") {
                    return mockTextObj;
                }
                return { setOrigin: jest.fn().mockReturnThis() };
            });

            scene.create();

            await Promise.resolve();
            await Promise.resolve();

            expect(mockTextObj.setText).toHaveBeenCalledWith("Error Generating DNA");
            expect(mockTextObj.setColor).toHaveBeenCalledWith('#ff0000');
        });

        it('should wire back button to close method', () => {
            const { ButtonFactory } = require('../js/ButtonFactory');
            scene.create();

            // The second button is the Back button (first might be copy if promise resolves instantly,
            // but copy is async, so back is probably first synchronously)

            const calls = ButtonFactory.createButton.mock.calls;
            const backCall = calls.find(call => call[3] === "<- BACK");
            expect(backCall).toBeDefined();

            // Execute the callback
            backCall[4]();
            expect(scene.close).toHaveBeenCalled();
        });

        it('should wire copy button to copyToClipboard method', async () => {
            const { ButtonFactory } = require('../js/ButtonFactory');
            scene.create();
            await Promise.resolve(); // wait for DNA promise
            await Promise.resolve();

            const calls = ButtonFactory.createButton.mock.calls;
            const copyCall = calls.find(call => call[3] === "COPY TO CLIPBOARD");
            expect(copyCall).toBeDefined();

            // Execute the callback
            copyCall[4]();
            expect(scene.copyToClipboard).toHaveBeenCalledWith('MOCK_DNA_STRING_THAT_IS_LONG_ENOUGH_TO_BE_TRUNCATED');
        });
    });

    describe('copyToClipboard', () => {
        beforeEach(() => { jest.spyOn(scene, 'showToast').mockImplementation(() => {}); }); afterEach(() => { jest.restoreAllMocks(); });

        it('should handle missing clipboard API', () => {
            // Delete navigator entirely or mock it without clipboard
            jest.spyOn(global, 'navigator', 'get').mockReturnValue({});

            scene.copyToClipboard('test_dna');
            expect(scene.showToast).toHaveBeenCalledWith("Console", "DNA logged to console (Clipboard API missing).");
        });

        it('should handle successful clipboard copy', async () => {
            const mockWriteText = jest.fn().mockResolvedValue(undefined);
            jest.spyOn(global, 'navigator', 'get').mockReturnValue({ clipboard: { writeText: mockWriteText } });

            // Method returns nothing, but it executes a promise internally
            // In the memory, it says: "The copyToClipboard method in js/ShowcaseScene.js returns the underlying Clipboard API promise chain"
            // Let's check the code if it returns the promise
            // The provided code does *not* return the promise. It just does navigator.clipboard.writeText(text).then(...)
            // We'll mock it and await microtasks.

            scene.copyToClipboard('test_dna');
            expect(mockWriteText).toHaveBeenCalledWith('test_dna');

            await Promise.resolve(); // resolve the writeText promise

            expect(scene.showToast).toHaveBeenCalledWith("Copied!", "DNA copied to clipboard.");
        });

        it('should handle clipboard copy failure', async () => {
            const mockWriteText = jest.fn().mockRejectedValue(new Error('Permission denied'));
            jest.spyOn(global, 'navigator', 'get').mockReturnValue({ clipboard: { writeText: mockWriteText } });

            // Suppress console.error for this test
            jest.spyOn(console, 'error').mockImplementation(() => {});

            scene.copyToClipboard('test_dna');

            await Promise.resolve(); await Promise.resolve(); // wait for rejection
            expect(scene.showToast).toHaveBeenCalledWith("Error", "Could not copy DNA.");
            console.error.mockRestore();
        });
    });

    describe('close', () => {
        it('should stop itself and resume MainScene and wake UIScene', () => {
            scene.close();

            expect(scene.scene.resume).toHaveBeenCalledWith('MainScene');
            expect(scene.scene.stop).toHaveBeenCalledWith();
            expect(scene.scene.wake).toHaveBeenCalledWith('UIScene');
        });
    });

    describe('showToast', () => {
        it('should call toastManager with DARK style', () => {
            scene.init({ nadagotchi: mockNadagotchi });
            scene.create();
            scene.showToast('MyTitle', 'MyMessage');

            expect(scene.toastManager.show).toHaveBeenCalledWith({
                title: 'MyTitle',
                message: 'MyMessage',
                style: 'DARK'
            });
        });
    });

});
