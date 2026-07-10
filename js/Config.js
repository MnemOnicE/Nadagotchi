/**
 * @fileoverview Configuration constants for the Nadagotchi game.
 * Contains game balance settings, thresholds, decay rates, and modifier values.
 * Centralizes magic numbers to allow for easier tuning of the game economy and mechanics.
 */

export const Config = {
    // Feature Flags
    FEATURES: {
        PROCEDURAL_PETS: true,  // Enable procedurally generated pet appearance
        ANIMATED_PETS: true     // Enable pet animations (blinking, mood-based)
    },

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

    DESIRES: {
        TYPES: ['FEED', 'PLAY', 'STUDY', 'EXPLORE', 'MEDITATE'],
        REWARD_HAPPINESS: 10,
        REWARD_SKILL: 0.1,
        DURATION_MS: 60000
    },
    COMBOS: {
        STUDY_MULT: 2.0,
        EXPLORE_DISCOUNT: 0.5
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
        MAX_STATS_BONUS: 105, // e.g., energy with homozygous metabolism
        MAX_JOURNAL_ENTRIES: 100
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
        EXPEDITION: {
            LENGTH: 3,
            ENERGY_COST: 15
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

    // Mood Visuals (Centralized)
    MOOD_VISUALS: {
        DEFAULT_FRAME: 1,
        DEFAULT_EMOJI: '❓',
        FRAMES: {
            'happy': 0,
            'neutral': 1,
            'sad': 2,
            'angry': 3
        },
        EMOJIS: {
            'happy': '😊',
            'sad': '😢',
            'angry': '😠',
            'neutral': '😐'
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
        _dnaSalt: null,
        // Loaded via environment variables in Vite (defined in vite.config.js) or process.env in Jest.
        // Falls back to a dynamically generated local salt instead of a predictable string.
        get DNA_SALT() {
            if (this._dnaSalt !== null) return this._dnaSalt;
            if (typeof process !== 'undefined' && process.env && process.env.VITE_DNA_SALT) {
                if (process.env.VITE_DNA_SALT === "DEVELOPMENT_ONLY_SALT") {
                    throw new Error("SECURITY EXCEPTION: Hardcoded default salt 'DEVELOPMENT_ONLY_SALT' is not allowed.");
                }
                return process.env.VITE_DNA_SALT;
            }
            if (typeof localStorage !== 'undefined') {
                let salt = localStorage.getItem('nadagotchi_dna_salt');
                if (!salt) {
                    const array = new Uint32Array(4);
                    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
                        window.crypto.getRandomValues(array);
                    } else if (typeof process !== 'undefined' && typeof require !== 'undefined') {
                        try {
                            const crypto = require('crypto');
                            const bytes = crypto.randomBytes(16);
                            for (let i = 0; i < 4; i++) array[i] = bytes.readUInt32BE(i * 4);
                        } catch (e) {
                            for(let i=0; i<4; i++) array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
                        }
                    } else {
                        for(let i=0; i<4; i++) array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
                    }
                    salt = Array.from(array).map(b => b.toString(16).padStart(8, '0')).join('');
                    localStorage.setItem('nadagotchi_dna_salt', salt);
                }
                return salt;
            }
            throw new Error("SECURITY EXCEPTION: VITE_DNA_SALT environment variable is required and no secure local salt could be generated.");
        },
        set DNA_SALT(val) {
            this._dnaSalt = val;
        }
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

    // Weather Effects on Gameplay
    WEATHER_EFFECTS: {
        // Multipliers for foraging success in different weather
        FORAGING: {
            Sunny: 1.0,
            Cloudy: 1.0,
            Rainy: 1.5,  // More plants/berries grow in rain
            Stormy: 0.5  // Harder to forage in storms
        },
        // Multipliers for expedition rewards in different weather
        EXPEDITION: {
            Sunny: 1.0,
            Cloudy: 1.0,
            Rainy: 0.8,  // Fewer items found in rain
            Stormy: 0.5  // Dangerous to explore in storms
        },
        // Minigame difficulty modifiers
        MINIGAME: {
            Sunny: 1.0,
            Cloudy: 1.0,
            Rainy: 0.9,  // Slightly easier (slower pace)
            Stormy: 1.1  // Slightly harder (distractions)
        },
        // Stat decay modifiers
        STAT_DECAY: {
            Sunny: 1.0,
            Cloudy: 1.0,
            Rainy: 0.8,  // Slower decay when indoors more
            Stormy: 0.7  // Even slower decay
        }
    },

    // UI Configuration
    UI: {
        DASHBOARD_HEIGHT_RATIO: 0.45, // Increased from 0.40 to better accommodate mobile screens
        SAFE_AREA_TOP: 50, // Increased from 40 to better handle mobile notches
        SAFE_AREA_BOTTOM: 30, // Increased from 20 to better handle mobile navigation bars
        BUTTON_PADDING: 8, // Reduced from 10 for better space utilization
        BUTTON_ROW_SPACING: 55, // Reduced from 60 for better space utilization
        MODAL_MAX_WIDTH_RATIO: 0.9, // Max width ratio for modals on small screens
        MODAL_MAX_HEIGHT_RATIO: 0.75 // Reduced from 0.8 to better fit mobile screens
    }
};
