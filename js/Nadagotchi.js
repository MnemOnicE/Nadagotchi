import { PersistenceManager } from './PersistenceManager.js';
import { Genome, GeneticsSystem } from './GeneticsSystem.js';
import { NarrativeSystem } from './NarrativeSystem.js';
import { Config } from './Config.js';
import { Recipes } from './ItemData.js';
import { CareerDefinitions } from './CareerDefinitions.js';
import { RoomDefinitions } from './RoomDefinitions.js';
import { SeededRandom } from './utils/SeededRandom.js';
import { RelationshipSystem } from './systems/RelationshipSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { DebrisSystem } from './systems/DebrisSystem.js';

/**
 * @fileoverview Core logic for the Nadagotchi pet.
 * Manages stats, state, skills, inventory, relationships, and lifecycle (live loop).
 * Acts as the central model for the game.
 */

/**
 * Represents the core Nadagotchi entity, its "Brain".
 * This class holds the Nadagotchi's state, including its personality, stats, skills, and more.
 * @class Nadagotchi
 */
export class Nadagotchi {
    /**
     * Creates a new Nadagotchi instance.
     * @param {string} initialArchetype - The initial archetype of the Nadagotchi (e.g., 'Adventurer').
     * @param {object} [loadedData=null] - Optional saved data to load from. If provided, overrides defaults.
     */
    constructor(initialArchetype, loadedData = null) {
        /** @type {boolean} Indicates if the asynchronous initialization is complete. */
        this.isInitialized = false;

        // --- RNG Initialization ---
        if (loadedData) {
             // Load the universe seed (The "Big Bang")
             this.universeSeed = loadedData.universeSeed || this._generateSeed(); // Migration for old saves
             this.rng = new SeededRandom(this.universeSeed);
             // Restore RNG state if available to ensure continuity
             if (loadedData.rng && loadedData.rng.state) {
                 this.rng.state = loadedData.rng.state;
             }
        } else {
             // New Game: Generate a new universe seed
             this.universeSeed = this._generateSeed();
             this.rng = new SeededRandom(this.universeSeed);
        }

        if (loadedData) {
            // This is a loaded pet. Populate all properties from the save file.
            /** @type {string} Unique identifier for this pet instance (Salt). */
            this.uuid = loadedData.uuid || this.generateUUID(); // Migration for old saves

            /** @type {string} The name of the pet. */
            this.name = loadedData.name || "Nadagotchi";

            /** @type {string} The pet's current mood (e.g., 'happy', 'sad'). */
            this.mood = loadedData.mood;
            /** @type {string} The dominant personality trait. */
            this.dominantArchetype = loadedData.dominantArchetype;
            /** @type {Object.<string, number>} A map of personality points for each archetype. */
            this.personalityPoints = loadedData.personalityPoints;
            /** @type {{hunger: number, energy: number, happiness: number}} The pet's core stats. */
            this.stats = loadedData.stats;
            /** @type {Object.<string, number>} A map of the pet's skills and their levels. */
            this.skills = loadedData.skills;
            // Legacy migration for Research skill
            if (this.skills.research === undefined) {
                this.skills.research = 0;
            }

            /** @type {?string} The pet's current career, if any. */
            this.currentCareer = loadedData.currentCareer;
            /** @type {Array<string>} List of careers the pet has unlocked. */
            this.unlockedCareers = loadedData.unlockedCareers || (this.currentCareer ? [this.currentCareer] : []);
            /** @type {Object.<string, number>} Current level in each career. */
            this.careerLevels = loadedData.careerLevels || {};
            /** @type {Object.<string, number>} Current XP in each career. */
            this.careerXP = loadedData.careerXP || {};

            // Migration: Ensure active career has level data
            if (this.currentCareer && !this.careerLevels[this.currentCareer]) {
                this.careerLevels[this.currentCareer] = 1;
                this.careerXP[this.currentCareer] = 0;
            }

            /** @type {?object} The active daily quest. */
            this.dailyQuest = loadedData.dailyQuest || null;

            /** @type {Object.<string, number>} The items the pet is currently holding. */
            this.inventory = loadedData.inventory || {};
            /** @type {number} The pet's age. */
            this.age = loadedData.age;
            /** @type {number} The generation number of the pet. */
            this.generation = loadedData.generation || 1;
            /** @type {boolean} Whether the pet is ready for the legacy/breeding system. */
            this.isLegacyReady = loadedData.isLegacyReady || false;
            /** @type {Array<string>} Special traits inherited from ancestors. */
            this.legacyTraits = loadedData.legacyTraits || [];
             /** @type {number} A 1-10 scale affecting mood swing intensity. */
            this.moodSensitivity = loadedData.moodSensitivity || Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;

            // Initialize Genome
            if (loadedData.genome) {
                if (loadedData.genome.genotype) {
                     // New Genome format
                     // Pass loaded phenotype if available to avoid random recalculation
                     const phenotype = loadedData.genome.phenotype || null;
                     this.genome = new Genome(loadedData.genome.genotype, phenotype, this.rng);
                } else {
                    // Legacy migration: Create homozygous genotype from old data
                    const migratedGenotype = {};
                    // Personality
                    ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'].forEach(trait => {
                         const val = loadedData.genome.personalityGenes ? (loadedData.genome.personalityGenes[trait] || 0) : 0;
                         migratedGenotype[trait] = [val, val];
                    });
                    // Physio
                    const moodSens = loadedData.genome.moodSensitivity || Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;
                    migratedGenotype.moodSensitivity = [moodSens, moodSens];
                    migratedGenotype.metabolism = [Config.GENETICS.METABOLISM_NORMALIZER, Config.GENETICS.METABOLISM_NORMALIZER]; // Default 5
                    migratedGenotype.specialAbility = [null, null];

                    // Attempt to preserve legacy trait
                    if (loadedData.genome.legacyTraits && loadedData.genome.legacyTraits.length > 0) {
                        const trait = loadedData.genome.legacyTraits[0];
                        migratedGenotype.specialAbility = [trait, trait];
                    }

                    this.genome = new Genome(migratedGenotype, null, this.rng);
                }
            } else {
                // Should not happen for valid saves, but fallback
                this.genome = new Genome(null, null, this.rng);
            }

            // --- Home Config Migration ---
            if (loadedData.homeConfig && loadedData.homeConfig.rooms) {
                 this.homeConfig = loadedData.homeConfig;
            } else if (loadedData.homeConfig) {
                 // Partially migrated or legacy flat structure
                 this.homeConfig = this._migrateHomeConfig(loadedData.homeConfig);
            } else {
                 // Load default or try Persistence (for very old saves where it was separate)
                 // NOTE: Ideally PersistenceManager should have passed it in `loadedData`.
                 // If not, we initialize defaults.
                 this.homeConfig = this._migrateHomeConfig({});
            }


        } else {
            // This is a brand new game. Start from defaults.
            this.uuid = this.generateUUID();
            this.name = "Nadagotchi"; // Default, can be overridden immediately after
            this.mood = 'neutral';
            this.dominantArchetype = initialArchetype;
            this.personalityPoints = {
                Adventurer: 0, Nurturer: 0, Mischievous: 0,
                Intellectual: 0, Recluse: 0
            };
            this.personalityPoints[initialArchetype] = Config.INITIAL_STATE.PERSONALITY_POINTS_STARTER;

            // Clone initial stats from Config to avoid reference issues
            this.stats = { ...Config.INITIAL_STATE.STATS };
            this.skills = { ...Config.INITIAL_STATE.SKILLS };

            this.currentCareer = null;
            this.unlockedCareers = [];
            this.careerLevels = {};
            this.careerXP = {};
            this.dailyQuest = null;
            this.inventory = {};
            this.age = 0;
            this.generation = 1;
            this.isLegacyReady = false;
            this.legacyTraits = [];
            this.moodSensitivity = Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;

            // Initialize Genome for new game
            // Start with random defaults (using RNG), then bias towards the chosen starter
            this.genome = new Genome(null, null, this.rng);
            // Boost the dominant archetype to ensure it wins against the wild traits (10-30)
            if (this.genome.genotype[initialArchetype]) {
                const val = Config.INITIAL_STATE.GENOME_STARTER_VAL;
                this.genome.genotype[initialArchetype] = [val, val];
            }
            // Recalculate phenotype after manual genotype modification
            this.genome.phenotype = this.genome.calculatePhenotype(this.rng);

            // Initialize Home Config
            this.homeConfig = {
                rooms: {
                    "Entryway": {
                        wallpaper: 'wallpaper_default',
                        flooring: 'flooring_default',
                        wallpaperItem: 'Default',
                        flooringItem: 'Default'
                    }
                }
            };
        }

        /** @type {{hunger: number, energy: number, happiness: number}} Maximum values for stats. */
        this.maxStats = { hunger: Config.LIMITS.MAX_STATS, energy: Config.LIMITS.MAX_STATS, happiness: Config.LIMITS.MAX_STATS };
        if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousMetabolism) {
            this.maxStats.energy += Config.GENETICS.HOMOZYGOUS_ENERGY_BONUS;
        }

        /** @type {?string} A flag used by the UI to show a one-time notification when a career is unlocked. */
        this.newCareerUnlocked = null;

        /** @type {PersistenceManager} Manages saving and loading game data. */
        this.persistence = new PersistenceManager();

        // --- Async Data Holders (Initialized in init()) ---
        /** @type {Array<{date: string, text: string}>} A log of significant events. */
        this.journal = [];
        /** @type {Array<string>} A list of crafting recipes the pet has discovered. */
        this.discoveredRecipes = [];

        /** @type {Object.<string, {materials: Object.<string, number>, description: string}>} */
        this.recipes = Recipes;

        /** @type {{painting: number, music: number}} A map of hobby levels. */
        this.hobbies = loadedData ? loadedData.hobbies : { painting: 0, music: 0 };
        /** @type {Object.<string, {level: number}>} A map of relationships with NPCs. */
        this.relationships = loadedData ? loadedData.relationships : {
            'Grizzled Scout': { level: 0 },
            'Master Artisan': { level: 0 },
            'Sickly Villager': { level: 0 }
        };

        // Initialize Relationship System (Logic Extracted)
        // We make it non-enumerable so it is not saved to JSON automatically
        Object.defineProperty(this, 'relationshipSystem', {
            value: new RelationshipSystem(this),
            enumerable: false,
            writable: true
        });

        // Initialize Inventory System (Logic Extracted)
        Object.defineProperty(this, 'inventorySystem', {
            value: new InventorySystem(this),
            enumerable: false,
            writable: true
        });

        /** @type {Object.<string, object>} A map of active quests. */
        this.quests = (loadedData && loadedData.quests) ? loadedData.quests : {};

        // Initialize Quest System (Logic Extracted)
        Object.defineProperty(this, 'questSystem', {
            value: new QuestSystem(this),
            enumerable: false,
            writable: true
        });

        /** @type {Array<object>} Debris items in the world (weeds, rocks, etc.). */
        this.debris = loadedData ? (loadedData.debris || []) : [];

        // Initialize Debris System
        Object.defineProperty(this, 'debrisSystem', {
            value: new DebrisSystem(this),
            enumerable: false,
            writable: true
        });

        // Optimization: Cleanliness Penalty Caching
        this.recalculateCleanlinessPenalty();


        /** @type {string} The pet's current location. */
        this.location = loadedData ? loadedData.location : 'GARDEN';
        // Migration: Treat 'Home' as 'GARDEN'
        if (this.location === 'Home') this.location = 'GARDEN';

        // --- Runtime State Tracking (Not persisted) ---
        /** @type {?string} Tracks the last known weather to detect changes. */
        this.lastWeather = null;
        /** @type {number} Tracks the integer age to detect milestones. */
        this.previousAge = Math.floor(this.age);
        /** @type {string} Tracks the current season for seasonal logic. */
        this.currentSeason = 'Spring';

        /** @type {?string} Temporarily overrides the calculated mood (e.g., 'happy' after playing). */
        this.moodOverride = null;
        /** @type {number} Time in ms remaining for the mood override. */
        this.moodOverrideTimer = 0;

        /** @type {boolean} Internal flag to batch journal saves. */
        this._journalSavePending = false;
    }

    /**
     * Asynchronously initializes heavy/external data (Journal, Recipes).
     * MUST be called after constructor.
     * @returns {Promise<void>}
     */
    async init() {
        this.journal = await this.persistence.loadJournal();
        this.discoveredRecipes = await this.persistence.loadRecipes();

        // Ensure default recipes are discovered for new games
        if (this.discoveredRecipes.length === 0) {
            this.discoveredRecipes.push("Fancy Bookshelf");
            await this.persistence.saveRecipes(this.discoveredRecipes);
        }

        this.isInitialized = true;
    }

    /**
     * Helper to migrate legacy home config data to the new room-based structure.
     * @param {object} data
     * @returns {object}
     * @private
     */
    _migrateHomeConfig(data) {
        // Default State
        const defaultState = {
            rooms: {
                "Entryway": {
                    wallpaper: 'wallpaper_default',
                    flooring: 'flooring_default',
                    wallpaperItem: 'Default',
                    flooringItem: 'Default',
                    unlocked: true
                }
            }
        };

        if (!data) return defaultState;

        // Migration: If data has 'wallpaper' at root level (Legacy)
        if (data.wallpaper || data.flooring) {
            return {
                rooms: {
                    "Entryway": {
                        wallpaper: data.wallpaper || 'wallpaper_default',
                        flooring: data.flooring || 'flooring_default',
                        wallpaperItem: data.wallpaperItem || 'Default',
                        flooringItem: data.flooringItem || 'Default',
                        unlocked: true
                    }
                }
            };
        }

        // Ensure rooms object exists if partial data
        if (!data.rooms) return defaultState;

        return data;
    }

    /**
     * Generates a random seed for the universe.
     * Uses Math.random() as the bootstrap entropy source.
     * @returns {number} A large random integer.
     * @private
     */
    _generateSeed() {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    /**
     * Generates a deterministic UUID for the pet using the seeded RNG.
     * @returns {string} A unique identifier.
     */
    generateUUID() {
        // Deterministic UUID generation using SeededRandom
        const chars = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid += '-';
            } else if (i === 14) {
                uuid += '4';
            } else if (i === 19) {
                // (r & 0x3 | 0x8) logic
                const r = this.rng.range(0, 16);
                uuid += chars[(r & 0x3) | 0x8];
            } else {
                uuid += chars[this.rng.range(0, 16)];
            }
        }
        return uuid;
    }

    /**
     * Calculates data for the offspring of this Nadagotchi.
     * Uses the GeneticsSystem to determine traits and stats based on inheritance.
     * @param {string[]} environmentalFactors - List of items present during breeding (e.g., from inventory).
     * @returns {object} The data object for the new Nadagotchi.
     */
    calculateOffspring(environmentalFactors) {
        // Security Fix: Filter environmental factors to ensure they are present in inventory.
        // Prevents injection of items the user doesn't own.
        const validFactors = environmentalFactors.filter(item => this.inventory[item] && this.inventory[item] > 0);

        // Pass the RNG to GeneticsSystem.breed
        const childGenome = GeneticsSystem.breed(this.genome, validFactors, this.rng);
        const childPhenotype = childGenome.phenotype;

        // Determine dominant archetype from the phenotype
        let maxScore = -1;
        let dominant = 'Adventurer'; // Default
        const personalityKeys = ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'];

        for (const type of personalityKeys) {
            if (childPhenotype[type] > maxScore) {
                maxScore = childPhenotype[type];
            }
        }

        const contenders = personalityKeys.filter(type => childPhenotype[type] === maxScore);
        if (contenders.length > 0) {
            // Use RNG for deterministic tie-breaking
            dominant = this.rng.choice(contenders);
        }

        // Initialize personality points based on phenotype
        const initialPoints = {};
        personalityKeys.forEach(key => initialPoints[key] = childPhenotype[key]);

        // Legacy Traits from Phenotype
        const newLegacyTraits = [];
        if (childPhenotype.specialAbility) {
            newLegacyTraits.push(childPhenotype.specialAbility);
        }

        // Initialize Home Config for Child (Inherit nothing? Or default?)
        // Default for new life.
        const initialHomeConfig = {
            rooms: {
                "Entryway": {
                    wallpaper: 'wallpaper_default',
                    flooring: 'flooring_default',
                    wallpaperItem: 'Default',
                        flooringItem: 'Default',
                        unlocked: true
                }
            }
        };

        return {
            uuid: this.generateUUID(), // New UUID for the child
            mood: 'neutral',
            dominantArchetype: dominant,
            personalityPoints: initialPoints,
            stats: { ...Config.INITIAL_STATE.STATS },
            skills: { ...Config.INITIAL_STATE.SKILLS },
            currentCareer: null,
            inventory: {},
            age: 0,
            generation: this.generation + 1,
            isLegacyReady: false,
            legacyTraits: newLegacyTraits,
            moodSensitivity: childPhenotype.moodSensitivity,
            hobbies: { painting: 0, music: 0 },
            relationships: {
                'Grizzled Scout': { level: 0 },
                'Master Artisan': { level: 0 },
                'Sickly Villager': { level: 0 }
            },
            quests: {}, // Quests reset for new generation
            location: 'Home',
            genome: childGenome,
            homeConfig: initialHomeConfig,
            // Pass the parent's universe seed to the child to maintain the "Timeline"?
            // Or let the child generate a new one?
            // "If you share an 'Egg' (a seed), the recipient must generate the exact same pet."
            // The logic above creates the data. MainScene uses this data to instantiate a new Nadagotchi.
            // MainScene: new Nadagotchi(null, newPetData).
            // Nadagotchi constructor will use newPetData.universeSeed if present, or generate new.
            // If we want the child to be deterministic from this point, we should probably pass a derived seed.
            // Let's generate a seed for the child using our RNG.
            universeSeed: this.rng.range(0, Number.MAX_SAFE_INTEGER)
        };
    }

    /**
     * Simulates the passage of time for the Nadagotchi.
     * This method should be called in the main game loop. It handles stat decay, mood changes, and aging.
     * @param {number} dt - The time elapsed since the last update in milliseconds.
     * @param {object} [worldState={ weather: "Sunny", time: "Day", activeEvent: null }] - An object containing information about the game world.
     * @param {string} worldState.weather - The current weather (e.g., "Sunny", "Rainy").
     * @param {string} worldState.time - The current time of day (e.g., "Day", "Night").
     * @param {?object} worldState.activeEvent - The currently active world event, if any.
     */
    live(dt, worldState = { weather: "Sunny", time: "Day", activeEvent: null }) {
        // Fallback for legacy calls or tests omitting dt
        if (typeof dt === 'object') {
             worldState = dt;
             dt = Config.GAME_LOOP.MS_PER_FRAME;
        } else if (dt === undefined) {
             dt = Config.GAME_LOOP.MS_PER_FRAME;
        }

        const ticksPassed = dt / Config.GAME_LOOP.MS_PER_FRAME;
        const oldMood = this.mood;

        if (worldState.season) {
            this.currentSeason = worldState.season;
        }

        // 1. Setup Base Decay Rates
        let hungerDecay = Config.DECAY.HUNGER * ticksPassed;
        let energyDecay = Config.DECAY.ENERGY * ticksPassed;
        let happinessChange = 0;

        // 2. Get Metabolism Factor from Genome (Phenotype)
        // Range 1 (Slow) to 10 (Fast). Normalize to 0.2x - 2.0x multiplier.
        let metabolismMult = 1.0;
        if (this.genome && this.genome.phenotype && this.genome.phenotype.metabolism) {
            metabolismMult = (this.genome.phenotype.metabolism / Config.GENETICS.METABOLISM_NORMALIZER);
        }

        // 3. Check Passive Traits
        let traitModifier = 1.0;
        const activeTrait = this.genome && this.genome.phenotype ? this.genome.phenotype.specialAbility : null;

        if (activeTrait === "Photosynthetic" && worldState.time === "Day") {
            traitModifier = Config.TRAITS.PHOTOSYNTHETIC_MULT; // 50% less energy drain
        } else if (activeTrait === "Night Owl" && worldState.time === "Night") {
            traitModifier = Config.TRAITS.NIGHT_OWL_MULT; // 20% less energy drain
        }

        if (worldState.activeEvent && worldState.activeEvent.name.includes('Festival')) {
            this.stats.happiness += Config.ENV_MODIFIERS.FESTIVAL_HAPPINESS * ticksPassed;
        }

        switch (worldState.weather) {
            case "Rainy":
                if (this.dominantArchetype === "Adventurer") happinessChange += Config.ENV_MODIFIERS.RAINY.ADVENTURER_HAPPINESS * ticksPassed;
                if (this.dominantArchetype === "Nurturer") energyDecay *= Config.ENV_MODIFIERS.RAINY.NURTURER_ENERGY_MULT;
                break;
            case "Stormy":
                if (this.dominantArchetype === "Adventurer") happinessChange += Config.ENV_MODIFIERS.STORMY.ADVENTURER_HAPPINESS * ticksPassed;
                if (this.dominantArchetype === "Recluse") happinessChange += Config.ENV_MODIFIERS.STORMY.RECLUSE_HAPPINESS * ticksPassed;
                energyDecay *= Config.ENV_MODIFIERS.STORMY.ENERGY_MULT;
                break;
            case "Cloudy":
                energyDecay *= Config.ENV_MODIFIERS.CLOUDY.ENERGY_MULT;
                break;
            case "Sunny":
                if (this.dominantArchetype === "Adventurer") happinessChange += Config.ENV_MODIFIERS.SUNNY.ADVENTURER_HAPPINESS * ticksPassed;
                energyDecay *= Config.ENV_MODIFIERS.SUNNY.ENERGY_MULT;
                break;
        }

        switch (worldState.time) {
            case "Night":
                hungerDecay *= Config.ENV_MODIFIERS.NIGHT.HUNGER_MULT;
                if (this.dominantArchetype === "Recluse") happinessChange += Config.ENV_MODIFIERS.NIGHT.RECLUSE_HAPPINESS * ticksPassed;
                if (this.dominantArchetype === "Adventurer") energyDecay *= Config.ENV_MODIFIERS.NIGHT.ADVENTURER_ENERGY_MULT;
                break;
            case "Dusk":
            case "Dawn":
                energyDecay *= Config.ENV_MODIFIERS.TWILIGHT.ENERGY_MULT;
                break;
            case "Day":
                if (this.dominantArchetype === "Intellectual") energyDecay *= Config.ENV_MODIFIERS.DAY.INTELLECTUAL_ENERGY_MULT;
                break;
        }

        // 4. Apply Final Decays
        // Debris Penalties
        // Debris Penalties
        // Optimization: Use cached values. Local debris hurts twice as much (Global + Local).
        let cleanlinessPenalty = this._cachedGlobalPenalty + (this._cachedLocalPenalties[this.location] || 0);

        this.stats.hunger -= (hungerDecay * metabolismMult);
        this.stats.energy -= (energyDecay * metabolismMult * traitModifier);
        this.stats.happiness += (happinessChange - (cleanlinessPenalty * ticksPassed));

        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;
        if (this.stats.happiness < 0) this.stats.happiness = 0;
        if (this.stats.happiness > this.maxStats.happiness) this.stats.happiness = this.maxStats.happiness;

        // Mood Calculation with Override Logic
        if (this.moodOverrideTimer > 0) {
            this.mood = this.moodOverride;
            this.moodOverrideTimer -= dt;
            if (this.moodOverrideTimer <= 0) {
                this.moodOverride = null;
                // Mood will naturally recalculate next frame
            }
        } else {
            // Standard Stat-based Mood Calculation
            const sensitivity = (this.genome && this.genome.phenotype) ? this.genome.phenotype.moodSensitivity : Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;
            // Homozygous MoodSensitivity Bonus: Faster recovery (lower threshold for happiness)
            let happyThreshold = Config.THRESHOLDS.HAPPY_MOOD;
            if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousMoodSensitivity) {
                happyThreshold = Config.THRESHOLDS.HAPPY_MOOD_HOMOZYGOUS;
            }

            if (this.stats.hunger < Config.THRESHOLDS.HUNGER_ANGRY) {
                this.mood = 'angry';
            } else if (this.stats.hunger < Config.THRESHOLDS.HUNGER_SAD || this.stats.energy < Config.THRESHOLDS.ENERGY_SAD) {
                this.mood = 'sad';
            } else if (this.stats.hunger > happyThreshold && this.stats.energy > happyThreshold) {
                this.mood = 'happy';
            } else {
                this.mood = 'neutral';
            }
        }

        this.age += Config.DECAY.AGE_INCREMENT * ticksPassed;
        if (this.age > Config.THRESHOLDS.AGE_LEGACY && !this.isLegacyReady) {
            this.isLegacyReady = true;
        }

        // --- Automated Journal Logging ---

        // 1. Mood Change
        if (this.mood !== oldMood) {
            this._logAutoEntry('MOOD_CHANGE', { newMood: this.mood });
        }

        // 2. Weather Change
        // Only log if we have a previous weather state (prevents logging on game load)
        if (this.lastWeather !== null && this.lastWeather !== worldState.weather) {
            this._logAutoEntry('WEATHER_CHANGE', { weather: worldState.weather });
        }
        this.lastWeather = worldState.weather;

        // 3. Age Milestone (Integer increments)
        if (Math.floor(this.age) > this.previousAge) {
            this._logAutoEntry('AGE_MILESTONE', { age: Math.floor(this.age) });
            this.previousAge = Math.floor(this.age);
        }
    }

    /**
     * Helper to generate and add an automated journal entry.
     * @param {string} type - The event type.
     * @param {object} context - Context data for the event.
     * @private
     */
    _logAutoEntry(type, context) {
        const text = NarrativeSystem.generateEntry(this.dominantArchetype, type, context);
        if (text) {
            this.addJournalEntry(text);
        }
    }

    /**
     * Handles a player-initiated action, updating the Nadagotchi's state accordingly.
     * @param {string} actionType - The type of action (e.g., 'FEED', 'PLAY', 'STUDY').
     * @param {*} [item=null] - An optional item or data used in the action.
     */
    handleAction(actionType, item = null) {
        let moodMultiplier;
        let actionSetMood = null; // Track if we set a mood to trigger override

        switch (actionType.toUpperCase()) {
            case 'FEED':
                this.stats.hunger = Math.min(this.maxStats.hunger, this.stats.hunger + Config.ACTIONS.FEED.HUNGER_RESTORE);
                this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.FEED.HAPPINESS_RESTORE);
                if (this.dominantArchetype === 'Nurturer') this.personalityPoints.Nurturer++;
                actionSetMood = 'happy'; // Food makes you happy!
                break;

            case 'PLAY':
                if (this.stats.energy < Config.ACTIONS.PLAY.ENERGY_COST) return;
                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.PLAY.ENERGY_COST);
                this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.PLAY.HAPPINESS_RESTORE);

                // Homozygous Mischievous Bonus: "Energy Recovery" (Refund half energy)
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousMischievous) {
                     this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + 5);
                }

                if (['Adventurer', 'Mischievous'].includes(this.dominantArchetype)) {
                    actionSetMood = 'happy';
                    this.personalityPoints[this.dominantArchetype]++;
                } else if (this.dominantArchetype === 'Recluse') {
                    actionSetMood = 'sad';
                    this.stats.happiness -= Config.ACTIONS.PLAY.RECLUSE_HAPPINESS_PENALTY;
                } else {
                    actionSetMood = 'happy'; // General play is happy for most
                }
                break;

            case 'STUDY':
                if (this.stats.energy < Config.ACTIONS.STUDY.ENERGY_COST) return;
                if (this.stats.happiness < Config.ACTIONS.STUDY.HAPPINESS_COST) return;

                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.STUDY.ENERGY_COST);
                this.stats.happiness = Math.max(0, this.stats.happiness - Config.ACTIONS.STUDY.HAPPINESS_COST);
                moodMultiplier = this.getMoodMultiplier();
                this.skills.logic += (Config.ACTIONS.STUDY.SKILL_GAIN * moodMultiplier);
                this.skills.research += (Config.ACTIONS.STUDY.SKILL_GAIN * moodMultiplier);

                // Homozygous Intellectual Bonus: Slight boost to mood recovery (Happiness)
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousIntellectual) {
                    this.stats.happiness += 5;
                }

                if (this.dominantArchetype === 'Intellectual') {
                    actionSetMood = 'happy';
                    this.personalityPoints.Intellectual++;
                    this.stats.happiness += Config.ACTIONS.STUDY.HAPPINESS_RESTORE_INTELLECTUAL;
                } else {
                    this.personalityPoints.Intellectual++;
                }

                if (this.dominantArchetype === 'Adventurer') {
                    this.skills.navigation += (Config.ACTIONS.STUDY.NAVIGATION_GAIN_ADVENTURER * moodMultiplier);
                }

                // Use RNG for recipe discovery
                if (this.rng.random() < 0.05) this.discoverRecipe("Logic-Boosting Snack");
                break;

            case 'INTERACT_BOOKSHELF':
                if (this.stats.energy < Config.ACTIONS.INTERACT_BOOKSHELF.ENERGY_COST) return;
                if (this.stats.happiness < Config.ACTIONS.INTERACT_BOOKSHELF.HAPPINESS_COST) return;

                this.stats.energy -= Config.ACTIONS.INTERACT_BOOKSHELF.ENERGY_COST;
                this.stats.happiness -= Config.ACTIONS.INTERACT_BOOKSHELF.HAPPINESS_COST;
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += Config.ACTIONS.INTERACT_BOOKSHELF.HAPPINESS_RESTORE_INTELLECTUAL;
                    actionSetMood = 'happy';
                }
                moodMultiplier = this.getMoodMultiplier();
                this.skills.logic += (Config.ACTIONS.INTERACT_BOOKSHELF.SKILL_GAIN * moodMultiplier);
                this.skills.research += (Config.ACTIONS.INTERACT_BOOKSHELF.SKILL_GAIN * moodMultiplier);
                this.personalityPoints.Intellectual++;
                break;

            case 'INTERACT_PLANT':
                if (this.stats.energy < Config.ACTIONS.INTERACT_PLANT.ENERGY_COST) return;

                this.stats.energy -= Config.ACTIONS.INTERACT_PLANT.ENERGY_COST;
                this.stats.happiness += Config.ACTIONS.INTERACT_PLANT.HAPPINESS_RESTORE;
                if (this.dominantArchetype === 'Nurturer') {
                    this.stats.happiness += Config.ACTIONS.INTERACT_PLANT.HAPPINESS_RESTORE_NURTURER;
                    actionSetMood = 'happy';
                } else {
                    actionSetMood = 'happy'; // Plants are nice
                }
                // Apply mood immediately for calculation if this action makes us happy
                if (actionSetMood) this.mood = actionSetMood;

                moodMultiplier = this.getMoodMultiplier();
                this.skills.empathy += (Config.ACTIONS.INTERACT_PLANT.SKILL_GAIN * moodMultiplier);

                // Homozygous Nurturer Bonus: Boost Empathy Gain
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousNurturer) {
                    this.skills.empathy += 0.2;
                }

                this.personalityPoints.Nurturer++;
                break;

            case 'INTERACT_FANCY_BOOKSHELF':
                if (this.stats.energy < Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.ENERGY_COST) return;

                this.stats.energy -= Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.ENERGY_COST;
                this.stats.happiness += Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.HAPPINESS_RESTORE; // It's a nice bookshelf!
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.HAPPINESS_RESTORE_INTELLECTUAL; // Even better for intellectuals
                    actionSetMood = 'happy';
                }
                moodMultiplier = this.getMoodMultiplier();
                this.skills.logic += (Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.SKILL_GAIN * moodMultiplier); // Higher buff
                this.skills.research += (Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.SKILL_GAIN * moodMultiplier);
                this.personalityPoints.Intellectual += Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.PERSONALITY_GAIN;
                this.addJournalEntry("I spent some time studying at my beautiful new bookshelf. I feel so smart!");
                break;

            case 'EXPLORE':
                if (this.stats.energy < Config.ACTIONS.EXPLORE.ENERGY_COST) return;

                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.EXPLORE.ENERGY_COST);

                // Homozygous Adventurer Bonus: Boost Happiness Gain
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousAdventurer) {
                    this.stats.happiness += 10;
                }

                if (this.dominantArchetype === 'Adventurer') {
                    actionSetMood = 'happy';
                    this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_ADVENTURER;
                    this.personalityPoints.Adventurer += 2;
                    this.skills.navigation += Config.ACTIONS.EXPLORE.SKILL_GAIN;
                    // Use RNG for recipe discovery
                    if (this.rng.random() < 0.1) this.discoverRecipe("Stamina-Up Tea");
                } else if (this.dominantArchetype === 'Recluse') {
                    actionSetMood = 'sad';
                    this.stats.happiness -= Config.ACTIONS.EXPLORE.HAPPINESS_PENALTY_RECLUSE;
                } else {
                    this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_DEFAULT;
                    actionSetMood = 'happy';
                }
                break;

            case "MEDITATE":
                this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + Config.ACTIONS.MEDITATE.ENERGY_RESTORE);
                this.stats.happiness += Config.ACTIONS.MEDITATE.HAPPINESS_RESTORE;
                moodMultiplier = this.getMoodMultiplier();
                this.skills.focus += (Config.ACTIONS.MEDITATE.SKILL_GAIN * moodMultiplier);
                if (this.dominantArchetype === "Recluse") {
                    this.personalityPoints.Recluse += Config.ACTIONS.MEDITATE.PERSONALITY_GAIN_RECLUSE;
                    actionSetMood = 'happy';
                }

                // Homozygous Recluse Bonus: Boost Focus Gain
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousRecluse) {
                    this.skills.focus += 0.2;
                }

                if (this.dominantArchetype === "Recluse") this.personalityPoints.Recluse += 2;
                break;

            case "CRAFT_ITEM":
                this.craftItem(item);
                actionSetMood = 'happy';
                break;

            case "CONSUME_ITEM":
                this.consumeItem(item);
                break;

            case 'PRACTICE_HOBBY':
                this.practiceHobby(item);
                actionSetMood = 'happy';
                break;

            case 'FORAGE':
                this.forage();
                actionSetMood = 'happy';
                break;
        }

        // Apply Mood Override
        if (actionSetMood) {
            this.mood = actionSetMood;
            this.moodOverride = actionSetMood;
            this.moodOverrideTimer = Config.TIMING.MOOD_OVERRIDE_MS;
        }

        this.stats.happiness = Math.max(0, Math.min(this.maxStats.happiness, this.stats.happiness));
        this.updateDominantArchetype();
        this.updateCareer();
    }

    /**
     * Processes the results of a work shift.
     * Calculates stats, skills, and promotion logic, removing "God Class" logic from MainScene.
     * @param {object} result - The work result object { success, career, craftedItem }.
     * @returns {object} Summary of changes { happinessGain, skillUp, promoted, message }.
     */
    completeWorkShift(result) {
        if (!result.career) return null;

        const summary = {
            success: result.success,
            happinessChange: 0,
            skillUp: '',
            promoted: false,
            message: ''
        };

        if (result.success) {
            // Happiness with diminishing returns
            const maxHappiness = this.maxStats.happiness;
            const currentHappiness = this.stats.happiness;
            // 25 * (1 - ratio), min 5
            const rawGain = Config.CAREER.WORK_HAPPINESS_BASE * (1 - (currentHappiness / maxHappiness));
            summary.happinessChange = Math.max(Config.CAREER.WORK_HAPPINESS_MIN, rawGain);
            this.stats.happiness = Math.min(maxHappiness, currentHappiness + summary.happinessChange);

            // Skill Gain with diminishing returns based on level
            // Formula: Base * (20 / (20 + Level))
            const calculateSkillGain = (currentLevel, baseGain) => {
                return baseGain * (20 / (20 + currentLevel));
            };
            const baseSkillGain = Config.CAREER.SKILL_GAIN_BASE;

            switch (result.career) {
                case 'Innovator':
                    summary.skillUp = 'logic';
                    this.skills.logic += calculateSkillGain(this.skills.logic, baseSkillGain);
                    break;
                case 'Scout':
                    summary.skillUp = 'navigation';
                    this.skills.navigation += calculateSkillGain(this.skills.navigation, baseSkillGain);
                    break;
                case 'Archaeologist':
                    summary.skillUp = 'research & navigation';
                    this.skills.research += calculateSkillGain(this.skills.research, 1.0); // Slightly lower split gain
                    this.skills.navigation += calculateSkillGain(this.skills.navigation, 1.0);
                    break;
                case 'Healer':
                    summary.skillUp = 'empathy';
                    this.skills.empathy += calculateSkillGain(this.skills.empathy, baseSkillGain);
                    break;
                case 'Artisan':
                    summary.skillUp = 'crafting';
                    this.skills.crafting += calculateSkillGain(this.skills.crafting, baseSkillGain);
                    if (result.craftedItem) {
                        this.handleAction("CRAFT_ITEM", result.craftedItem);
                    }
                    break;
            }

            // Career XP & Promotion
            summary.promoted = this.gainCareerXP(Config.CAREER.XP_PER_WORK);

            this.addJournalEntry(`I had a successful day at my ${result.career} job! My ${summary.skillUp} skill increased.`);
            this.mood = 'happy';
            this.moodOverride = 'happy';
            this.moodOverrideTimer = Config.TIMING.MOOD_OVERRIDE_MS;

        } else {
            summary.happinessChange = -10;
            this.stats.happiness = Math.max(0, this.stats.happiness - 10);
            this.addJournalEntry(`I struggled at my ${result.career} job today. It was frustrating.`);
            this.mood = 'sad';
            this.moodOverride = 'sad';
            this.moodOverrideTimer = Config.TIMING.MOOD_OVERRIDE_MS;
        }

        return summary;
    }

    /**
     * Increases the level of a specific hobby and updates stats.
     * @param {string} hobbyName - The name of the hobby to practice (e.g., 'painting').
     */
    practiceHobby(hobbyName) {
        if (this.hobbies.hasOwnProperty(hobbyName)) {
            if (this.stats.energy < Config.ACTIONS.PRACTICE_HOBBY.ENERGY_COST) return;

            this.hobbies[hobbyName] += 1;
            this.stats.happiness += Config.ACTIONS.PRACTICE_HOBBY.HAPPINESS_RESTORE;
            this.stats.energy -= Config.ACTIONS.PRACTICE_HOBBY.ENERGY_COST;
            this.addJournalEntry(`I spent some time practicing ${hobbyName}.`);
        }
    }

    /**
     * Consumes an item, applying its effects to the Nadagotchi.
     * Delegates to InventorySystem.
     * @param {string} itemName - The name of the item to consume.
     * @returns {object} Result of the consumption { success, message }.
     */
    consumeItem(itemName) {
        return this.inventorySystem.consumeItem(itemName);
    }

    /**
     * Removes an item from the inventory for placement in the world.
     * Delegates to InventorySystem.
     * @param {string} itemName - The name of the item to place.
     * @returns {boolean} True if the item was successfully removed, false otherwise.
     */
    placeItem(itemName) {
        return this.inventorySystem.placeItem(itemName);
    }

    /**
     * Returns a placed item back to the inventory.
     * Delegates to InventorySystem (using addItem).
     * @param {string} itemName - The name of the item to return.
     */
    returnItemToInventory(itemName) {
        this.inventorySystem.addItem(itemName, 1);
    }

    /**
     * Attempts to craft a specified item.
     * Delegates to InventorySystem.
     * @param {string} itemName - The name of the item to craft.
     */
    craftItem(itemName) {
        this.inventorySystem.craftItem(itemName);
    }

    /**
     * Simulates foraging for items.
     * Delegates to InventorySystem.
     */
    forage() {
        this.inventorySystem.forage();
    }

    /**
     * Manages interaction with an NPC, updating relationship status and stats.
     * @param {string} npcName - The name of the NPC being interacted with.
     * @param {string} [interactionType='CHAT'] - The type of interaction (e.g., 'CHAT', 'GIFT').
     * @returns {string} The dialogue text to display.
     */
    interact(npcName, interactionType = 'CHAT') {
        return this.relationshipSystem.interact(npcName, interactionType);
    }

    /**
     * Calculates the skill gain multiplier based on the pet's current mood.
     * @returns {number} The calculated mood multiplier (e.g., 1.5 for happy, 0.5 for sad).
     */
    getMoodMultiplier() {
        switch (this.mood) {
            case 'happy': return Config.MOOD_MULTIPLIERS.HAPPY;
            case 'sad': return Config.MOOD_MULTIPLIERS.SAD;
            case 'angry': return Config.MOOD_MULTIPLIERS.ANGRY;
            default: return Config.MOOD_MULTIPLIERS.NEUTRAL;
        }
    }

    /**
     * Adds a new entry to the journal and saves it to persistence.
     * Caps the journal size and batches saves to optimize performance.
     * @param {string} text - The content of the journal entry.
     */
    addJournalEntry(text) {
        const newEntry = { date: new Date().toLocaleString(), text: text };
        this.journal.push(newEntry);

        // Cap the journal growth
        const limit = Config.LIMITS.MAX_JOURNAL_ENTRIES || 100;
        if (this.journal.length > limit) {
            this.journal = this.journal.slice(-limit);
        }

        // Batch serialization and persistence to reduce frequency
        if (!this._journalSavePending) {
            this._journalSavePending = true;
            const performSave = async () => {
                await this.persistence.saveJournal(this.journal);
                this._journalSavePending = false;
            };

            // Use queueMicrotask or Promise for efficient batching
            if (typeof queueMicrotask === 'function') {
                queueMicrotask(performSave);
            } else {
                Promise.resolve().then(performSave);
            }
        }
    }

    /**
     * Adds a new recipe to the list if it's not already discovered and saves it to persistence.
     * Delegates to InventorySystem.
     * @param {string} recipeName - The name of the recipe to add.
     * @returns {boolean} True if the recipe was newly discovered, false if already known.
     */
    discoverRecipe(recipeName) {
        return this.inventorySystem.discoverRecipe(recipeName);
    }

    /**
     * Checks if a room is unlocked.
     * Falls back to RoomDefinitions defaults if not found in persistent config.
     * @param {string} roomId
     * @returns {boolean}
     */
    /**
     * Recalculates the cached cleanliness penalty values.
     * Optimization to avoid iterating debris every frame.
     */
    recalculateCleanlinessPenalty() {
        this._cachedGlobalPenalty = 0;
        this._cachedLocalPenalties = {};

        for (const d of this.debris) {
            let penalty = 0;
            if (d.type === 'weed') penalty = Config.DEBRIS.HAPPINESS_PENALTY_PER_WEED;
            else if (d.type === 'poop') penalty = Config.DEBRIS.HAPPINESS_PENALTY_PER_POOP;

            if (penalty > 0) {
                this._cachedGlobalPenalty += penalty;
                const loc = d.location || 'GARDEN';
                this._cachedLocalPenalties[loc] = (this._cachedLocalPenalties[loc] || 0) + penalty;
            }
        }
    }
    isRoomUnlocked(roomId) {
        if (this.homeConfig.rooms[roomId] && this.homeConfig.rooms[roomId].unlocked !== undefined) {
            return this.homeConfig.rooms[roomId].unlocked;
        }
        return RoomDefinitions[roomId] ? RoomDefinitions[roomId].unlocked : false;
    }

    /**
     * Cleans up a specific debris item.
     * @param {string} id
     * @returns {object} Result
     */
    cleanDebris(id) {
        return this.debrisSystem.clean(id);
    }

    /**
     * Unlocks a room permanently.
     * @param {string} roomId
     */
    async unlockRoom(roomId) {
        if (!RoomDefinitions[roomId]) return;

        // Ensure room object exists in config
        if (!this.homeConfig.rooms[roomId]) {
            this.homeConfig.rooms[roomId] = {
                wallpaper: RoomDefinitions[roomId].defaultWallpaper,
                flooring: RoomDefinitions[roomId].defaultFlooring,
                wallpaperItem: 'Default',
                flooringItem: 'Default',
                unlocked: false
            };
        }

        this.homeConfig.rooms[roomId].unlocked = true;
        this.addJournalEntry(`I unlocked the ${RoomDefinitions[roomId].name}! More space to decorate.`);
        await this.persistence.savePet(this);
    }

    /**
     * Updates the dominant archetype based on which personality has the most points.
     * In case of a tie, the existing dominant archetype is preferred to prevent rapid switching.
     * Ties are broken by relevant skill scores.
     * @private
     */
    updateDominantArchetype() {
        let maxPoints = -1;
        let candidates = [];

        // Single pass to find candidates with maximum points
        for (const archetype in this.personalityPoints) {
            const points = this.personalityPoints[archetype];
            if (points > maxPoints) {
                maxPoints = points;
                candidates = [archetype];
            } else if (points === maxPoints) {
                candidates.push(archetype);
            }
        }

        if (candidates.length === 0) return;

        // Optimization: If only one candidate, update and return immediately
        if (candidates.length === 1) {
            this.dominantArchetype = candidates[0];
            return;
        }

        // Handle ties based on skills
        // If tied on points, the one with the highest relevant skill score wins.
        // If tied on skill score, pick randomly (unless incumbent is one of them).

        let maxSkillScore = -1;
        let skillWinners = [];
        let incumbentInCandidates = false;

        for (const archetype of candidates) {
            if (archetype === this.dominantArchetype) {
                incumbentInCandidates = true;
            }

            let score = 0;
            switch (archetype) {
                case 'Adventurer':
                    score = this.skills.navigation;
                    break;
                case 'Nurturer':
                    score = this.skills.empathy;
                    break;
                case 'Intellectual':
                    score = this.skills.logic + this.skills.research;
                    break;
                case 'Recluse':
                    score = this.skills.focus + this.skills.crafting;
                    break;
                case 'Mischievous':
                    score = this.skills.communication;
                    break;
            }

            if (score > maxSkillScore) {
                maxSkillScore = score;
                skillWinners = [archetype];
            } else if (score === maxSkillScore) {
                skillWinners.push(archetype);
            }
        }

        // Apply Incumbent Rule:
        // If incumbent is a candidate (tied for points) AND has the highest skill score (tied or unique), it wins.
        // Note: If incumbent is tied for max skill score, it wins tie-break against challengers.
        if (incumbentInCandidates && skillWinners.includes(this.dominantArchetype)) {
            return; // Keep current
        }

        // Otherwise, pick a winner from the skill winners.
        // If there's a tie in skill scores, pick randomly.
        if (skillWinners.length > 0) {
            // Use RNG for deterministic tie-breaking
            this.dominantArchetype = this.rng.choice(skillWinners);
        }
    }

    /**
     * Checks skill and archetype requirements to unlock a new career.
     * If a career is unlocked, it updates the pet's state and logs a journal entry.
     * @private
     */
    updateCareer() {
        let newlyUnlockedCareer = null;

        // Check Hybrid Careers First (Prioritize over standard paths)
        // Archaeologist: High Adventurer & Intellectual, Research & Navigation
        if (this.personalityPoints['Adventurer'] >= 10 &&
            this.personalityPoints['Intellectual'] >= 10 &&
            this.skills.navigation > 10 &&
            this.skills.research > 10) {
            newlyUnlockedCareer = 'Archaeologist';
        }
        // Standard Careers
        else if (this.dominantArchetype === 'Intellectual' && this.skills.logic > 10) {
            newlyUnlockedCareer = 'Innovator';
        } else if (this.dominantArchetype === 'Adventurer' && this.skills.navigation > 10) {
            newlyUnlockedCareer = 'Scout';
        } else if (this.dominantArchetype === 'Nurturer' && this.skills.empathy > 10) {
            newlyUnlockedCareer = 'Healer';
        } else if (this.dominantArchetype === 'Recluse' && this.skills.crafting > 10 && this.skills.focus > 5) {
            newlyUnlockedCareer = 'Artisan';
        }

        if (newlyUnlockedCareer && !this.unlockedCareers.includes(newlyUnlockedCareer)) {
            this.unlockedCareers.push(newlyUnlockedCareer);
            this.careerLevels[newlyUnlockedCareer] = 1;
            this.careerXP[newlyUnlockedCareer] = 0;
            this.newCareerUnlocked = newlyUnlockedCareer;
            this.addJournalEntry(`I unlocked the ${newlyUnlockedCareer} career path!`);

            // Auto-switch if no career is currently active
            if (!this.currentCareer) {
                this.currentCareer = newlyUnlockedCareer;
                this.addJournalEntry(`I started working as a ${newlyUnlockedCareer}!`);
            }
        }
    }

    /**
     * Adds XP to the current career and checks for promotion.
     * @param {number} amount - The amount of XP to add.
     * @returns {boolean} True if promoted, false otherwise.
     */
    gainCareerXP(amount) {
        if (!this.currentCareer) return false;

        const currentXP = this.careerXP[this.currentCareer] || 0;
        const currentLevel = this.careerLevels[this.currentCareer] || 1;

        if (currentLevel >= 5) return false; // Max level

        this.careerXP[this.currentCareer] = currentXP + amount;

        // Check promotion
        const nextThreshold = CareerDefinitions.XP_THRESHOLDS[currentLevel + 1];
        if (nextThreshold && this.careerXP[this.currentCareer] >= nextThreshold) {
            this.careerLevels[this.currentCareer]++;
            const newTitle = CareerDefinitions.TITLES[this.currentCareer][this.careerLevels[this.currentCareer]];
            this.addJournalEntry(`I was promoted to ${newTitle}!`);
            this.stats.happiness += Config.CAREER.PROMOTION_BONUS;
            return true; // Promoted
        }
        return false;
    }

    /**
     * Switches the active career to another unlocked career.
     * @param {string} careerId - The career ID to switch to.
     * @returns {boolean} True if successful.
     */
    switchCareer(careerId) {
        if (this.unlockedCareers.includes(careerId)) {
            this.currentCareer = careerId;
            return true;
        }
        return false;
    }

    /**
     * Exports the pet's DNA string for sharing.
     * @returns {Promise<string>} The serialized DNA.
     */
    async exportDNA() {
        return await GeneticsSystem.serialize(this.genome);
    }

    /**
     * Creates a new Nadagotchi data object from a DNA string.
     * Useful for starting a new game with an imported egg.
     * @param {string} dnaString - The imported DNA string.
     * @returns {Promise<object>} Data object suitable for the Nadagotchi constructor.
     */
    static async generateDataFromDNA(dnaString) {
        const genome = await GeneticsSystem.deserialize(dnaString);

        // Extract checksum for seeding to ensure deterministic phenotype from the same DNA
        const parts = dnaString.split('.');
        // Default to full string if split fails (should be caught by deserialize, but safe fallback)
        const seedSource = parts.length === 2 ? parts[1] : dnaString;

        // Use a temporary RNG seeded by the DNA checksum for deterministic initial phenotype calculation
        const tempRng = new SeededRandom(seedSource);
        const phenotype = genome.calculatePhenotype(tempRng);

        // Determine dominant archetype (simplified logic from calculateOffspring)
        let maxScore = -1;
        let dominant = 'Adventurer';
        const personalityKeys = ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'];

        for (const type of personalityKeys) {
            if (phenotype[type] > maxScore) {
                maxScore = phenotype[type];
            }
        }

        // Simple deterministic tie-break for static generation (first in list)
        const contenders = personalityKeys.filter(type => phenotype[type] === maxScore);
        if (contenders.length > 0) dominant = contenders[0];

        const initialPoints = {};
        personalityKeys.forEach(key => initialPoints[key] = phenotype[key]);

        // Default home config for new pet
        const initialHomeConfig = {
            rooms: {
                "Entryway": {
                    wallpaper: 'wallpaper_default',
                    flooring: 'flooring_default',
                    wallpaperItem: 'Default',
                    flooringItem: 'Default'
                }
            }
        };

        // Construct Data Object
        return {
            uuid: null, // Will be generated by constructor
            name: "Mystery Egg",
            mood: 'neutral',
            dominantArchetype: dominant,
            personalityPoints: initialPoints,
            stats: { ...Config.INITIAL_STATE.STATS },
            skills: { ...Config.INITIAL_STATE.SKILLS },
            currentCareer: null,
            unlockedCareers: [],
            careerLevels: {},
            careerXP: {},
            dailyQuest: null,
            inventory: {},
            age: 0,
            generation: 1, // Imported pets start their own lineage
            isLegacyReady: false,
            legacyTraits: phenotype.specialAbility ? [phenotype.specialAbility] : [],
            moodSensitivity: phenotype.moodSensitivity,
            hobbies: { painting: 0, music: 0 },
            relationships: {
                'Grizzled Scout': { level: 0 },
                'Master Artisan': { level: 0 },
                'Sickly Villager': { level: 0 }
            },
            quests: {},
            location: 'Home',
            genome: { genotype: genome.genotype, phenotype: phenotype },
            homeConfig: initialHomeConfig,
            universeSeed: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        };
    }
}
