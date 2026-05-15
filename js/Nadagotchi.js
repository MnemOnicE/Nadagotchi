import { PersistenceManager } from './PersistenceManager.js';
import { CryptoUtils } from './utils/CryptoUtils.js';
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
    unlockAllCareers() {
        const allCareerIds = Object.keys(Config.CAREER.CAREERS || {});
        const unlockedSet = new Set(this.unlockedCareers || []);
        allCareerIds.forEach(id => unlockedSet.add(id));
        this.unlockedCareers = Array.from(unlockedSet);
        this.save();
    }
    /**
     * Creates a new Nadagotchi instance.
     * @param {string} initialArchetype - The initial archetype of the Nadagotchi (e.g., 'Adventurer').
     * @param {object} [loadedData=null] - Optional saved data to load from. If provided, overrides defaults.
     */
    constructor(initialArchetype, loadedData = null) {
        /** @type {boolean} Indicates if the asynchronous initialization is complete. */
        this.isInitialized = false;

        this._initRNG(loadedData);

        if (loadedData) {
            this._loadPetState(loadedData);
            this._initGenomeFromSave(loadedData);
            this._initHomeConfigFromSave(loadedData);
        } else {
            this._initNewPet(initialArchetype);
        }

        this._initSystems(loadedData);
        this._initRuntimeState(loadedData);
    }

    /**
     * Initializes the SeededRandom instance.
     * @param {object} [loadedData]
     * @private
     */
    _initRNG(loadedData) {
        if (loadedData) {
             this.universeSeed = loadedData.universeSeed || this._generateSeed();
             this.rng = new SeededRandom(this.universeSeed);
             if (loadedData.rng && loadedData.rng.state) {
                 this.rng.state = loadedData.rng.state;
             }
        } else {
             this.universeSeed = this._generateSeed();
             this.rng = new SeededRandom(this.universeSeed);
        }
    }

    /**
     * Loads pet status and basic data from a save file.
     * @param {object} data
     * @private
     */
    _loadPetState(data) {
        this.uuid = data.uuid || this.generateUUID();
        this.name = data.name || "Nadagotchi";
        this.mood = data.mood;
        this.dominantArchetype = data.dominantArchetype;
        this.personalityPoints = data.personalityPoints;
        this.stats = data.stats;
        this.skills = data.skills;
        if (this.skills.research === undefined) this.skills.research = 0;

        this.currentCareer = data.currentCareer;
        this.unlockedCareers = data.unlockedCareers || (this.currentCareer ? [this.currentCareer] : []);
        this.careerLevels = data.careerLevels || {};
        this.careerXP = data.careerXP || {};

        if (this.currentCareer && !this.careerLevels[this.currentCareer]) {
            this.careerLevels[this.currentCareer] = 1;
            this.careerXP[this.currentCareer] = 0;
        }

        this.dailyQuest = data.dailyQuest || null;
        this.coins = data.coins || 0;
        this.inventory = data.inventory || {};
        this.age = data.age;
        this.generation = data.generation || 1;
        this.isLegacyReady = data.isLegacyReady || false;
        this.legacyTraits = data.legacyTraits || [];
        this.moodSensitivity = data.moodSensitivity || Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;
        this.environmentalFactors = data.environmentalFactors || [];
    }

    /**
     * Initializes the genome from saved data.
     * @param {object} data
     * @private
     */
    _initGenomeFromSave(data) {
        if (data.genome) {
            if (data.genome.genotype) {
                 const phenotype = data.genome.phenotype || null;
                 this.genome = new Genome(data.genome.genotype, phenotype, this.rng);
            } else {
                const migratedGenotype = {};
                ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'].forEach(trait => {
                     const val = data.genome.personalityGenes ? (data.genome.personalityGenes[trait] || 0) : 0;
                     migratedGenotype[trait] = [val, val];
                });
                const moodSens = data.genome.moodSensitivity || Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;
                migratedGenotype.moodSensitivity = [moodSens, moodSens];
                migratedGenotype.metabolism = [Config.GENETICS.METABOLISM_NORMALIZER, Config.GENETICS.METABOLISM_NORMALIZER];
                migratedGenotype.specialAbility = [null, null];

                if (data.genome.legacyTraits && data.genome.legacyTraits.length > 0) {
                    const trait = data.genome.legacyTraits[0];
                    migratedGenotype.specialAbility = [trait, trait];
                }
                this.genome = new Genome(migratedGenotype, null, this.rng);
            }
        } else {
            this.genome = new Genome(null, null, this.rng);
        }
    }

    /**
     * Initializes home configuration from saved data.
     * @param {object} data
     * @private
     */
    _initHomeConfigFromSave(data) {
        if (data.homeConfig && data.homeConfig.rooms) {
             this.homeConfig = data.homeConfig;
        } else if (data.homeConfig) {
             this.homeConfig = this._migrateHomeConfig(data.homeConfig);
        } else {
             this.homeConfig = this._migrateHomeConfig({});
        }
    }

    /**
     * Initializes a brand new pet from defaults.
     * @param {string} initialArchetype
     * @private
     */
    _initNewPet(initialArchetype) {
        this.uuid = this.generateUUID();
        this.name = "Nadagotchi";
        this.mood = 'neutral';
        this.dominantArchetype = initialArchetype;
        this.personalityPoints = {
            Adventurer: 0, Nurturer: 0, Mischievous: 0,
            Intellectual: 0, Recluse: 0
        };
        this.personalityPoints[initialArchetype] = Config.INITIAL_STATE.PERSONALITY_POINTS_STARTER;

        this.stats = { ...Config.INITIAL_STATE.STATS };
        this.skills = { ...Config.INITIAL_STATE.SKILLS };

        this.currentCareer = null;
        this.unlockedCareers = [];
        this.careerLevels = {};
        this.careerXP = {};
        this.dailyQuest = null;
        this.inventory = {};
        this.coins = 0;
        this.age = 0;
        this.generation = 1;
        this.isLegacyReady = false;
        this.legacyTraits = [];
        this.moodSensitivity = Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;
        this.environmentalFactors = [];

        this.genome = new Genome(null, null, this.rng);
        if (this.genome.genotype[initialArchetype]) {
            const val = Config.INITIAL_STATE.GENOME_STARTER_VAL;
            this.genome.genotype[initialArchetype] = [val, val];
        }
        this.genome.phenotype = this.genome.calculatePhenotype(this.rng);

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

    /**
     * Initializes non-persisted runtime state and systems.
     * @param {object} [loadedData]
     * @private
     */
    _initSystems(loadedData) {
        this._initCoreSystems();
        this._initSocialAndStats(loadedData);
        this._initInventoryAndQuests(loadedData);
        this._initDebrisSystem(loadedData);
    }

    /**
     * @private
     */
    _initCoreSystems() {
        this.newCareerUnlocked = null;
        this.persistence = new PersistenceManager();
        this.journal = [];
        this.discoveredRecipes = [];
        this.recipes = Recipes;
    }

    /**
     * @private
     */
    _initSocialAndStats(loadedData) {
        this.maxStats = { hunger: Config.LIMITS.MAX_STATS, energy: Config.LIMITS.MAX_STATS, happiness: Config.LIMITS.MAX_STATS };
        if (this.genome?.phenotype?.isHomozygousMetabolism) {
            this.maxStats.energy += Config.GENETICS.HOMOZYGOUS_ENERGY_BONUS;
        }

        this.hobbies = loadedData?.hobbies || { painting: 0, music: 0 };
        this.relationships = loadedData?.relationships || {
            'Grizzled Scout': { level: 0 },
            'Master Artisan': { level: 0 },
            'Sickly Villager': { level: 0 }
        };

        Object.defineProperty(this, 'relationshipSystem', {
            value: new RelationshipSystem(this),
            enumerable: false,
            writable: true
        });
    }

    /**
     * @private
     */
    _initInventoryAndQuests(loadedData) {
        Object.defineProperty(this, 'inventorySystem', {
            value: new InventorySystem(this),
            enumerable: false,
            writable: true
        });

        this.quests = loadedData?.quests || {};
        Object.defineProperty(this, 'questSystem', {
            value: new QuestSystem(this),
            enumerable: false,
            writable: true
        });
    }

    /**
     * @private
     * @param {object} [loadedData]
     */
    _initDebrisSystem(loadedData) {
        // --- Optimized Debris Map Implementation ---
        /** @type {Object.<string, object>} Debris items in the world (weeds, rocks, etc.). */
        this.debris = Object.create(null);
        if (loadedData && loadedData.debris) {
            if (Array.isArray(loadedData.debris)) {
                // Migration logic for legacy array-based saves
                loadedData.debris.forEach(d => {
                    if (d.id && d.id !== '__proto__' && d.id !== 'constructor') {
                        this.debris[d.id] = d;
                    }
                });
            } else {
                // Own property check for security
                for (const key of Object.keys(loadedData.debris)) {
                    if (key !== '__proto__' && key !== 'constructor') {
                        this.debris[key] = loadedData.debris[key];
                    }
                }
            }
        }
        /** @type {number} Cached count for O(1) size checks. */
        this.debrisCount = Object.keys(this.debris).length;

        Object.defineProperty(this, 'debrisSystem', {
            value: new DebrisSystem(this),
            enumerable: false,
            writable: true
        });

        this.recalculateCleanlinessPenalty();
    }

    /**
     * @private
     */
    _loadDebrisData(data) {
        if (Array.isArray(data)) {
            data.forEach(d => {
                if (d.id && d.id !== '__proto__' && d.id !== 'constructor') {
                    this.debris[d.id] = d;
                }
            });
        } else {
            for (const key of Object.keys(data)) {
                if (Object.hasOwn(data, key) && key !== '__proto__' && key !== 'constructor') {
                    this.debris[key] = data[key];
                }
            }
        }
    }

    /**
     * Initializes runtime state tracking variables.
     * @param {object} [loadedData]
     * @private
     */
    _initRuntimeState(loadedData) {
        this.location = loadedData ? loadedData.location : 'GARDEN';
        if (this.location === 'Home') this.location = 'GARDEN';

        this.lastWeather = null;
        this.previousAge = Math.floor(this.age);
        this.currentSeason = 'Spring';

        this.moodOverride = null;
        this.moodOverrideTimer = 0;

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
        return CryptoUtils.getRandomSafeInt(0, Number.MAX_SAFE_INTEGER);
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
     * Applies environmental effects to stats based on equipped items and world state.
     * @param {Object} environment - Current environmental conditions.
     */
    applyEnvironment(environment) {
        if (!environment) return 0;
        let tempAdjustment = 0;

        // Security Fix: Filter environmental factors to ensure they are present in inventory.
        const activeFactors = this.environmentalFactors.filter(factor => {
            if (factor.type === 'item') {
                // Adapt to object map inventory structure
                return this.inventory[factor.id] && this.inventory[factor.id] > 0;
            }
            return true; // Non-item factors (like room temp) are always active if set.
        });

        // Apply effects from active factors
        activeFactors.forEach(factor => {
            if (factor.effect === 'warm') tempAdjustment += 5;
            if (factor.effect === 'cold') tempAdjustment -= 5;
        });

        // Note: Further logic using tempAdjustment can be added here as the environment system evolves.
        return tempAdjustment;
    }

    /**
     * Calculates data for the offspring of this Nadagotchi.
     * Uses the GeneticsSystem to determine traits and stats based on inheritance.
     * @param {string[]} environmentalFactors - List of items present during breeding (e.g., from inventory).
     * @returns {object} The data object for the new Nadagotchi.
     */
    calculateOffspring(environmentalFactors) {
        const validFactors = environmentalFactors.filter(item => this.inventory[item] && this.inventory[item] > 0);
        const childGenome = GeneticsSystem.breed(this.genome, validFactors, this.rng);
        const childPhenotype = childGenome.phenotype;

        const personalityKeys = ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'];
        const dominant = this._determineDominantArchetype(childPhenotype, personalityKeys);

        const initialPoints = {};
        personalityKeys.forEach(key => initialPoints[key] = childPhenotype[key]);

        const newLegacyTraits = childPhenotype.specialAbility ? [childPhenotype.specialAbility] : [];

        return {
            uuid: this.generateUUID(),
            mood: 'neutral',
            dominantArchetype: dominant,
            personalityPoints: initialPoints,
            stats: { ...Config.INITIAL_STATE.STATS },
            skills: { ...Config.INITIAL_STATE.SKILLS },
            currentCareer: null,
            inventory: {},
            coins: 0,
            age: 0,
            generation: this.generation + 1,
            isLegacyReady: false,
            legacyTraits: newLegacyTraits,
            moodSensitivity: childPhenotype.moodSensitivity,
            hobbies: { painting: 0, music: 0 },
            relationships: this._getDefaultRelationships(),
            quests: {},
            location: 'Home',
            genome: childGenome,
            homeConfig: this._getDefaultHomeConfig(),
            universeSeed: this.rng.range(0, Number.MAX_SAFE_INTEGER)
        };
    }

    /**
     * @private
     */
    _determineDominantArchetype(phenotype, keys) {
        let maxScore = -1;
        for (const type of keys) {
            if (phenotype[type] > maxScore) maxScore = phenotype[type];
        }
        const contenders = keys.filter(type => phenotype[type] === maxScore);
        return contenders.length > 0 ? this.rng.choice(contenders) : 'Adventurer';
    }

    /**
     * @private
     */
    _getDefaultRelationships() {
        return {
            'Grizzled Scout': { level: 0 },
            'Master Artisan': { level: 0 },
            'Sickly Villager': { level: 0 }
        };
    }

    /**
     * @private
     */
    _getDefaultHomeConfig() {
        return {
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
        const simulationData = this._prepareSimulation(dt, worldState);
        const { ticksPassed, oldMood, metabolismMult, traitModifier } = simulationData;

        // Calculate decays based on environment
        const decays = this._calculateEnvironmentalDecays(ticksPassed, worldState);
        let { hungerDecay, energyDecay, happinessChange } = decays;

        // Apply final decays to stats
        this._applyDecays(ticksPassed, hungerDecay, energyDecay, happinessChange, metabolismMult, traitModifier);

        // Update mood and aging
        this._updateMood(dt);
        this._updateAging(ticksPassed);

        // Automated Journal Logging
        this._processJournalLogging(oldMood, worldState);
    }

    /**
     * Prepares initial values for simulation tick.
     * @private
     */
    _prepareSimulation(dt, worldState) {
        if (typeof dt === 'object') {
             Object.assign(worldState, dt);
             dt = Config.GAME_LOOP.MS_PER_FRAME;
        } else if (dt === undefined) {
             dt = Config.GAME_LOOP.MS_PER_FRAME;
        }

        if (worldState.season) this.currentSeason = worldState.season;

        const ticksPassed = dt / Config.GAME_LOOP.MS_PER_FRAME;
        const oldMood = this.mood;

        let metabolismMult = 1.0;
        if (this.genome?.phenotype?.metabolism) {
            metabolismMult = (this.genome.phenotype.metabolism / Config.GENETICS.METABOLISM_NORMALIZER);
        }

        let traitModifier = 1.0;
        const activeTrait = this.genome?.phenotype?.specialAbility;
        if (activeTrait === "Photosynthetic" && worldState.time === "Day") {
            traitModifier = Config.TRAITS.PHOTOSYNTHETIC_MULT;
        } else if (activeTrait === "Night Owl" && worldState.time === "Night") {
            traitModifier = Config.TRAITS.NIGHT_OWL_MULT;
        }

        return { ticksPassed, oldMood, metabolismMult, traitModifier };
    }

    /**
     * Calculates decay factors based on environment.
     * @private
     */
    _calculateEnvironmentalDecays(ticksPassed, worldState) {
        let hungerDecay = Config.DECAY.HUNGER * ticksPassed;
        let energyDecay = Config.DECAY.ENERGY * ticksPassed;
        let happinessChange = 0;

        const tempAdjustment = this.applyEnvironment(worldState);
        happinessChange += (tempAdjustment * ticksPassed);

        if (worldState.activeEvent?.name.includes('Festival')) {
            this.stats.happiness += Config.ENV_MODIFIERS.FESTIVAL_HAPPINESS * ticksPassed;
        }

        const weatherRes = this._applyWeatherModifiers(worldState.weather, ticksPassed);
        happinessChange += weatherRes.happinessChange;
        energyDecay *= weatherRes.energyMult;

        const timeRes = this._applyTimeModifiers(worldState.time, ticksPassed);
        hungerDecay *= timeRes.hungerMult;
        happinessChange += timeRes.happinessChange;
        energyDecay *= timeRes.energyMult;

        return { hungerDecay, energyDecay, happinessChange };
    }

    /**
     * @private
     */
    _applyWeatherModifiers(weather, ticksPassed) {
        let happinessChange = 0;
        let energyMult = 1.0;
        const weatherMods = Config.ENV_MODIFIERS[weather.toUpperCase()];

        if (weatherMods) {
            if (this.dominantArchetype === "Adventurer" && weatherMods.ADVENTURER_HAPPINESS) {
                happinessChange += weatherMods.ADVENTURER_HAPPINESS * ticksPassed;
            }
            if (this.dominantArchetype === "Nurturer" && weatherMods.NURTURER_ENERGY_MULT) {
                energyMult *= weatherMods.NURTURER_ENERGY_MULT;
            }
            if (this.dominantArchetype === "Recluse" && weatherMods.RECLUSE_HAPPINESS) {
                happinessChange += weatherMods.RECLUSE_HAPPINESS * ticksPassed;
            }
            if (weatherMods.ENERGY_MULT) energyMult *= weatherMods.ENERGY_MULT;
        }
        return { happinessChange, energyMult };
    }

    /**
     * @private
     */
    _applyTimeModifiers(time, ticksPassed) {
        let hungerMult = 1.0;
        let happinessChange = 0;
        let energyMult = 1.0;
        const timeMods = Config.ENV_MODIFIERS[time.toUpperCase()];

        if (timeMods) {
            if (timeMods.HUNGER_MULT) hungerMult *= timeMods.HUNGER_MULT;
            if (this.dominantArchetype === "Recluse" && timeMods.RECLUSE_HAPPINESS) {
                happinessChange += timeMods.RECLUSE_HAPPINESS * ticksPassed;
            }
            if (this.dominantArchetype === "Adventurer" && timeMods.ADVENTURER_ENERGY_MULT) {
                energyMult *= timeMods.ADVENTURER_ENERGY_MULT;
            }
            if (this.dominantArchetype === "Intellectual" && timeMods.INTELLECTUAL_ENERGY_MULT) {
                energyMult *= timeMods.INTELLECTUAL_ENERGY_MULT;
            }
            if (timeMods.ENERGY_MULT) energyMult *= timeMods.ENERGY_MULT;
        }
        return { hungerMult, happinessChange, energyMult };
    }

    /**
     * Applies calculated decays to the pet's stats.
     * @private
     */
    _applyDecays(ticksPassed, hungerDecay, energyDecay, happinessChange, metabolismMult, traitModifier) {
        const cleanlinessPenalty = this._cachedGlobalPenalty + (this._cachedLocalPenalties[this.location] || 0);

        this.stats.hunger -= (hungerDecay * metabolismMult);
        this.stats.energy -= (energyDecay * metabolismMult * traitModifier);
        this.stats.happiness += (happinessChange - (cleanlinessPenalty * ticksPassed));

        this.stats.hunger = Math.max(0, this.stats.hunger);
        this.stats.energy = Math.max(0, this.stats.energy);
        this.stats.happiness = Math.max(0, Math.min(this.maxStats.happiness, this.stats.happiness));
    }

    /**
     * Updates the pet's mood based on current stats.
     * @private
     */
    _updateMood(dt) {
        if (this.moodOverrideTimer > 0) {
            this.mood = this.moodOverride;
            this.moodOverrideTimer -= dt;
            if (this.moodOverrideTimer <= 0) this.moodOverride = null;
        } else {
            let happyThreshold = Config.THRESHOLDS.HAPPY_MOOD;
            if (this.genome?.phenotype?.isHomozygousMoodSensitivity) {
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
    }

    /**
     * Updates age and legacy readiness.
     * @private
     */
    _updateAging(ticksPassed) {
        this.age += Config.DECAY.AGE_INCREMENT * ticksPassed;
        if (this.age > Config.THRESHOLDS.AGE_LEGACY && !this.isLegacyReady) {
            this.isLegacyReady = true;
        }
    }

    /**
     * Processes automated journal logging based on state changes.
     * @private
     */
    _processJournalLogging(oldMood, worldState) {
        if (this.mood !== oldMood) {
            this._logAutoEntry('MOOD_CHANGE', { newMood: this.mood });
        }
        if (this.lastWeather !== null && this.lastWeather !== worldState.weather) {
            this._logAutoEntry('WEATHER_CHANGE', { weather: worldState.weather });
        }
        this.lastWeather = worldState.weather;

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
        const normalizedAction = actionType.toUpperCase();
        const actionHandlers = {
            'FEED': () => this._handleFeedAction(),
            'PLAY': () => this._handlePlayAction(),
            'STUDY': () => this._handleStudyAction(),
            'EXPLORE': () => this._handleExploreAction(),
            'MEDITATE': () => this._handleMeditateAction(),
            'CRAFT_ITEM': () => { this.craftItem(item); return 'happy'; },
            'CONSUME_ITEM': () => { this.consumeItem(item); return null; },
            'PRACTICE_HOBBY': () => { this.practiceHobby(item); return 'happy'; },
            'FORAGE': () => { this.forage(); return 'happy'; }
        };

        let actionSetMood = null;
        if (actionHandlers[normalizedAction]) {
            actionSetMood = actionHandlers[normalizedAction]();
        } else if (normalizedAction.startsWith('INTERACT_')) {
            actionSetMood = this._handleInteractAction(normalizedAction);
        }

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
     * @private
     */
    _handleFeedAction() {
        this.stats.hunger = Math.min(this.maxStats.hunger, this.stats.hunger + Config.ACTIONS.FEED.HUNGER_RESTORE);
        this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.FEED.HAPPINESS_RESTORE);
        if (this.dominantArchetype === 'Nurturer') this.personalityPoints.Nurturer++;
        return 'happy';
    }

    /**
     * @private
     */
    _handlePlayAction() {
        if (this.stats.energy < Config.ACTIONS.PLAY.ENERGY_COST) return null;
        this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.PLAY.ENERGY_COST);
        this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.PLAY.HAPPINESS_RESTORE);

        if (this.genome?.phenotype?.isHomozygousMischievous) {
             this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + 5);
        }

        if (['Adventurer', 'Mischievous'].includes(this.dominantArchetype)) {
            this.personalityPoints[this.dominantArchetype]++;
            return 'happy';
        } else if (this.dominantArchetype === 'Recluse') {
            this.stats.happiness -= Config.ACTIONS.PLAY.RECLUSE_HAPPINESS_PENALTY;
            return 'sad';
        }
        return 'happy';
    }

    /**
     * @private
     */
    _handleStudyAction() {
        if (this.stats.energy < Config.ACTIONS.STUDY.ENERGY_COST) return null;
        if (this.stats.happiness < Config.ACTIONS.STUDY.HAPPINESS_COST) return null;

        this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.STUDY.ENERGY_COST);
        this.stats.happiness = Math.max(0, this.stats.happiness - Config.ACTIONS.STUDY.HAPPINESS_COST);
        const multiplier = this.getMoodMultiplier();
        this.skills.logic += (Config.ACTIONS.STUDY.SKILL_GAIN * multiplier);
        this.skills.research += (Config.ACTIONS.STUDY.SKILL_GAIN * multiplier);

        if (this.genome?.phenotype?.isHomozygousIntellectual) this.stats.happiness += 5;

        if (this.dominantArchetype === 'Intellectual') {
            this.personalityPoints.Intellectual++;
            this.stats.happiness += Config.ACTIONS.STUDY.HAPPINESS_RESTORE_INTELLECTUAL;
            if (this.rng.random() < 0.05) this.discoverRecipe("Logic-Boosting Snack");
            return 'happy';
        }

        this.personalityPoints.Intellectual++;
        if (this.dominantArchetype === 'Adventurer') {
            this.skills.navigation += (Config.ACTIONS.STUDY.NAVIGATION_GAIN_ADVENTURER * multiplier);
        }
        if (this.rng.random() < 0.05) this.discoverRecipe("Logic-Boosting Snack");
        return null;
    }

    /**
     * @private
     */
    _handleInteractAction(action) {
        const config = Config.ACTIONS[action];
        if (!config || this.stats.energy < config.ENERGY_COST) return null;
        if (config.HAPPINESS_COST && this.stats.happiness < config.HAPPINESS_COST) return null;

        this.stats.energy -= config.ENERGY_COST;
        if (config.HAPPINESS_COST) this.stats.happiness -= config.HAPPINESS_COST;
        this.stats.happiness += config.HAPPINESS_RESTORE || 0;

        let resMood = this._resolveInteractMood(action, config);
        if (resMood) this.mood = resMood;

        this._applyInteractSkills(action, config);

        if (action === 'INTERACT_FANCY_BOOKSHELF') {
            this.addJournalEntry("I spent some time studying at my beautiful new bookshelf. I feel so smart!");
        }
        return resMood;
    }

    /**
     * @private
     */
    _resolveInteractMood(action, config) {
        if (this.dominantArchetype === 'Intellectual' && config.HAPPINESS_RESTORE_INTELLECTUAL) {
            this.stats.happiness += config.HAPPINESS_RESTORE_INTELLECTUAL;
            return 'happy';
        }
        if (this.dominantArchetype === 'Nurturer' && config.HAPPINESS_RESTORE_NURTURER) {
            this.stats.happiness += config.HAPPINESS_RESTORE_NURTURER;
            return 'happy';
        }
        if (action === 'INTERACT_PLANT') return 'happy';
        return null;
    }

    /**
     * @private
     */
    _applyInteractSkills(action, config) {
        if (!config.SKILL_GAIN) return;
        const multiplier = this.getMoodMultiplier();

        if (action.includes('BOOKSHELF')) {
            this.skills.logic += (config.SKILL_GAIN * multiplier);
            this.skills.research += (config.SKILL_GAIN * multiplier);
            this.personalityPoints.Intellectual += (config.PERSONALITY_GAIN || 1);
        } else if (action === 'INTERACT_PLANT') {
            this.skills.empathy += (config.SKILL_GAIN * multiplier);
            if (this.genome?.phenotype?.isHomozygousNurturer) this.skills.empathy += 0.2;
            this.personalityPoints.Nurturer++;
        }
    }

    /**
     * @private
     */
    _handleExploreAction() {
        if (this.stats.energy < Config.ACTIONS.EXPLORE.ENERGY_COST) return null;
        this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.EXPLORE.ENERGY_COST);

        if (this.genome?.phenotype?.isHomozygousAdventurer) this.stats.happiness += 10;

        if (this.dominantArchetype === 'Adventurer') {
            this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_ADVENTURER;
            this.personalityPoints.Adventurer += 2;
            this.skills.navigation += Config.ACTIONS.EXPLORE.SKILL_GAIN;
            if (this.rng.random() < 0.1) this.discoverRecipe("Stamina-Up Tea");
            return 'happy';
        } else if (this.dominantArchetype === 'Recluse') {
            this.stats.happiness -= Config.ACTIONS.EXPLORE.HAPPINESS_PENALTY_RECLUSE;
            return 'sad';
        }
        this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_DEFAULT;
        return 'happy';
    }

    /**
     * @private
     */
    _handleMeditateAction() {
        this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + Config.ACTIONS.MEDITATE.ENERGY_RESTORE);
        this.stats.happiness += Config.ACTIONS.MEDITATE.HAPPINESS_RESTORE;
        const multiplier = this.getMoodMultiplier();
        this.skills.focus += (Config.ACTIONS.MEDITATE.SKILL_GAIN * multiplier);

        if (this.genome?.phenotype?.isHomozygousRecluse) this.skills.focus += 0.2;

        if (this.dominantArchetype === "Recluse") {
            this.personalityPoints.Recluse += (Config.ACTIONS.MEDITATE.PERSONALITY_GAIN_RECLUSE || 2);
            return 'happy';
        }
        return null;
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
    isRoomUnlocked(roomId) {
        if (this.homeConfig.rooms[roomId] && this.homeConfig.rooms[roomId].unlocked !== undefined) {
            return this.homeConfig.rooms[roomId].unlocked;
        }
        return RoomDefinitions[roomId] ? RoomDefinitions[roomId].unlocked : false;
    }

    /**
     * Recalculates the cached cleanliness penalty values.
     * Optimization to avoid iterating debris every frame.
     * Iterates over the debris map to calculate aggregate penalties.
     */
    recalculateCleanlinessPenalty() {
        this._cachedGlobalPenalty = 0;
        this._cachedLocalPenalties = {};

        // Defensive check for Config.DEBRIS to prevent CI failures in environments
        // where Config might be partially loaded or mocked.
        if (!Config.DEBRIS) return;

        // Use Object.keys for iteration to avoid intermediate array allocation from Object.values()
        // and reduce Garbage Collection pressure in the live loop.
        for (const id of Object.keys(this.debris)) {
            const d = this.debris[id];
            let penalty = 0;
            if (d.type === 'weed') penalty = Config.DEBRIS.HAPPINESS_PENALTY_PER_WEED || 0;
            else if (d.type === 'poop') penalty = Config.DEBRIS.HAPPINESS_PENALTY_PER_POOP || 0;

            if (penalty > 0) {
                this._cachedGlobalPenalty += penalty;
                const loc = d.location || 'GARDEN';
                this._cachedLocalPenalties[loc] = (this._cachedLocalPenalties[loc] || 0) + penalty;
            }
        }
    }

    /**
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
        const candidates = this._findTopPersonalityCandidates();
        if (candidates.length === 0) return;

        if (candidates.length === 1) {
            this.dominantArchetype = candidates[0];
            return;
        }

        const { skillWinners, incumbentInCandidates } = this._resolvePersonalityTie(candidates);

        if (incumbentInCandidates && skillWinners.includes(this.dominantArchetype)) return;

        if (skillWinners.length > 0) {
            this.dominantArchetype = this.rng.choice(skillWinners);
        }
    }

    /**
     * @private
     */
    _findTopPersonalityCandidates() {
        let maxPoints = -1;
        let candidates = [];
        for (const archetype in this.personalityPoints) {
            const points = this.personalityPoints[archetype];
            if (points > maxPoints) {
                maxPoints = points;
                candidates = [archetype];
            } else if (points === maxPoints) {
                candidates.push(archetype);
            }
        }
        return candidates;
    }

    /**
     * @private
     */
    _resolvePersonalityTie(candidates) {
        let maxSkillScore = -1;
        let skillWinners = [];
        let incumbentInCandidates = false;

        for (const archetype of candidates) {
            if (archetype === this.dominantArchetype) incumbentInCandidates = true;

            const score = this._getArchetypeSkillScore(archetype);
            if (score > maxSkillScore) {
                maxSkillScore = score;
                skillWinners = [archetype];
            } else if (score === maxSkillScore) {
                skillWinners.push(archetype);
            }
        }
        return { skillWinners, incumbentInCandidates };
    }

    /**
     * @private
     */
    _getArchetypeSkillScore(archetype) {
        switch (archetype) {
            case 'Adventurer': return this.skills.navigation;
            case 'Nurturer': return this.skills.empathy;
            case 'Intellectual': return this.skills.logic + this.skills.research;
            case 'Recluse': return this.skills.focus + this.skills.crafting;
            case 'Mischievous': return this.skills.communication;
            default: return 0;
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
            coins: 0,
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
            universeSeed: CryptoUtils.getRandomSafeInt(0, Number.MAX_SAFE_INTEGER)
        };
    }
}
// CI Integrity Check Fix
