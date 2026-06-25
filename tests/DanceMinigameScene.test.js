import { jest } from '@jest/globals';
import { setupPhaserMock } from './helpers/mockPhaser.js';

// Setup Phaser Mock
setupPhaserMock();

// Mock SoundSynthesizer
jest.mock('../js/utils/SoundSynthesizer.js', () => ({
    SoundSynthesizer: {
        instance: {
            playFailure: jest.fn(),
        }
    }
}));

// Mock EventKeys
jest.mock('../js/EventKeys.js', () => ({
    EventKeys: {
        UI_ACTION: 'uiAction'
    }
}));

// Mock ButtonFactory
jest.mock('../js/ButtonFactory.js', () => ({
    ButtonFactory: {
        createButton: jest.fn(() => ({ destroy: jest.fn() }))
    }
}));


const { DanceMinigameScene } = require('../js/DanceMinigameScene.js');
const { SoundSynthesizer } = require('../js/utils/SoundSynthesizer.js');

describe('DanceMinigameScene Test Suite', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
        scene = new DanceMinigameScene();
    });

    test('create() initializes variables', () => {
        scene.create();
        expect(scene.score).toBe(0);
        expect(scene.combo).toBe(0);
        expect(scene.isPlaying).toBe(true);
        expect(scene.notes.length).toBe(0);
    });

    test('spawnNote() creates a note and adds it to notes array', () => {
        scene.create();
        scene.spawnNote();
        expect(scene.notes.length).toBe(1);
        expect(['LEFT', 'DOWN', 'UP', 'RIGHT']).toContain(scene.notes[0].laneKey);
    });

    test('handleInput() coverage for missing laneNotes logic', () => {
        scene.create();
        scene.spawnNote();

        // Let's create a note but it's not active
        scene.notes[0].active = false;

        scene.handleInput(scene.notes[0].laneKey);
        // It will filter out the note and break combo because laneNotes.length === 0
        expect(scene.combo).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
    });

    test('handleInput() misses when no notes in lane', () => {
        scene.create();
        scene.isPlaying = false;
        scene.handleInput('LEFT'); // should return early
        scene.isPlaying = true;
        scene.handleInput('LEFT');
        expect(scene.combo).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
    });

    test('handleInput() handles multiple notes by finding closest', () => {
        scene.create();
        scene.spawnNote();
        scene.spawnNote();

        // Ensure both notes are in the same lane for this test
        const lane = scene.lanes[0].key;
        scene.notes[0].laneKey = lane;
        scene.notes[1].laneKey = lane;

        scene.notes[0].active = true;
        scene.notes[1].active = true;

        // Reverse order so it actually tests the update logic
        scene.notes[0].y = scene.targetY + 10; // close
        scene.notes[1].y = scene.targetY + 50; // far

        scene.handleInput(lane);

        expect(scene.score).toBe(100);
    });

    test('handleInput() handles multiple notes by finding closest 2', () => {
        scene.create();
        scene.spawnNote();
        scene.spawnNote();

        // Ensure both notes are in the same lane for this test
        const lane = scene.lanes[0].key;
        scene.notes[0].laneKey = lane;
        scene.notes[1].laneKey = lane;

        scene.notes[0].active = true;
        scene.notes[1].active = true;

        scene.notes[0].y = scene.targetY + 50; // far
        scene.notes[1].y = scene.targetY + 10; // close

        scene.handleInput(lane);

        // It should have hit the close one (PERFECT = 100 points)
        expect(scene.score).toBe(100);
    });

    test('handleInput() misses when note is too far without indicator', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.active = true;
        note.y = scene.targetY + 100; // Far away
        scene.laneIndicators[note.laneKey] = { setColor: jest.fn() };
        scene.handleInput(note.laneKey);
        expect(scene.combo).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
    });

    test('handleInput() misses when note is too far', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.active = true;
        note.y = scene.targetY + 100; // Far away

        scene.laneIndicators[note.laneKey] = { setColor: jest.fn() };

        scene.handleInput(note.laneKey);
        expect(scene.combo).toBe(0);
        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
        expect(scene.laneIndicators[note.laneKey].setColor).toHaveBeenCalledWith('#FF0000');
    });

    test('handleInput() gets PERFECT when note is very close without indicator', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.active = true;
        note.y = scene.targetY + 10; // Very close
        scene.laneIndicators[note.laneKey] = null;
        scene.handleInput(note.laneKey);
        expect(scene.score).toBeGreaterThan(0);
        expect(scene.combo).toBe(1);
    });

    test('handleInput() gets PERFECT when note is very close', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.active = true;
        note.y = scene.targetY + 10; // Very close

        // mock to test flash target
        scene.laneIndicators[note.laneKey] = { setColor: jest.fn() };

        scene.handleInput(note.laneKey);
        expect(scene.score).toBeGreaterThan(0);
        expect(scene.combo).toBe(1);
        expect(scene.laneIndicators[note.laneKey].setColor).toHaveBeenCalledWith('#00FFFF');
    });

    test('handleInput() gets GOOD when note is somewhat close without indicator', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.active = true;
        note.y = scene.targetY + 30; // Somewhat close
        scene.laneIndicators[note.laneKey] = null;
        scene.handleInput(note.laneKey);
        expect(scene.score).toBeGreaterThan(0);
        expect(scene.combo).toBe(1);
    });

    test('handleInput() gets GOOD when note is somewhat close', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.active = true;
        note.y = scene.targetY + 30; // Somewhat close
        scene.laneIndicators[note.laneKey] = { setColor: jest.fn() };
        scene.handleInput(note.laneKey);
        expect(scene.score).toBeGreaterThan(0);
        expect(scene.combo).toBe(1);
        expect(scene.laneIndicators[note.laneKey].setColor).toHaveBeenCalledWith('#00FFFF');
    });

    test('update() moves notes', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        const initialY = note.y;
        scene.update(0, 16);
        expect(note.y).toBeLessThan(initialY);
    });

    test('update() ignores if not playing', () => {
        scene.create();
        scene.isPlaying = false;
        scene.spawnNote();
        const note = scene.notes[0];
        const initialY = note.y;
        scene.update(0, 16);
        expect(note.y).toBe(initialY); // Should not move
    });
    test('update() spawns new notes', () => {
        scene.create();
        scene.nextSpawn = -1; // Force spawn
        global.Phaser.Math.Between = jest.fn().mockReturnValue(0);

        scene.spawnNote = jest.fn();
        scene.update(1, 16);

        expect(scene.spawnNote).toHaveBeenCalled();
    });

    test('update() covers notes splice edge case with multiple notes', () => {
        scene.create();
        scene.spawnNote();
        scene.spawnNote();
        scene.notes[0].y = scene.targetY - 100;
        scene.notes[1].y = scene.targetY;

        scene.breakCombo = jest.fn();

        scene.update(10, 16);
        expect(scene.notes.length).toBe(1);
    });

    test('update() covers notes splice edge case', () => {
        scene.create();
        scene.spawnNote();
        scene.notes[0].y = scene.targetY - 100;

        // mock breakCombo to just exist and check if we hit line 207 (notes.splice)
        scene.breakCombo = jest.fn();

        scene.update(10, 16);
        expect(scene.notes.length).toBe(0);
    });

    test('update() misses note', () => {
        scene.create();
        scene.breakCombo = jest.fn();
        scene.spawnNote();
        scene.notes[0].y = scene.targetY - 100; // Passed target

        // ensure missing destroys note
        const note = scene.notes[0];
        note.destroy = jest.fn();
        scene.update(10, 16);
        expect(scene.breakCombo).toHaveBeenCalled();
        expect(note.destroy).toHaveBeenCalled();
        expect(scene.notes.length).toBe(0);
    });

    test('getArrowChar() returns correct chars', () => {
        scene.create();
        expect(scene.getArrowChar('LEFT')).toBe('←');
        expect(scene.getArrowChar('DOWN')).toBe('↓');
        expect(scene.getArrowChar('UP')).toBe('↑');
        expect(scene.getArrowChar('RIGHT')).toBe('→');
        expect(scene.getArrowChar('UNKNOWN')).toBeUndefined();
    });



    test('getArrowChar() returns correct chars (mock)', () => {
        expect(scene.getArrowChar('LEFT')).toBe('←');
        expect(scene.getArrowChar('DOWN')).toBe('↓');
        expect(scene.getArrowChar('UP')).toBe('↑');
        expect(scene.getArrowChar('RIGHT')).toBe('→');
        expect(scene.getArrowChar('UNKNOWN')).toBeUndefined();
    });
    test('endGame() finish button triggers resume', () => {
        scene.create();
        scene.score = 1000;
        scene.endGame();
        expect(scene.add.rectangle).toHaveBeenCalled();
        expect(scene.isPlaying).toBe(false);
        expect(ButtonFactory.createButton).toHaveBeenCalled();

        // manually call the button callback
        const callback = ButtonFactory.createButton.mock.calls[ButtonFactory.createButton.mock.calls.length - 1][4];
        callback();
        expect(scene.scene.resume).toHaveBeenCalledWith('MainScene');
        expect(scene.scene.stop).toHaveBeenCalled();
        expect(scene.game.events.emit).toHaveBeenCalledWith('uiAction', 'PLAY_COMPLETE', { score: 1000 });
    });

    test('update() destroys missed notes', () => {
        scene.create();
        scene.spawnNote();
        const note = scene.notes[0];
        note.y = scene.targetY - 100; // Past target
        scene.update(0, 16);
        expect(scene.notes.length).toBe(0);
    });

    test('endGame() stops playing and shows score', () => {
        scene.create();
        scene.score = 1000;
        scene.endGame();
        expect(scene.isPlaying).toBe(false);
    });
});
