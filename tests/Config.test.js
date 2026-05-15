import { Config } from '../js/Config.js';

describe('Config System', () => {
    test('Config object should be defined and have expected top-level keys', () => {
        expect(Config).toBeDefined();
        const expectedKeys = [
            'INITIAL_STATE', 'GENETICS', 'CAREER', 'MINIGAMES',
            'DECAY', 'THRESHOLDS', 'LIMITS', 'ACTIONS',
            'ENV_MODIFIERS', 'TRAITS', 'MOOD_MULTIPLIERS',
            'MOOD_VISUALS', 'SETTINGS', 'GAME_LOOP', 'TIMING',
            'SECURITY', 'DEBRIS', 'UI'
        ];
        expectedKeys.forEach(key => {
            expect(Config).toHaveProperty(key);
        });
    });

    test('INITIAL_STATE should have required sub-keys and correct types', () => {
        expect(Config.INITIAL_STATE).toHaveProperty('STATS');
        expect(Config.INITIAL_STATE.STATS).toHaveProperty('hunger');
        expect(Config.INITIAL_STATE.STATS).toHaveProperty('energy');
        expect(Config.INITIAL_STATE.STATS).toHaveProperty('happiness');
        expect(typeof Config.INITIAL_STATE.STATS.hunger).toBe('number');

        expect(Config.INITIAL_STATE).toHaveProperty('SKILLS');
        expect(Config.INITIAL_STATE.SKILLS).toHaveProperty('communication');
    });

    test('DECAY rates should be numbers', () => {
        Object.values(Config.DECAY).forEach(value => {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThanOrEqual(0);
        });
    });

    test('THRESHOLDS should be valid numbers', () => {
        Object.values(Config.THRESHOLDS).forEach(value => {
            expect(typeof value).toBe('number');
        });
    });

    test('MOOD_MULTIPLIERS should be positive numbers', () => {
        Object.values(Config.MOOD_MULTIPLIERS).forEach(value => {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThan(0);
        });
    });

    test('MOOD_VISUALS should have matching keys for FRAMES and EMOJIS', () => {
        const frameKeys = Object.keys(Config.MOOD_VISUALS.FRAMES).sort();
        const emojiKeys = Object.keys(Config.MOOD_VISUALS.EMOJIS).sort();
        expect(frameKeys).toEqual(emojiKeys);
    });

    test('GAME_LOOP constants should be reasonable', () => {
        expect(Config.GAME_LOOP.TARGET_FPS).toBe(60);
        expect(Config.GAME_LOOP.MS_PER_FRAME).toBeCloseTo(16.667, 3);
    });

    test('SECURITY should have a DNA_SALT', () => {
        expect(Config.SECURITY.DNA_SALT).toBeDefined();
        expect(typeof Config.SECURITY.DNA_SALT).toBe('string');
        expect(Config.SECURITY.DNA_SALT.length).toBeGreaterThan(0);
    });

    test('DEBRIS config should have expected values', () => {
        expect(Config.DEBRIS.MAX_COUNT).toBeGreaterThan(0);
        expect(typeof Config.DEBRIS.SPAWN_CHANCE_DAILY).toBe('number');
    });

    test('ACTIONS should have expected keys and valid values', () => {
        const requiredActions = ['FEED', 'PLAY', 'STUDY', 'CRAFT', 'EXPLORE'];
        requiredActions.forEach(action => {
            expect(Config.ACTIONS).toHaveProperty(action);
            Object.values(Config.ACTIONS[action]).forEach(value => {
                expect(typeof value).toBe('number');
            });
        });

        expect(Config.ACTIONS.FEED).toHaveProperty('HUNGER_RESTORE');
        expect(Config.ACTIONS.PLAY).toHaveProperty('ENERGY_COST');
        expect(Config.ACTIONS.STUDY).toHaveProperty('SKILL_GAIN');
    });
});
