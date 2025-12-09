import { PersistenceManager } from './PersistenceManager.js';
import { Genome, GeneticsSystem } from './GeneticsSystem.js';
import { NarrativeSystem } from './NarrativeSystem.js';
import { Config } from './Config.js';
import { Recipes } from './ItemData.js';

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
        if (loadedData) {
            // This is a loaded pet. Populate all properties from the save file.
            /** @type {string} Unique identifier for this pet instance (Salt). */
            this.uuid = loadedData.uuid || this._generateUUID(); // Migration for old saves

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
                     this.genome = new Genome(loadedData.genome.genotype);
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

                    this.genome = new Genome(migratedGenotype);
                }
            } else {
                // Should not happen for valid saves, but fallback
                this.genome = new Genome();
            }

        } else {
            // This is a brand new game. Start from defaults.
            this.uuid = this._generateUUID();
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
            this.inventory = {};
            this.age = 0;
            this.generation = 1;
            this.isLegacyReady = false;
            this.legacyTraits = [];
            this.moodSensitivity = Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;

            // Initialize Genome for new game
            // Start with random defaults, then bias towards the chosen starter
            this.genome = new Genome(); // Random "Wild" defaults
            // Boost the dominant archetype to ensure it wins against the wild traits (10-30)
            if (this.genome.genotype[initialArchetype]) {
                const val = Config.INITIAL_STATE.GENOME_STARTER_VAL;
                this.genome.genotype[initialArchetype] = [val, val];
            }
            // Recalculate phenotype after manual genotype modification
            this.genome.phenotype = this.genome.calculatePhenotype();
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
        /** @type {Array<{date: string, text: string}>} A log of significant events. */
        this.journal = this.persistence.loadJournal();
        /** @type {Array<string>} A list of crafting recipes the pet has discovered. */
        this.discoveredRecipes = this.persistence.loadRecipes();

        // Ensure default recipes are discovered for new games
        if (this.discoveredRecipes.length === 0) {
            this.discoveredRecipes.push("Fancy Bookshelf");
            this.persistence.saveRecipes(this.discoveredRecipes);
        }

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
        /** @type {Object.<string, object>} A map of active quests. */
        this.quests = (loadedData && loadedData.quests) ? loadedData.quests : {};

        /** @type {string} The pet's current location. */
        this.location = loadedData ? loadedData.location : 'Home';

        // --- Runtime State Tracking (Not persisted) ---
        /** @type {?string} Tracks the last known weather to detect changes. */
        this.lastWeather = null;
        /** @type {number} Tracks the integer age to detect milestones. */
        this.previousAge = Math.floor(this.age);
        /** @type {string} Tracks the current season for seasonal logic. */
        this.currentSeason = 'Spring';
    }

    /**
     * Generates a UUID for the pet.
     * @returns {string} A unique identifier.
     * @private
     */
    _generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Calculates data for the offspring of this Nadagotchi.
     * Uses the GeneticsSystem to determine traits and stats based on inheritance.
     * @param {string[]} environmentalFactors - List of items present during breeding (e.g., from inventory).
     * @returns {object} The data object for the new Nadagotchi.
     */
    calculateOffspring(environmentalFactors) {
        const childGenome = GeneticsSystem.breed(this.genome, environmentalFactors);
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
            dominant = contenders[Math.floor(Math.random() * contenders.length)];
        }

        // Initialize personality points based on phenotype
        const initialPoints = {};
        personalityKeys.forEach(key => initialPoints[key] = childPhenotype[key]);

        // Legacy Traits from Phenotype
        const newLegacyTraits = [];
        if (childPhenotype.specialAbility) {
            newLegacyTraits.push(childPhenotype.specialAbility);
        }

        return {
            uuid: this._generateUUID(), // New UUID for the child
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
            genome: childGenome
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
        this.stats.hunger -= (hungerDecay * metabolismMult);
        this.stats.energy -= (energyDecay * metabolismMult * traitModifier);
        this.stats.happiness += happinessChange;

        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;
        if (this.stats.happiness < 0) this.stats.happiness = 0;
        if (this.stats.happiness > this.maxStats.happiness) this.stats.happiness = this.maxStats.happiness;

        // Mood Calculation - Use moodSensitivity from phenotype
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

        switch (actionType.toUpperCase()) {
            case 'FEED':
                this.stats.hunger = Math.min(this.maxStats.hunger, this.stats.hunger + Config.ACTIONS.FEED.HUNGER_RESTORE);
                this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.FEED.HAPPINESS_RESTORE);
                if (this.dominantArchetype === 'Nurturer') this.personalityPoints.Nurturer++;
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
                    this.mood = 'happy';
                    this.personalityPoints[this.dominantArchetype]++;
                } else if (this.dominantArchetype === 'Recluse') {
                    this.mood = 'sad';
                    this.stats.happiness -= Config.ACTIONS.PLAY.RECLUSE_HAPPINESS_PENALTY;
                }
                break;

            case 'STUDY':
                if (this.stats.energy < Config.ACTIONS.STUDY.ENERGY_COST) return;
                if (this.stats.happiness < Config.ACTIONS.STUDY.HAPPINESS_COST) return;

                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.STUDY.ENERGY_COST);
                this.stats.happiness = Math.max(0, this.stats.happiness - Config.ACTIONS.STUDY.HAPPINESS_COST);
                moodMultiplier = this._getMoodMultiplier();
                this.skills.logic += (Config.ACTIONS.STUDY.SKILL_GAIN * moodMultiplier);
                this.skills.research += (Config.ACTIONS.STUDY.SKILL_GAIN * moodMultiplier);

                // Homozygous Intellectual Bonus: Slight boost to mood recovery (Happiness)
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousIntellectual) {
                    this.stats.happiness += 5;
                }

                if (this.dominantArchetype === 'Intellectual') {
                    this.mood = 'happy';
                    this.personalityPoints.Intellectual++;
                    this.stats.happiness += Config.ACTIONS.STUDY.HAPPINESS_RESTORE_INTELLECTUAL;
                } else {
                    this.personalityPoints.Intellectual++;
                }

                if (this.dominantArchetype === 'Adventurer') {
                    this.skills.navigation += (Config.ACTIONS.STUDY.NAVIGATION_GAIN_ADVENTURER * moodMultiplier);
                }

                if (Math.random() < 0.05) this.discoverRecipe("Logic-Boosting Snack");
                break;

            case 'INTERACT_BOOKSHELF':
                if (this.stats.energy < Config.ACTIONS.INTERACT_BOOKSHELF.ENERGY_COST) return;
                if (this.stats.happiness < Config.ACTIONS.INTERACT_BOOKSHELF.HAPPINESS_COST) return;

                this.stats.energy -= Config.ACTIONS.INTERACT_BOOKSHELF.ENERGY_COST;
                this.stats.happiness -= Config.ACTIONS.INTERACT_BOOKSHELF.HAPPINESS_COST;
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += Config.ACTIONS.INTERACT_BOOKSHELF.HAPPINESS_RESTORE_INTELLECTUAL;
                    this.mood = 'happy';
                }
                moodMultiplier = this._getMoodMultiplier();
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
                    this.mood = 'happy';
                }
                moodMultiplier = this._getMoodMultiplier();
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
                    this.mood = 'happy';
                }
                moodMultiplier = this._getMoodMultiplier();
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
                    this.mood = 'happy';
                    this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_ADVENTURER;
                    this.personalityPoints.Adventurer += 2;
                    this.skills.navigation += Config.ACTIONS.EXPLORE.SKILL_GAIN;
                    if (Math.random() < 0.1) this.discoverRecipe("Stamina-Up Tea");
                } else if (this.dominantArchetype === 'Recluse') {
                    this.mood = 'sad';
                    this.stats.happiness -= Config.ACTIONS.EXPLORE.HAPPINESS_PENALTY_RECLUSE;
                } else {
                    this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_DEFAULT;
                }
                break;

            case "MEDITATE":
                this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + Config.ACTIONS.MEDITATE.ENERGY_RESTORE);
                this.stats.happiness += Config.ACTIONS.MEDITATE.HAPPINESS_RESTORE;
                moodMultiplier = this._getMoodMultiplier();
                this.skills.focus += (Config.ACTIONS.MEDITATE.SKILL_GAIN * moodMultiplier);
                if (this.dominantArchetype === "Recluse") this.personalityPoints.Recluse += Config.ACTIONS.MEDITATE.PERSONALITY_GAIN_RECLUSE;

                // Homozygous Recluse Bonus: Boost Focus Gain
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousRecluse) {
                    this.skills.focus += 0.2;
                }

                if (this.dominantArchetype === "Recluse") this.personalityPoints.Recluse += 2;
                break;

            case "CRAFT_ITEM":
                this.craftItem(item);
                break;

            case "CONSUME_ITEM":
                this.consumeItem(item);
                break;

            case 'PRACTICE_HOBBY':
                this.practiceHobby(item);
                break;

            case 'FORAGE':
                this.forage();
                break;
        }

        this.stats.happiness = Math.max(0, Math.min(this.maxStats.happiness, this.stats.happiness));
        this.updateDominantArchetype();
        this.updateCareer();
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
     * @param {string} itemName - The name of the item to consume.
     */
    consumeItem(itemName) {
        if (!this.inventory[itemName] || this.inventory[itemName] <= 0) return;

        let consumed = false;

        switch (itemName) {
            case 'Berries':
                // Berries provide a small amount of food and energy
                this.stats.hunger = Math.min(this.maxStats.hunger, this.stats.hunger + 10);
                this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + 2);
                this.addJournalEntry("I ate some Berries. Yummy!");
                consumed = true;
                break;
            case 'Logic-Boosting Snack':
                this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + 10);
                this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + 5);
                this.skills.logic += 0.5;
                this.addJournalEntry("I ate a Logic-Boosting Snack. I feel smarter!");
                consumed = true;
                break;
            case 'Stamina-Up Tea':
                this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + 30);
                this.addJournalEntry("I drank some Stamina-Up Tea. I feel refreshed!");
                consumed = true;
                break;
            case 'Metabolism-Slowing Tonic':
                // Gene Therapy: Reduces metabolism gene values permanently (for this life/lineage)
                if (this.genome && this.genome.genotype && this.genome.genotype.metabolism) {
                    const old = this.genome.genotype.metabolism;
                    // Decrease both alleles by 1, min 1
                    this.genome.genotype.metabolism = [Math.max(1, old[0] - 1), Math.max(1, old[1] - 1)];
                    this.genome.phenotype = this.genome.calculatePhenotype(); // Recalculate
                    this.addJournalEntry("I drank the tonic. I feel... slower. My metabolism has decreased.");
                    consumed = true;
                }
                break;
            default:
                // Item is not consumable
                break;
        }

        if (consumed) {
            this._removeItem(itemName, 1);
            // Stats will be updated in UI on next tick/event
        }
    }

    /**
     * Removes an item from the inventory for placement in the world.
     * @param {string} itemName - The name of the item to place.
     * @returns {boolean} True if the item was successfully removed, false otherwise.
     */
    placeItem(itemName) {
        if (this.inventory[itemName] && this.inventory[itemName] > 0) {
            this._removeItem(itemName, 1);
            return true;
        }
        return false;
    }

    /**
     * Attempts to craft a specified item. Checks for required materials, consumes them, and adds the item to inventory.
     * @param {string} itemName - The name of the item to craft from the `this.recipes` object.
     */
    craftItem(itemName) {
        const recipe = this.recipes[itemName];
        // Check if recipe exists and is discovered
        if (!recipe || !this.discoveredRecipes.includes(itemName)) {
            this.addJournalEntry(`I tried to craft '${itemName}', but I don't know the recipe.`);
            return;
        }

        // Check resources (Energy)
        if (this.stats.energy < Config.ACTIONS.CRAFT.ENERGY_COST) {
            this.addJournalEntry("I'm too tired to craft right now.");
            return;
        }

        // Check if pet has all required materials
        for (const material in recipe.materials) {
            const requiredAmount = recipe.materials[material];
            const hasAmount = this.inventory[material] || 0;
            if (hasAmount < requiredAmount) {
                this.addJournalEntry(`I don't have enough ${material} to craft a ${itemName}.`);
                this.stats.happiness -= Config.ACTIONS.CRAFT.HAPPINESS_PENALTY_MISSING_MATS; // Frustration
                return;
            }
        }

        // Consume materials
        for (const material in recipe.materials) {
            this._removeItem(material, recipe.materials[material]);
        }

        // Add crafted item to inventory
        this._addItem(itemName, 1);
        this.stats.energy -= Config.ACTIONS.CRAFT.ENERGY_COST;
        this.stats.happiness += Config.ACTIONS.CRAFT.HAPPINESS_RESTORE;

        // Update Quest Progress
        if (itemName === 'Masterwork Chair' &&
            this.quests['masterwork_crafting'] &&
            this.quests['masterwork_crafting'].stage === 2) {
            this.quests['masterwork_crafting'].hasCraftedChair = true;
        }

        const moodMultiplier = this._getMoodMultiplier();
        this.skills.crafting += (Config.ACTIONS.CRAFT.SKILL_GAIN * moodMultiplier);
        this.addJournalEntry(`I successfully crafted a ${itemName}!`);
    }

    /**
     * Simulates foraging for items, changing location, updating stats, and adding items to inventory.
     */
    forage() {
        if (this.stats.energy < Config.ACTIONS.FORAGE.ENERGY_COST) return;

        this.location = 'Forest';
        this.stats.energy -= Config.ACTIONS.FORAGE.ENERGY_COST;
        const moodMultiplier = this._getMoodMultiplier();
        this.skills.navigation += (Config.ACTIONS.FORAGE.SKILL_GAIN * moodMultiplier);

        const potentialItems = ['Berries', 'Sticks', 'Shiny Stone'];
        if (this.currentSeason === 'Winter') {
            potentialItems.push('Frostbloom');
        }

        const foundItem = Phaser.Utils.Array.GetRandom(potentialItems);
        this._addItem(foundItem, 1);

        if (foundItem === 'Frostbloom') {
            this.discoverRecipe("Metabolism-Slowing Tonic");
        }

        this.addJournalEntry(`I went foraging in the ${this.location} and found a ${foundItem}.`);
        this.location = 'Home';
    }

    /**
     * Manages interaction with an NPC, updating relationship status and stats.
     * @param {string} npcName - The name of the NPC being interacted with.
     * @param {string} [interactionType='CHAT'] - The type of interaction (e.g., 'CHAT', 'GIFT').
     * @returns {string} The dialogue text to display.
     */
    interact(npcName, interactionType = 'CHAT') {
        if (!this.relationships.hasOwnProperty(npcName)) {
            return;
        }

        if (interactionType === 'GIFT' && this.inventory['Berries'] > 0) {
            this._removeItem('Berries', 1);
            this.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.GIFT_RELATIONSHIP;
            this.stats.happiness += Config.ACTIONS.INTERACT_NPC.GIFT_HAPPINESS;
            this.skills.empathy += Config.ACTIONS.INTERACT_NPC.GIFT_SKILL_GAIN;
            const text = "Thanks for the gift!";
            this.addJournalEntry(`I gave Berries to ${npcName}. They seemed to like it!`);
            return text;
        }

        const moodMultiplier = this._getMoodMultiplier();
        this.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.CHAT_RELATIONSHIP;
        this.stats.happiness += Config.ACTIONS.INTERACT_NPC.CHAT_HAPPINESS;
        this.skills.communication += Config.ACTIONS.INTERACT_NPC.CHAT_SKILL_GAIN;

        switch (npcName) {
            case 'Grizzled Scout':
                this.skills.navigation += Config.ACTIONS.INTERACT_NPC.SCOUT_SKILL_GAIN * moodMultiplier;
                break;
            case 'Master Artisan':
                if (this.relationships['Master Artisan'].level >= 5) {
                    this._handleArtisanQuest();
                } else {
                    this.skills.crafting += Config.ACTIONS.INTERACT_NPC.ARTISAN_SKILL_GAIN * moodMultiplier;
                }
                break;
            case 'Sickly Villager':
                this.skills.empathy += Config.ACTIONS.INTERACT_NPC.VILLAGER_SKILL_GAIN * moodMultiplier;
                break;
        }

        const relLevel = this.relationships[npcName].level;
        // Check quest active state: Exists AND is not completed (Stage 3 is complete)
        const quest = this.quests['masterwork_crafting'];
        const hasQuest = (quest && quest.stage < 3 && npcName === 'Master Artisan');

        const dialogueText = NarrativeSystem.getNPCDialogue(npcName, relLevel, hasQuest);
        this.addJournalEntry(`Chatted with ${npcName}: "${dialogueText}"`);

        return dialogueText;
    }

    /**
     * Handles the logic for the Master Artisan's quest line.
     * @private
     */
    _handleArtisanQuest() {
        if (!this.quests['masterwork_crafting']) {
            this.quests['masterwork_crafting'] = { stage: 1, name: 'Masterwork Crafting' };
            this.addJournalEntry("The Master Artisan sees potential in me. He asked for 5 Sticks to prove my dedication.");
            return;
        }

        const quest = this.quests['masterwork_crafting'];

        if (quest.stage === 1) {
            if ((this.inventory['Sticks'] || 0) >= 5) {
                // Check if we already know the recipe (unlikely if in stage 1, but safe)
                if (this.discoverRecipe("Masterwork Chair")) {
                    this._removeItem('Sticks', 5);
                    quest.stage = 2;
                    this.addJournalEntry("I gave the Sticks to the Artisan. He taught me how to make a Masterwork Chair! I need to craft one to show him.");
                } else {
                     // Should not happen unless they learned it elsewhere
                     // Advance quest anyway if they already know it
                    this._removeItem('Sticks', 5);
                    quest.stage = 2;
                }
            } else {
                this.addJournalEntry("The Master Artisan is waiting for 5 Sticks.");
            }
        } else if (quest.stage === 2) {
            if (quest.hasCraftedChair && this.inventory['Masterwork Chair'] && this.inventory['Masterwork Chair'] > 0) {
                this._removeItem('Masterwork Chair', 1);
                quest.stage = 3;
                this.skills.crafting += Config.ACTIONS.INTERACT_NPC.QUEST_CRAFTING_GAIN;
                this.stats.happiness += Config.ACTIONS.INTERACT_NPC.QUEST_HAPPINESS_GAIN;
                this.addJournalEntry("The Master Artisan was impressed by my chair! He declared me a true craftsman.");
            } else {
                this.addJournalEntry("I need to craft a Masterwork Chair to show the Artisan.");
            }
        } else {
            // Completed
            const moodMultiplier = this._getMoodMultiplier();
            this.skills.crafting += 0.2 * moodMultiplier;
            this.addJournalEntry("The Master Artisan greeted me warmly as a fellow master. We discussed advanced crafting theory.");
        }
    }

    /**
     * Calculates the skill gain multiplier based on the pet's current mood.
     * @returns {number} The calculated mood multiplier (e.g., 1.5 for happy, 0.5 for sad).
     * @private
     */
    _getMoodMultiplier() {
        switch (this.mood) {
            case 'happy': return Config.MOOD_MULTIPLIERS.HAPPY;
            case 'sad': return Config.MOOD_MULTIPLIERS.SAD;
            case 'angry': return Config.MOOD_MULTIPLIERS.ANGRY;
            default: return Config.MOOD_MULTIPLIERS.NEUTRAL;
        }
    }

    /**
     * Adds a new entry to the journal and saves it to persistence.
     * @param {string} text - The content of the journal entry.
     */
    addJournalEntry(text) {
        const newEntry = { date: new Date().toLocaleString(), text: text };
        this.journal.push(newEntry);
        this.persistence.saveJournal(this.journal);
    }

    /**
     * Adds a new recipe to the list if it's not already discovered and saves to persistence.
     * @param {string} recipeName - The name of the recipe to add.
     * @returns {boolean} True if the recipe was newly discovered, false if already known.
     */
    discoverRecipe(recipeName) {
        if (!this.discoveredRecipes.includes(recipeName)) {
            this.discoveredRecipes.push(recipeName);
            this.persistence.saveRecipes(this.discoveredRecipes);
            this.addJournalEntry(`I discovered a new recipe: ${recipeName}!`);
            return true;
        }
        return false;
    }

    /**
     * Updates the dominant archetype based on which personality has the most points.
     * In case of a tie, the existing dominant archetype is preferred to prevent rapid switching.
     * Ties are broken by relevant skill scores.
     * @private
     */
    updateDominantArchetype() {
        let maxPoints = -1;
        let potentialDominantArchetypes = [];

        // First, find the maximum number of points.
        for (const archetype in this.personalityPoints) {
            if (this.personalityPoints[archetype] > maxPoints) {
                maxPoints = this.personalityPoints[archetype];
            }
        }

        // Next, gather all archetypes that have that maximum score.
        for (const archetype in this.personalityPoints) {
            if (this.personalityPoints[archetype] === maxPoints) {
                potentialDominantArchetypes.push(archetype);
            }
        }

        // If the current dominant archetype is one of the tied contenders, it remains dominant.
        // Otherwise, we break ties based on relevant skills.
        if (potentialDominantArchetypes.length > 0 && !potentialDominantArchetypes.includes(this.dominantArchetype)) {
            let bestCandidate = potentialDominantArchetypes[0];
            let highestSkillScore = -1;

            potentialDominantArchetypes.forEach(archetype => {
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

                if (score > highestSkillScore) {
                    highestSkillScore = score;
                    bestCandidate = archetype;
                }
            });

            this.dominantArchetype = bestCandidate;
        }
    }

    /**
     * Checks skill and archetype requirements to unlock a new career.
     * If a career is unlocked, it updates the pet's state and logs a journal entry.
     * @private
     */
    updateCareer() {
        if (this.currentCareer === null) {
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

            if (newlyUnlockedCareer) {
                this.currentCareer = newlyUnlockedCareer;
                this.newCareerUnlocked = newlyUnlockedCareer;
                this.addJournalEntry(`I became a ${this.currentCareer}!`);
            }
        }
    }

    /**
     * Adds a specified quantity of an item to the inventory.
     * @param {string} itemName - The name of the item to add.
     * @param {number} quantity - The number of items to add.
     * @private
     */
    _addItem(itemName, quantity) {
        if (!this.inventory[itemName]) {
            this.inventory[itemName] = 0;
        }
        this.inventory[itemName] += quantity;
    }

    /**
     * Removes a specified quantity of an item from the inventory.
     * @param {string} itemName - The name of the item to remove.
     * @param {number} quantity - The number of items to remove.
     * @private
     */
    _removeItem(itemName, quantity) {
        if (this.inventory[itemName]) {
            this.inventory[itemName] -= quantity;
            if (this.inventory[itemName] <= 0) {
                delete this.inventory[itemName];
            }
        }
    }
}
