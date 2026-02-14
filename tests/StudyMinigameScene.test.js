
import { jest } from '@jest/globals';
import { setupPhaserMock } from './helpers/mockPhaser.js';

// Setup Phaser Mock immediately so it's available for requires
setupPhaserMock();

// Mock SoundSynthesizer BEFORE requiring scene
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

// Require Scene AFTER Phaser is mocked
const { StudyMinigameScene } = require('../js/StudyMinigameScene.js');
const { SoundSynthesizer } = require('../js/utils/SoundSynthesizer.js');

describe('StudyMinigameScene Test Suite', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
        scene = new StudyMinigameScene();
    });

    test('create() initializes grid and buttons', () => {
        scene.create();
        expect(scene.grid.length).toBe(5);
        expect(scene.grid[0].length).toBe(5);
        expect(scene.add.container).toHaveBeenCalledTimes(4);
    });

    test('selecting adjacent cells builds a word', () => {
        scene.create();

        scene.grid[0][0].char = 'B';
        scene.grid[0][1].char = 'O';
        scene.grid[0][2].char = 'O';
        scene.grid[0][3].char = 'K';

        scene.handleCellClick(scene.grid[0][0]);
        scene.handleCellClick(scene.grid[0][1]);
        scene.handleCellClick(scene.grid[0][2]);
        scene.handleCellClick(scene.grid[0][3]);

        expect(scene.selectedCells.length).toBe(4);
        expect(scene.selectedCells.map(c => c.char).join('')).toBe('BOOK');
    });

    test('submitting a valid word updates score and increments foundWords', () => {
        scene.create();

        scene.grid[0][0].char = 'B';
        scene.grid[0][1].char = 'O';
        scene.grid[0][2].char = 'O';
        scene.grid[0][3].char = 'K';

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1],
            scene.grid[0][2],
            scene.grid[0][3]
        ];

        expect(scene.validWords.has('BOOK')).toBe(true);

        scene.submitWord();

        expect(scene.score).toBe(40);
        expect(scene.foundWords).toBe(1);
        expect(SoundSynthesizer.instance.playSuccess).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a 4+ letter invalid word triggers Research Note', () => {
        scene.create();

        scene.grid[0][0].char = 'A';
        scene.grid[0][1].char = 'B';
        scene.grid[0][2].char = 'C';
        scene.grid[0][3].char = 'D';

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1],
            scene.grid[0][2],
            scene.grid[0][3]
        ];

        expect(scene.validWords.has('ABCD')).toBe(false);

        scene.submitWord();

        expect(scene.score).toBe(4);
        expect(scene.foundWords).toBe(0);
        expect(SoundSynthesizer.instance.playChime).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a 3 letter invalid word fails', () => {
        scene.create();

        scene.grid[0][0].char = 'A';
        scene.grid[0][1].char = 'B';
        scene.grid[0][2].char = 'C';

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1],
            scene.grid[0][2]
        ];

        scene.submitWord();

        expect(scene.score).toBe(0);
        expect(scene.foundWords).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
        expect(scene.selectedCells.length).toBe(0);
    });

    test('submitting a short word fails', () => {
        scene.create();

        scene.selectedCells = [
            scene.grid[0][0],
            scene.grid[0][1]
        ];
        scene.grid[0][0].char = 'H';
        scene.grid[0][1].char = 'I';

        scene.submitWord();

        expect(scene.score).toBe(0);
        expect(scene.foundWords).toBe(0);
        expect(scene.selectedCells.length).toBe(0);
    });
});
