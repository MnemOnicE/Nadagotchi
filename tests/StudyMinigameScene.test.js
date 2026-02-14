
import { jest } from '@jest/globals';
import { setupPhaserMock } from './helpers/mockPhaser.js';

// Setup Phaser Mock
setupPhaserMock();

// Mock SoundSynthesizer
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

// Mock EventKeys
jest.mock('../js/EventKeys.js', () => ({
    EventKeys: {
        STUDY_COMPLETE: 'studyComplete'
    }
}));

const { StudyMinigameScene } = require('../js/StudyMinigameScene.js');
const { SoundSynthesizer } = require('../js/utils/SoundSynthesizer.js');

describe('StudyMinigameScene Test Suite', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
        scene = new StudyMinigameScene();
    });

    /**
     * Helper to setup the top row of the grid.
     * @param {string} chars - String of chars for the top row (e.g., "BOOK").
     */
    const setupRow = (chars) => {
        for (let i = 0; i < chars.length; i++) {
            scene.grid[0][i].char = chars[i];
        }
    };

    /**
     * Helper to select cells and optionally submit.
     * @param {number} count - Number of cells to select from top-left (0,0).
     */
    const selectAndSubmit = (count) => {
        for (let i = 0; i < count; i++) {
             // If we just assign selectedCells array, handleCellClick logic (highlights) is skipped
             // But for submit logic testing, array population is key.
             // Let's mimic selection:
             scene.selectedCells.push(scene.grid[0][i]);
        }
        scene.submitWord();
    };

    test('create() initializes grid and buttons', () => {
        scene.create();
        expect(scene.grid.length).toBe(5);
        expect(scene.add.container).toHaveBeenCalledTimes(4);
    });

    test('selecting adjacent cells builds a word', () => {
        scene.create();
        setupRow("BOOK");

        // Manually trigger click handler to test interaction logic
        [0, 1, 2, 3].forEach(i => scene.handleCellClick(scene.grid[0][i]));

        expect(scene.selectedCells.length).toBe(4);
        expect(scene.selectedCells.map(c => c.char).join('')).toBe('BOOK');
    });

    test('submitting a valid word updates score', () => {
        scene.create();
        setupRow("BOOK");
        selectAndSubmit(4);

        expect(scene.score).toBe(40);
        expect(scene.foundWords).toBe(1);
        expect(SoundSynthesizer.instance.playSuccess).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a 4+ letter invalid word triggers Research Note', () => {
        scene.create();
        setupRow("ABCD");
        selectAndSubmit(4);

        expect(scene.score).toBe(4);
        expect(scene.foundWords).toBe(0);
        expect(SoundSynthesizer.instance.playChime).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a 3 letter invalid word fails', () => {
        scene.create();
        setupRow("ABC");
        selectAndSubmit(3);

        expect(scene.score).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
    });

    test('submitting a short word fails', () => {
        scene.create();
        setupRow("HI");
        selectAndSubmit(2);

        expect(scene.score).toBe(0);
        // Feedback only, no failure sound for short words
        expect(scene.selectedCells.length).toBe(0);
    });
});
