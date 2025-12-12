/**
 * @fileoverview Configuration constants for the Nadagotchi game.
 * Contains game balance settings, thresholds, decay rates, and modifier values.
 * Centralizes magic numbers to allow for easier tuning of the game economy and mechanics.
 */

export const Config = {
    // Game Start & Genetics
    INITIAL_STATE: {
        STATS: { hunger: 100, energy: 100, happiness: 70 },
        SKILLS: {
            communication: 1, resilience: 1, navigation: 0,
            empathy: 0, logic: 0, focus: 0, crafting: 0,
            research: 0
        },
        PERSONALITY_POINTS_STARTER: 10,
        MOOD_SENSITIVITY_DEFAULT: 5,
        GENOME_STARTER_VAL: 40 // To ensure dominance over wild (10-30)
    },

    GENETICS: {
        METABOLISM_NORMALIZER: 5,
        HOMOZYGOUS_ENERGY_BONUS: 5
    },

    // Stat Decay Rates
    DECAY: {
        HUNGER: 0.05,
        ENERGY: 0.02,
        AGE_INCREMENT: 0.001
    },

    // Thresholds
    THRESHOLDS: {
        HAPPY_MOOD: 80,
        HAPPY_MOOD_HOMOZYGOUS: 75,
        HUNGER_ANGRY: 10,
        HUNGER_SAD: 30,
        ENERGY_SAD: 20,
        AGE_LEGACY: 50
    },

    // Limits
    LIMITS: {
        MAX_STATS: 100,
        MAX_STATS_BONUS: 105 // e.g., energy with homozygous metabolism
    },

    // Action Effects
    ACTIONS: {
        FEED: {
            HUNGER_RESTORE: 15,
            HAPPINESS_RESTORE: 5
        },
        PLAY: {
            ENERGY_COST: 10,
            HAPPINESS_RESTORE: 10,
            RECLUSE_HAPPINESS_PENALTY: 15
        },
        STUDY: {
            ENERGY_COST: 5,
            HAPPINESS_COST: 5,
            HAPPINESS_RESTORE_INTELLECTUAL: 15,
            SKILL_GAIN: 0.1,
            NAVIGATION_GAIN_ADVENTURER: 0.05
        },
        INTERACT_BOOKSHELF: {
            ENERGY_COST: 5,
            HAPPINESS_COST: 5,
            HAPPINESS_RESTORE_INTELLECTUAL: 20,
            SKILL_GAIN: 0.15
        },
        INTERACT_PLANT: {
            ENERGY_COST: 5,
            HAPPINESS_RESTORE: 10,
            HAPPINESS_RESTORE_NURTURER: 20,
            SKILL_GAIN: 0.15
        },
        INTERACT_FANCY_BOOKSHELF: {
            ENERGY_COST: 5,
            HAPPINESS_RESTORE: 10,
            HAPPINESS_RESTORE_INTELLECTUAL: 25,
            SKILL_GAIN: 0.25,
            PERSONALITY_GAIN: 2
        },
        EXPLORE: {
            ENERGY_COST: 15,
            HAPPINESS_RESTORE_ADVENTURER: 20,
            HAPPINESS_RESTORE_DEFAULT: 5,
            HAPPINESS_PENALTY_RECLUSE: 20,
            SKILL_GAIN: 0.1
        },
        MEDITATE: {
            ENERGY_RESTORE: 5,
            HAPPINESS_RESTORE: 5,
            SKILL_GAIN: 0.1,
            PERSONALITY_GAIN_RECLUSE: 2
        },
        CRAFT: {
            ENERGY_COST: 15,
            HAPPINESS_RESTORE: 20,
            HAPPINESS_PENALTY_MISSING_MATS: 5,
            SKILL_GAIN: 0.5
        },
        PRACTICE_HOBBY: {
            ENERGY_COST: 5,
            HAPPINESS_RESTORE: 5
        },
        FORAGE: {
            ENERGY_COST: 10,
            SKILL_GAIN: 0.2
        },
        INTERACT_NPC: {
            ENERGY_COST: 5,
            GIFT_HAPPINESS: 10,
            GIFT_SKILL_GAIN: 0.2,
            GIFT_RELATIONSHIP: 5,
            CHAT_HAPPINESS: 3,
            CHAT_RELATIONSHIP: 1,
            CHAT_SKILL_GAIN: 0.1,
            FRIENDSHIP_DECAY: 0.5,
            QUEST_CRAFTING_GAIN: 2,
            QUEST_HAPPINESS_GAIN: 20,
            SCOUT_SKILL_GAIN: 0.15,
            ARTISAN_SKILL_GAIN: 0.15,
            VILLAGER_SKILL_GAIN: 0.15
        }
    },

    // Weather & Time Modifiers (per tick)
    ENV_MODIFIERS: {
        FESTIVAL_HAPPINESS: 0.02,
        RAINY: {
            ADVENTURER_HAPPINESS: -0.01,
            NURTURER_ENERGY_MULT: 0.5
        },
        STORMY: {
            ADVENTURER_HAPPINESS: -0.03,
            RECLUSE_HAPPINESS: 0.01,
            ENERGY_MULT: 1.2
        },
        CLOUDY: {
            ENERGY_MULT: 0.8
        },
        SUNNY: {
            ADVENTURER_HAPPINESS: 0.01,
            ENERGY_MULT: 1.1
        },
        NIGHT: {
            HUNGER_MULT: 0.5,
            RECLUSE_HAPPINESS: 0.01,
            ADVENTURER_ENERGY_MULT: 1.1
        },
        TWILIGHT: { // Dusk/Dawn
            ENERGY_MULT: 0.9
        },
        DAY: {
            INTELLECTUAL_ENERGY_MULT: 1.1
        }
    },

    // Trait Modifiers
    TRAITS: {
        PHOTOSYNTHETIC_MULT: 0.5,
        NIGHT_OWL_MULT: 0.8
    },

    // Mood Multipliers
    MOOD_MULTIPLIERS: {
        HAPPY: 1.5,
        SAD: 0.5,
        ANGRY: 0.2,
        NEUTRAL: 1.0
    },

    // Global Settings Defaults
    SETTINGS: {
        DEFAULT_VOLUME: 0.5,
        DEFAULT_SPEED: 1.0,
        SPEED_MULTIPLIERS: {
            NORMAL: 1.0,
            FAST: 2.0,
            HYPER: 5.0
        }
    },

    // Game Loop Constants
    GAME_LOOP: {
        TARGET_FPS: 60,
        MS_PER_FRAME: 1000 / 60
    },

    // Security & Hashing
    SECURITY: {
        DNA_SALT: "NADAGOTCHI_GENETICS_V1_SALT"
    }
};
