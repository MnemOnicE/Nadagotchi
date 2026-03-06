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

    // Career System
    CAREER: {
        BASE_PAYOUT: 10,
        XP_PER_WORK: 20, // 5 days to reach lvl 2
        PROMOTION_BONUS: 50,
        WORK_HAPPINESS_BASE: 25,
        WORK_HAPPINESS_MIN: 5,
        SKILL_GAIN_BASE: 1.5,
        LEVEL_MULTIPLIERS: {
            1: 1.0,
            2: 1.1,
            3: 1.2,
            4: 1.3,
            5: 1.5
        }
    },

    // Minigame Settings
    MINIGAMES: {
        LOGIC_PUZZLE: {
            LEVEL_CAP: 5
        }
    },
    // Global Settings Defaults
    SETTINGS: {
        DEFAULT_VOLUME: 0.5,
        DEFAULT_SPEED: 0.5,
        SPEED_MULTIPLIERS: {
            NORMAL: 1.0,
            FAST: 2.0,
            HYPER: 5.0
        }
    },

    // Game Loop Constants
    GAME_LOOP: {
        TARGET_FPS: 60,
        MS_PER_FRAME: 1000 / 60,
        MAX_DELTA: 1000 * 60 * 60 // Cap simulation step to 1 hour to prevent death loops
    },

    // Timing Constants
    TIMING: {
        MOOD_OVERRIDE_MS: 3000,
        UI_THROTTLE_MS: 100
    },

    // Security & Hashing
    SECURITY: {
        // Loaded via environment variables in Vite (defined in vite.config.js) or process.env in Jest.
        // Falls back to a generic salt for development.
        DNA_SALT: (typeof process !== 'undefined' && process.env && process.env.VITE_DNA_SALT) || "DEVELOPMENT_ONLY_SALT"
    },

    // Debris & Environment
    DEBRIS: {
        SPAWN_CHANCE_DAILY: 0.8,
        MAX_COUNT: 10,
        HAPPINESS_PENALTY_PER_WEED: 0.005,
        HAPPINESS_PENALTY_PER_POOP: 0.02,
        CLEAN_ENERGY_COST: 5,
        CLEAN_SKILL_GAIN: 0.1
    },

    // UI Configuration
    UI: {
        DASHBOARD_HEIGHT_RATIO: 0.35, // Increased from 0.25 to prevent button overlap on mobile
        SAFE_AREA_TOP: 40 // Mobile Notch / Status Bar Offset (px)
    }
};
