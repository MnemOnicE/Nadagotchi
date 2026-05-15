
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Config first
jest.mock('../js/Config.js', () => ({
    Config: {
        INITIAL_STATE: {
            STATS: { hunger: 100, energy: 100, happiness: 100 },
            SKILLS: { logic: 0, navigation: 0 },
            PERSONALITY_POINTS_STARTER: 10,
            MOOD_SENSITIVITY_DEFAULT: 5,
            GENOME_STARTER_VAL: 40
        },
        GENETICS: { METABOLISM_NORMALIZER: 5, HOMOZYGOUS_ENERGY_BONUS: 5 },
        LIMITS: { MAX_STATS: 100 },
        DECAY: { HUNGER: 0, ENERGY: 0, AGE_INCREMENT: 0 },
        SECURITY: { DNA_SALT: '' },
        THRESHOLDS: { HUNGER_ANGRY: 20, HUNGER_SAD: 40, ENERGY_SAD: 30 },
        ACTIONS: {
            FORAGE: { ENERGY_COST: 10, SKILL_GAIN: 0.1 },
            CRAFT: { ENERGY_COST: 10, HAPPINESS_RESTORE: 5, HAPPINESS_PENALTY_MISSING_MATS: 5, SKILL_GAIN: 0.1 }
        },
        MOOD_MULTIPLIERS: { HAPPY: 1.5, SAD: 0.5, ANGRY: 0.2, NEUTRAL: 1.0 },
        CAREER: { XP_PER_WORK: 20 }
    }
}));

// Mock Phaser
global.Phaser = {
    Math: {
        Between: () => 1
    }
};

const { Nadagotchi } = require('../js/Nadagotchi.js');
const { QuestSystem } = require('../js/systems/QuestSystem.js');

describe('Career and Quest Integration', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        // Mock RNG for deterministic results
        pet.rng = {
            choice: (arr) => arr[0], // Always pick first
            random: () => 0.5
        };
    });

    describe('Career System', () => {
        it('should allow switching careers if unlocked', () => {
            pet.unlockedCareers = ['Innovator', 'Scout'];
            pet.currentCareer = 'Innovator';

            const success = pet.switchCareer('Scout');
            expect(success).toBe(true);
            expect(pet.currentCareer).toBe('Scout');
        });

        it('should fail to switch if career is not unlocked', () => {
            pet.unlockedCareers = ['Innovator'];
            pet.currentCareer = 'Innovator';

            const success = pet.switchCareer('Healer');
            expect(success).toBe(false);
            expect(pet.currentCareer).toBe('Innovator');
        });
    });

    describe('Weather Quest System', () => {
        it('should generate weather-specific quests', () => {
            // Mock DailyQuestTemplates implicitly by relying on the file logic
            // But we need to ensure the RNG picks the weather one if available
            // In our implementation, we concat weather templates.
            // If we mock RNG choice to return the LAST element, we can target the new one?
            // Or we just rely on the fact that QuestSystem is using the imported definitions.

            // Let's force a weather scenario
            const weather = 'Rainy';
            const season = 'Spring';

            // We need to inspect QuestSystem logic or definitions.
            // But since we can't easily mock the *imported* definitions inside the module without complex Jest setup,
            // we will verify that passing 'Rainy' *calls* the logic.

            // Actually, we can check if the generated quest matches the Rainy template ID "dq_rainy_cocoa"
            // We need to trick the RNG to pick the rainy one.
            // The template list will be [Spring1, Spring2, Rainy1].
            // If RNG.choice returns the last one, we get Rainy.

            pet.rng.choice = (arr) => arr.find(q => q.id === 'dq_rainy_cocoa') || arr[0];

            const quest = pet.questSystem.generateDailyQuest(season, weather);

            expect(quest).not.toBeNull();
            expect(quest.id).toBe('dq_rainy_cocoa');
            expect(quest.text).toContain("Hot Cocoa");
        });

        it('should generate Winter specific firewood quest', () => {
            pet.rng.choice = (arr) => arr.find(q => q.id === 'dq_winter_firewood') || arr[0];

            const quest = pet.questSystem.generateDailyQuest('Winter', 'Sunny');
            expect(quest.id).toBe('dq_winter_firewood');
            expect(quest.item).toBe('Sticks');
        });
    });

    describe('Inventory Updates', () => {
        it('should forage Muse Flower in Autumn', () => {
            pet.currentSeason = 'Autumn';
            // Mock RNG to return Muse Flower
            pet.rng.choice = (arr) => 'Muse Flower';

            pet.forage();
            expect(pet.inventory['Muse Flower']).toBe(1);
        });

        it('should consume Hot Cocoa', () => {
             pet.inventory['Hot Cocoa'] = 1;
             const initialHappiness = pet.stats.happiness;

             pet.consumeItem('Hot Cocoa');

             expect(pet.inventory['Hot Cocoa']).toBeUndefined();
             // Config mock says nothing about Cocoa restore values, but logic adds 15
             // logic: happiness += 15.
             // Mock initial stats: 100.
             // 100 + 15 capped at 100.
             // We need to lower stats first.
             pet.stats.happiness = 50;
             pet.inventory['Hot Cocoa'] = 1;
             pet.consumeItem('Hot Cocoa');
             expect(pet.stats.happiness).toBe(65);
        });
    });
});
