
import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi.js';

// Mock Config
jest.mock('../js/Config.js', () => ({
    Config: {
        INITIAL_STATE: {
            PERSONALITY_POINTS_STARTER: 10,
            STATS: { hunger: 100, energy: 100, happiness: 100 },
            SKILLS: { logic: 0, research: 0, empathy: 0, navigation: 0, crafting: 0, focus: 0, communication: 0 },
            MOOD_SENSITIVITY_DEFAULT: 5,
            GENOME_STARTER_VAL: 10
        },
        LIMITS: { MAX_STATS: 100 },
        GAME_LOOP: { MS_PER_FRAME: 16 },
        DECAY: { HUNGER: 0.1, ENERGY: 0.1, AGE_INCREMENT: 0.001 },
        THRESHOLDS: { HUNGER_ANGRY: 20, HUNGER_SAD: 50, ENERGY_SAD: 30, HAPPY_MOOD: 80, HAPPY_MOOD_HOMOZYGOUS: 60, AGE_LEGACY: 10 },
        GENETICS: { METABOLISM_NORMALIZER: 5, HOMOZYGOUS_ENERGY_BONUS: 20 },
        ENV_MODIFIERS: {
            FESTIVAL_HAPPINESS: 0,
            RAINY: { ADVENTURER_HAPPINESS: 0, NURTURER_ENERGY_MULT: 1 },
            STORMY: { ADVENTURER_HAPPINESS: 0, RECLUSE_HAPPINESS: 0, ENERGY_MULT: 1 },
            CLOUDY: { ENERGY_MULT: 1 },
            SUNNY: { ADVENTURER_HAPPINESS: 0, ENERGY_MULT: 1 },
            NIGHT: { HUNGER_MULT: 1, RECLUSE_HAPPINESS: 0, ADVENTURER_ENERGY_MULT: 1 },
            TWILIGHT: { ENERGY_MULT: 1 },
            DAY: { INTELLECTUAL_ENERGY_MULT: 1 }
        },
        ACTIONS: {
            FEED: { HUNGER_RESTORE: 20, HAPPINESS_RESTORE: 5 },
            PLAY: { ENERGY_COST: 10, HAPPINESS_RESTORE: 10, RECLUSE_HAPPINESS_PENALTY: 5 },
            STUDY: { ENERGY_COST: 10, HAPPINESS_COST: 5, SKILL_GAIN: 1, HAPPINESS_RESTORE_INTELLECTUAL: 5, NAVIGATION_GAIN_ADVENTURER: 1 },
            INTERACT_BOOKSHELF: { ENERGY_COST: 5, HAPPINESS_COST: 0, SKILL_GAIN: 1, HAPPINESS_RESTORE_INTELLECTUAL: 5 },
            INTERACT_PLANT: { ENERGY_COST: 5, HAPPINESS_RESTORE: 5, HAPPINESS_RESTORE_NURTURER: 5, SKILL_GAIN: 1 },
            INTERACT_FANCY_BOOKSHELF: { ENERGY_COST: 5, HAPPINESS_RESTORE: 10, HAPPINESS_RESTORE_INTELLECTUAL: 10, SKILL_GAIN: 2, PERSONALITY_GAIN: 1 },
            EXPLORE: { ENERGY_COST: 20, HAPPINESS_RESTORE_DEFAULT: 5, HAPPINESS_RESTORE_ADVENTURER: 15, HAPPINESS_PENALTY_RECLUSE: 5, SKILL_GAIN: 2 },
            MEDITATE: { ENERGY_RESTORE: 10, HAPPINESS_RESTORE: 5, SKILL_GAIN: 1, PERSONALITY_GAIN_RECLUSE: 1 },
            PRACTICE_HOBBY: { ENERGY_COST: 10, HAPPINESS_RESTORE: 10 },
            INTERACT_NPC: { ENERGY_COST: 5 }
        },
        MOOD_MULTIPLIERS: { HAPPY: 1.5, SAD: 0.5, ANGRY: 0.8, NEUTRAL: 1.0 },
        CAREER: { XP_PER_WORK: 100, PROMOTION_BONUS: 20 }
    }
}));

describe('Feature Enhancements', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Recluse');
        // Setup inventory
        pet.inventory = { 'Fancy Bookshelf': 1 };
    });

    test('returnItemToInventory should increase item count', () => {
        pet.inventory['Fancy Bookshelf'] = 0;

        pet.returnItemToInventory('Fancy Bookshelf');

        expect(pet.inventory['Fancy Bookshelf']).toBe(1);
    });

    test('returnItemToInventory should work if item was not in inventory map', () => {
        pet.inventory = {};

        pet.returnItemToInventory('Strange Lamp');

        expect(pet.inventory['Strange Lamp']).toBe(1);
    });

    // We can't easily test MainScene here without extensive mocking of Phaser.
    // However, we verified Nadagotchi.js logic which is the backend for the "Pickup" feature.
});
