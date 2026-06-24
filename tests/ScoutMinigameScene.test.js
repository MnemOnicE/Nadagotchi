import { jest } from '@jest/globals';
import { setupPhaserMock } from './helpers/mockPhaser.js';
import { EventKeys } from '../js/EventKeys.js';

// Setup Phaser Mock before requiring the scene
setupPhaserMock();

const { ScoutMinigameScene } = require('../js/ScoutMinigameScene.js');

// We need to keep a reference to original shuffle to not break other tests, or just mock it per test
const originalShuffle = Phaser.Utils.Array.Shuffle;

describe('ScoutMinigameScene Test Suite', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();
        // Restore shuffle
        Phaser.Utils.Array.Shuffle = originalShuffle;
        scene = new ScoutMinigameScene();
    });

    test('constructor sets key correctly', () => {
        expect(scene.sys.config).toEqual({ key: 'ScoutMinigameScene' });
    });

    test('init() defaults to Scout career', () => {
        scene.init();
        expect(scene.careerName).toBe('Scout');
    });

    test('init() uses provided career name', () => {
        scene.init({ careerName: 'Explorer' });
        expect(scene.careerName).toBe('Explorer');
    });

    test('create() initializes UI and grid', () => {
        scene.init();
        scene.create();

        // Background color
        expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#2E8B57');

        // Timer Text & Title created
        // We know text is called twice, for title and timer
        expect(scene.add.text).toHaveBeenCalledTimes(14); // 2 titles + 12 cards icon text

        // Grid (12 rectangles)
        expect(scene.add.rectangle).toHaveBeenCalledTimes(12);

        // Timer created
        expect(scene.time.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            delay: 1000,
            loop: true
        }));
    });

    test('matching all cards triggers win condition', () => {
        // Force un-shuffled grid for predictability
        const icons = ['🌳', '🍄', '🐝', '🍁', '🌿', '🐾'];
        Phaser.Utils.Array.Shuffle = jest.fn().mockReturnValue([...icons, ...icons]);

        scene.init();
        scene.create();

        // Extract rectangles (cards) created
        const cards = scene.add.rectangle.mock.results.map(r => r.value);
        expect(cards.length).toBe(12);

        // Cards 0 and 6 are '🌳', 1 and 7 are '🍄', etc.
        for (let i = 0; i < 6; i++) {
            const card1 = cards[i];
            const card2 = cards[i + 6];

            card1.emit('pointerdown');
            card2.emit('pointerdown');
        }

        // Win condition ends game, destroys timer, emits WORK_RESULT, resumes MainScene
        expect(scene.game.events.emit).toHaveBeenCalledWith(EventKeys.WORK_RESULT, { success: true, career: 'Scout' });
        expect(scene.scene.resume).toHaveBeenCalledWith('MainScene');
        expect(scene.scene.stop).toHaveBeenCalled();
    });

    test('mismatching cards resets them after delay', () => {
        const icons = ['🌳', '🍄', '🐝', '🍁', '🌿', '🐾'];
        Phaser.Utils.Array.Shuffle = jest.fn().mockReturnValue([...icons, ...icons]);

        scene.init();
        scene.create();

        const cards = scene.add.rectangle.mock.results.map(r => r.value);

        // Click 0 ('🌳') and 1 ('🍄') - Mismatch
        const card1 = cards[0];
        const card2 = cards[1];

        card1.emit('pointerdown');
        card2.emit('pointerdown');

        // Verify delayedCall was scheduled
        expect(scene.time.delayedCall).toHaveBeenCalled();

        // Verify cards are revealed before delay
        expect(card1.getData('revealed')).toBe(true);
        expect(card2.getData('revealed')).toBe(true);

        // Extract the delayed call callback
        const delayedCallback = scene.time.delayedCall.mock.calls[0][1];
        const callbackArgs = scene.time.delayedCall.mock.calls[0][2]; // [firstSelection, secondSelection]

        // Add a mock scene property so the reset check passes
        card1.scene = scene;
        card2.scene = scene;

        // Manually trigger the callback
        delayedCallback(...callbackArgs);

        // Verify cards reset
        expect(card1.getData('revealed')).toBe(false);
        expect(card2.getData('revealed')).toBe(false);
    });

    test('timer running out triggers lose condition', () => {
        scene.init();
        scene.create();

        // Extract the timer callback
        const timerCallback = scene.time.addEvent.mock.calls[0][0].callback;

        // Call 30 times
        for (let i = 0; i < 30; i++) {
            timerCallback();
        }

        // Should lose
        expect(scene.game.events.emit).toHaveBeenCalledWith(EventKeys.WORK_RESULT, { success: false, career: 'Scout' });
        expect(scene.scene.resume).toHaveBeenCalledWith('MainScene');
        expect(scene.scene.stop).toHaveBeenCalled();
    });

    test('clicking an already revealed card or when two are selected is ignored', () => {
        const icons = ['🌳', '🍄', '🐝', '🍁', '🌿', '🐾'];
        Phaser.Utils.Array.Shuffle = jest.fn().mockReturnValue([...icons, ...icons]);

        scene.init();
        scene.create();

        const cards = scene.add.rectangle.mock.results.map(r => r.value);

        const card1 = cards[0];
        const card2 = cards[1];
        const card3 = cards[2];

        card1.emit('pointerdown');
        card1.emit('pointerdown'); // Ignore, already revealed

        card2.emit('pointerdown'); // Mismatch happens, sets delay, 2 selections active

        // In this implementation, the check is `if (card.getData('revealed') || secondSelection) return;`
        // We simulate clicking third card while secondSelection is active (before delayedCall finishes)
        card3.emit('pointerdown'); // Ignored because secondSelection is active and hasn't been reset yet

        expect(card3.getData('revealed')).toBe(false);
    });
});
