
import { jest } from '@jest/globals';
import { setupPhaserMock, createMockAdd } from './helpers/mockPhaser.js';

// 1. Setup Global Phaser Mock
setupPhaserMock();

// Extend Utils (Shuffle is missing in helper)
global.Phaser.Utils.Array.Shuffle = (arr) => arr;

// 2. Mock SoundSynthesizer BEFORE imports
jest.mock('../js/utils/SoundSynthesizer.js', () => ({
    SoundSynthesizer: {
        instance: {
            playClick: jest.fn(),
            playSuccess: jest.fn(),
            playFailure: jest.fn(),
            playChime: jest.fn()
        }
    }
}));

// 3. Mock EventKeys
jest.mock('../js/EventKeys.js', () => ({
    EventKeys: {
        STUDY_COMPLETE: 'STUDY_COMPLETE'
    }
}));

// 4. Import Scene
const { StudyMinigameScene } = require('../js/StudyMinigameScene');

describe('StudyMinigameScene', () => {
    let scene;

    beforeEach(() => {
        scene = new StudyMinigameScene();

        // Manual Injection of Scene properties normally handled by Phaser
        scene.cameras = { main: { width: 800, height: 600, setBackgroundColor: jest.fn() } };
        scene.add = createMockAdd();

        scene.time = {
            delayedCall: jest.fn((delay, callback) => { callback(); return { destroy: jest.fn() }; }),
            addEvent: jest.fn(() => ({ destroy: jest.fn(), remove: jest.fn() }))
        };

        scene.tweens = {
            add: jest.fn((config) => {
                if (config.onComplete) config.onComplete(); // Execute immediately for testing
                return { stop: jest.fn() };
            })
        };

        scene.sys = { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } };
        scene.scene = { stop: jest.fn(), resume: jest.fn(), get: jest.fn() };
        scene.game = { events: { emit: jest.fn() } };
        scene.events = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
        scene.input = { keyboard: { on: jest.fn() } };
    });

    test('create() initializes grid', () => {
        scene.create();

        // Check if grid is generated (5x5 = 25 cells)
        // gridContainer is created via scene.add.container
        expect(scene.add.container).toHaveBeenCalled();
        const gridContainerMock = scene.add.container.mock.results[0].value;
        expect(gridContainerMock.add).toHaveBeenCalledTimes(25);

        expect(scene.grid.length).toBe(5);
        expect(scene.grid[0].length).toBe(5);
        expect(scene.grid[0][0]).toHaveProperty('char');
    });

    test('valid word submission updates score and replaces cells', () => {
        scene.create();

        // Manually set up a valid word "BOOK"
        scene.grid[0][0].char = 'B';
        scene.grid[0][1].char = 'O';
        scene.grid[0][2].char = 'O';
        scene.grid[0][3].char = 'K';

        // Simulate clicking them
        scene.handleCellClick(scene.grid[0][0]);
        scene.handleCellClick(scene.grid[0][1]);
        scene.handleCellClick(scene.grid[0][2]);
        scene.handleCellClick(scene.grid[0][3]);

        expect(scene.selectedCells.length).toBe(4);

        // Submit
        scene.submitWord();

        // Check Score
        expect(scene.score).toBe(40); // 4 * 10
        expect(scene.foundWords).toBe(1);

        // Check Replacement
        const gridContainerMock = scene.add.container.mock.results[0].value;
        // 1 initial renderGrid call in create
        // 1 renderGrid call in replaceSelected
        expect(gridContainerMock.removeAll).toHaveBeenCalledTimes(2);
    });

    test('invalid word submission clears selection', () => {
        scene.create();

        scene.grid[0][0].char = 'X';
        scene.grid[0][1].char = 'Y';
        scene.grid[0][2].char = 'Z';

        scene.handleCellClick(scene.grid[0][0]);
        scene.handleCellClick(scene.grid[0][1]);
        scene.handleCellClick(scene.grid[0][2]);

        scene.submitWord();

        expect(scene.score).toBe(0);
        expect(scene.selectedCells.length).toBe(0);
        // Should trigger feedback (tweens)
        expect(scene.tweens.add).toHaveBeenCalled();
    });
});
