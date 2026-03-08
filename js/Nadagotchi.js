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
 */
export class Nadagotchi {
    unlockAllCareers() {
        const allCareerIds = Object.keys(Config.CAREER.CAREERS || {});
        const unlockedSet = new Set(this.unlockedCareers || []);
        allCareerIds.forEach(id => unlockedSet.add(id));
        this.unlockedCareers = Array.from(unlockedSet);
        this.save();
    }
    constructor(initialArchetype, loadedData = null) {
        this.isInitialized = false;

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

        if (loadedData) {
            this.uuid = loadedData.uuid || this.generateUUID();
            this.name = loadedData.name || "Nadagotchi";
            this.mood = loadedData.mood;
            this.dominantArchetype = loadedData.dominantArchetype;
            this.personalityPoints = loadedData.personalityPoints;
            this.stats = loadedData.stats;
            this.skills = loadedData.skills;
            if (this.skills.research === undefined) this.skills.research = 0;

            this.currentCareer = loadedData.currentCareer;
            this.unlockedCareers = loadedData.unlockedCareers || (this.currentCareer ? [this.currentCareer] : []);
            this.careerLevels = loadedData.careerLevels || {};
            this.careerXP = loadedData.careerXP || {};

            if (this.currentCareer && !this.careerLevels[this.currentCareer]) {
                this.careerLevels[this.currentCareer] = 1;
                this.careerXP[this.currentCareer] = 0;
            }

            this.dailyQuest = loadedData.dailyQuest || null;
            this.inventory = loadedData.inventory || {};
            this.age = loadedData.age;
            this.generation = loadedData.generation || 1;
            this.isLegacyReady = loadedData.isLegacyReady || false;
            this.legacyTraits = loadedData.legacyTraits || [];
            this.moodSensitivity = loadedData.moodSensitivity || Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;

            if (loadedData.genome) {
                if (loadedData.genome.genotype) {
                     const phenotype = loadedData.genome.phenotype || null;
                     this.genome = new Genome(loadedData.genome.genotype, phenotype, this.rng);
                } else {
                    const migratedGenotype = {};
                    ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'].forEach(trait => {
                         const val = loadedData.genome.personalityGenes ? (loadedData.genome.personalityGenes[trait] || 0) : 0;
                         migratedGenotype[trait] = [val, val];
                    });
                    const moodSens = loadedData.genome.moodSensitivity || Config.INITIAL_STATE.MOOD_SENSITIVITY_DEFAULT;
                    migratedGenotype.moodSensitivity = [moodSens, moodSens];
                    migratedGenotype.metabolism = [Config.GENETICS.METABOLISM_NORMALIZER, Config.GENETICS.METABOLISM_NORMALIZER];
                    migratedGenotype.specialAbility = [null, null];
                    if (loadedData.genome.legacyTraits && loadedData.genome.legacyTraits.length > 0) {
                        const trait = loadedData.genome.legacyTraits[0];
                        migratedGenotype.specialAbility = [trait, trait];
                    }
                    this.genome = new Genome(migratedGenotype, null, this.rng);
                }
            } else {
                this.genome = new Genome(null, null, this.rng);
            }

            if (loadedData.homeConfig && loadedData.homeConfig.rooms) {
                 this.homeConfig = loadedData.homeConfig;
            } else if (loadedData.homeConfig) {
                 this.homeConfig = this._migrateHomeConfig(loadedData.homeConfig);
            } else {
                 this.homeConfig = this._migrateHomeConfig({});
            }
        } else {
            this.uuid = this.generateUUID();
            this.name = "Nadagotchi";
            this.mood = 'neutral';
            this.dominantArchetype = initialArchetype;
            this.personalityPoints = { Adventurer: 0, Nurturer: 0, Mischievous: 0, Intellectual: 0, Recluse: 0 };
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
            this.genome = new Genome(null, null, this.rng);
            if (this.genome.genotype[initialArchetype]) {
                const val = Config.INITIAL_STATE.GENOME_STARTER_VAL;
                this.genome.genotype[initialArchetype] = [val, val];
            }
            this.genome.phenotype = this.genome.calculatePhenotype(this.rng);
            this.homeConfig = { rooms: { "Entryway": { wallpaper: 'wallpaper_default', flooring: 'flooring_default', wallpaperItem: 'Default', flooringItem: 'Default' } } };
        }

        this.maxStats = { hunger: Config.LIMITS.MAX_STATS, energy: Config.LIMITS.MAX_STATS, happiness: Config.LIMITS.MAX_STATS };
        if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousMetabolism) {
            this.maxStats.energy += Config.GENETICS.HOMOZYGOUS_ENERGY_BONUS;
        }

        this.newCareerUnlocked = null;
        this.persistence = new PersistenceManager();
        this.journal = [];
        this.discoveredRecipes = [];
        this.recipes = Recipes;
        this.hobbies = loadedData ? loadedData.hobbies : { painting: 0, music: 0 };
        this.relationships = loadedData ? loadedData.relationships : { 'Grizzled Scout': { level: 0 }, 'Master Artisan': { level: 0 }, 'Sickly Villager': { level: 0 } };

        Object.defineProperty(this, 'relationshipSystem', { value: new RelationshipSystem(this), enumerable: false, writable: true });
        Object.defineProperty(this, 'inventorySystem', { value: new InventorySystem(this), enumerable: false, writable: true });
        this.quests = (loadedData && loadedData.quests) ? loadedData.quests : {};
        Object.defineProperty(this, 'questSystem', { value: new QuestSystem(this), enumerable: false, writable: true });

        // Optimized Debris Initialization with Security Validation
        this.debris = {};
        if (loadedData && loadedData.debris) {
            if (Array.isArray(loadedData.debris)) {
                loadedData.debris.forEach(d => {
                    if (d.id && d.id !== '__proto__' && d.id !== 'constructor') {
                        this.debris[d.id] = d;
                    }
                });
            } else {
                for (const key of Object.keys(loadedData.debris)) {
                    if (key !== '__proto__' && key !== 'constructor') {
                        this.debris[key] = loadedData.debris[key];
                    }
                }
            }
        }
        this.debrisCount = Object.keys(this.debris).length;

        Object.defineProperty(this, 'debrisSystem', { value: new DebrisSystem(this), enumerable: false, writable: true });
        this.recalculateCleanlinessPenalty();

        this.location = loadedData ? loadedData.location : 'GARDEN';
        if (this.location === 'Home') this.location = 'GARDEN';

        this.lastWeather = null;
        this.previousAge = Math.floor(this.age);
        this.currentSeason = 'Spring';
        this.moodOverride = null;
        this.moodOverrideTimer = 0;
        this._journalSavePending = false;
    }

    async init() {
        this.journal = await this.persistence.loadJournal();
        this.discoveredRecipes = await this.persistence.loadRecipes();
        if (this.discoveredRecipes.length === 0) {
            this.discoveredRecipes.push("Fancy Bookshelf");
            await this.persistence.saveRecipes(this.discoveredRecipes);
        }
        this.isInitialized = true;
    }

    _migrateHomeConfig(data) {
        const defaultState = { rooms: { "Entryway": { wallpaper: 'wallpaper_default', flooring: 'flooring_default', wallpaperItem: 'Default', flooringItem: 'Default', unlocked: true } } };
        if (!data) return defaultState;
        if (data.wallpaper || data.flooring) {
            return { rooms: { "Entryway": { wallpaper: data.wallpaper || 'wallpaper_default', flooring: data.flooring || 'flooring_default', wallpaperItem: data.wallpaperItem || 'Default', flooringItem: data.flooringItem || 'Default', unlocked: true } } };
        }
        if (!data.rooms) return defaultState;
        return data;
    }

    _generateSeed() {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    generateUUID() {
        const chars = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) uuid += '-';
            else if (i === 14) uuid += '4';
            else if (i === 19) {
                const r = this.rng.range(0, 16);
                uuid += chars[(r & 0x3) | 0x8];
            } else uuid += chars[this.rng.range(0, 16)];
        }
        return uuid;
    }

    calculateOffspring(environmentalFactors) {
        const validFactors = environmentalFactors.filter(item => this.inventory[item] && this.inventory[item] > 0);
        const childGenome = GeneticsSystem.breed(this.genome, validFactors, this.rng);
        const childPhenotype = childGenome.phenotype;
        let maxScore = -1;
        let dominant = 'Adventurer';
        const personalityKeys = ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'];
        for (const type of personalityKeys) {
            if (childPhenotype[type] > maxScore) maxScore = childPhenotype[type];
        }
        const contenders = personalityKeys.filter(type => childPhenotype[type] === maxScore);
        if (contenders.length > 0) dominant = this.rng.choice(contenders);
        const initialPoints = {};
        personalityKeys.forEach(key => initialPoints[key] = childPhenotype[key]);
        const newLegacyTraits = [];
        if (childPhenotype.specialAbility) newLegacyTraits.push(childPhenotype.specialAbility);
        const initialHomeConfig = { rooms: { "Entryway": { wallpaper: 'wallpaper_default', flooring: 'flooring_default', wallpaperItem: 'Default', flooringItem: 'Default', unlocked: true } } };

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
            relationships: { 'Grizzled Scout': { level: 0 }, 'Master Artisan': { level: 0 }, 'Sickly Villager': { level: 0 } },
            quests: {},
            location: 'Home',
            genome: childGenome,
            homeConfig: initialHomeConfig,
            universeSeed: this.rng.range(0, Number.MAX_SAFE_INTEGER)
        };
    }

    live(dt, worldState = { weather: "Sunny", time: "Day", activeEvent: null }) {
        if (typeof dt === 'object') {
             worldState = dt;
             dt = Config.GAME_LOOP.MS_PER_FRAME;
        } else if (dt === undefined) dt = Config.GAME_LOOP.MS_PER_FRAME;

        const ticksPassed = dt / Config.GAME_LOOP.MS_PER_FRAME;
        const oldMood = this.mood;
        if (worldState.season) this.currentSeason = worldState.season;

        let hungerDecay = Config.DECAY.HUNGER * ticksPassed;
        let energyDecay = Config.DECAY.ENERGY * ticksPassed;
        let happinessChange = 0;

        let metabolismMult = 1.0;
        if (this.genome && this.genome.phenotype && this.genome.phenotype.metabolism) {
            metabolismMult = (this.genome.phenotype.metabolism / Config.GENETICS.METABOLISM_NORMALIZER);
        }

        let traitModifier = 1.0;
        const activeTrait = this.genome && this.genome.phenotype ? this.genome.phenotype.specialAbility : null;
        if (activeTrait === "Photosynthetic" && worldState.time === "Day") traitModifier = Config.TRAITS.PHOTOSYNTHETIC_MULT;
        else if (activeTrait === "Night Owl" && worldState.time === "Night") traitModifier = Config.TRAITS.NIGHT_OWL_MULT;

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

        let cleanlinessPenalty = this._cachedGlobalPenalty + (this._cachedLocalPenalties[this.location] || 0);

        this.stats.hunger -= (hungerDecay * metabolismMult);
        this.stats.energy -= (energyDecay * metabolismMult * traitModifier);
        this.stats.happiness += (happinessChange - (cleanlinessPenalty * ticksPassed));

        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;
        if (this.stats.happiness < 0) this.stats.happiness = 0;
        if (this.stats.happiness > this.maxStats.happiness) this.stats.happiness = this.maxStats.happiness;

        if (this.moodOverrideTimer > 0) {
            this.mood = this.moodOverride;
            this.moodOverrideTimer -= dt;
            if (this.moodOverrideTimer <= 0) this.moodOverride = null;
        } else {
            let happyThreshold = Config.THRESHOLDS.HAPPY_MOOD;
            if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousMoodSensitivity) {
                happyThreshold = Config.THRESHOLDS.HAPPY_MOOD_HOMOZYGOUS;
            }
            if (this.stats.hunger < Config.THRESHOLDS.HUNGER_ANGRY) this.mood = 'angry';
            else if (this.stats.hunger < Config.THRESHOLDS.HUNGER_SAD || this.stats.energy < Config.THRESHOLDS.ENERGY_SAD) this.mood = 'sad';
            else if (this.stats.hunger > happyThreshold && this.stats.energy > happyThreshold) this.mood = 'happy';
            else this.mood = 'neutral';
        }

        this.age += Config.DECAY.AGE_INCREMENT * ticksPassed;
        if (this.age > Config.THRESHOLDS.AGE_LEGACY && !this.isLegacyReady) this.isLegacyReady = true;

        if (this.mood !== oldMood) this._logAutoEntry('MOOD_CHANGE', { newMood: this.mood });
        if (this.lastWeather !== null && this.lastWeather !== worldState.weather) this._logAutoEntry('WEATHER_CHANGE', { weather: worldState.weather });
        this.lastWeather = worldState.weather;
        if (Math.floor(this.age) > this.previousAge) {
            this._logAutoEntry('AGE_MILESTONE', { age: Math.floor(this.age) });
            this.previousAge = Math.floor(this.age);
        }
    }

    _logAutoEntry(type, context) {
        const text = NarrativeSystem.generateEntry(this.dominantArchetype, type, context);
        if (text) this.addJournalEntry(text);
    }

    handleAction(actionType, item = null) {
        let moodMultiplier;
        let actionSetMood = null;
        switch (actionType.toUpperCase()) {
            case 'FEED':
                this.stats.hunger = Math.min(this.maxStats.hunger, this.stats.hunger + Config.ACTIONS.FEED.HUNGER_RESTORE);
                this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.FEED.HAPPINESS_RESTORE);
                if (this.dominantArchetype === 'Nurturer') this.personalityPoints.Nurturer++;
                actionSetMood = 'happy';
                break;
            case 'PLAY':
                if (this.stats.energy < Config.ACTIONS.PLAY.ENERGY_COST) return;
                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.PLAY.ENERGY_COST);
                this.stats.happiness = Math.min(this.maxStats.happiness, this.stats.happiness + Config.ACTIONS.PLAY.HAPPINESS_RESTORE);
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousMischievous) this.stats.energy = Math.min(this.maxStats.energy, this.stats.energy + 5);
                if (['Adventurer', 'Mischievous'].includes(this.dominantArchetype)) {
                    actionSetMood = 'happy';
                    this.personalityPoints[this.dominantArchetype]++;
                } else if (this.dominantArchetype === 'Recluse') {
                    actionSetMood = 'sad';
                    this.stats.happiness -= Config.ACTIONS.PLAY.RECLUSE_HAPPINESS_PENALTY;
                } else actionSetMood = 'happy';
                break;
            case 'STUDY':
                if (this.stats.energy < Config.ACTIONS.STUDY.ENERGY_COST) return;
                if (this.stats.happiness < Config.ACTIONS.STUDY.HAPPINESS_COST) return;
                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.STUDY.ENERGY_COST);
                this.stats.happiness = Math.max(0, this.stats.happiness - Config.ACTIONS.STUDY.HAPPINESS_COST);
                moodMultiplier = this.getMoodMultiplier();
                this.skills.logic += (Config.ACTIONS.STUDY.SKILL_GAIN * moodMultiplier);
                this.skills.research += (Config.ACTIONS.STUDY.SKILL_GAIN * moodMultiplier);
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousIntellectual) this.stats.happiness += 5;
                if (this.dominantArchetype === 'Intellectual') {
                    actionSetMood = 'happy';
                    this.personalityPoints.Intellectual++;
                    this.stats.happiness += Config.ACTIONS.STUDY.HAPPINESS_RESTORE_INTELLECTUAL;
                } else this.personalityPoints.Intellectual++;
                if (this.dominantArchetype === 'Adventurer') this.skills.navigation += (Config.ACTIONS.STUDY.NAVIGATION_GAIN_ADVENTURER * moodMultiplier);
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
                } else actionSetMood = 'happy';
                if (actionSetMood) this.mood = actionSetMood;
                moodMultiplier = this.getMoodMultiplier();
                this.skills.empathy += (Config.ACTIONS.INTERACT_PLANT.SKILL_GAIN * moodMultiplier);
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousNurturer) this.skills.empathy += 0.2;
                this.personalityPoints.Nurturer++;
                break;
            case 'INTERACT_FANCY_BOOKSHELF':
                if (this.stats.energy < Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.ENERGY_COST) return;
                this.stats.energy -= Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.ENERGY_COST;
                this.stats.happiness += Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.HAPPINESS_RESTORE;
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.HAPPINESS_RESTORE_INTELLECTUAL;
                    actionSetMood = 'happy';
                }
                moodMultiplier = this.getMoodMultiplier();
                this.skills.logic += (Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.SKILL_GAIN * moodMultiplier);
                this.skills.research += (Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.SKILL_GAIN * moodMultiplier);
                this.personalityPoints.Intellectual += Config.ACTIONS.INTERACT_FANCY_BOOKSHELF.PERSONALITY_GAIN;
                this.addJournalEntry("I spent some time studying at my beautiful new bookshelf. I feel so smart!");
                break;
            case 'EXPLORE':
                if (this.stats.energy < Config.ACTIONS.EXPLORE.ENERGY_COST) return;
                this.stats.energy = Math.max(0, this.stats.energy - Config.ACTIONS.EXPLORE.ENERGY_COST);
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousAdventurer) this.stats.happiness += 10;
                if (this.dominantArchetype === 'Adventurer') {
                    actionSetMood = 'happy';
                    this.stats.happiness += Config.ACTIONS.EXPLORE.HAPPINESS_RESTORE_ADVENTURER;
                    this.personalityPoints.Adventurer += 2;
                    this.skills.navigation += Config.ACTIONS.EXPLORE.SKILL_GAIN;
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
                if (this.genome && this.genome.phenotype && this.genome.phenotype.isHomozygousRecluse) this.skills.focus += 0.2;
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
        if (actionSetMood) {
            this.mood = actionSetMood;
            this.moodOverride = actionSetMood;
            this.moodOverrideTimer = Config.TIMING.MOOD_OVERRIDE_MS;
        }
        this.stats.happiness = Math.max(0, Math.min(this.maxStats.happiness, this.stats.happiness));
        this.updateDominantArchetype();
        this.updateCareer();
    }

    completeWorkShift(result) {
        if (!result.career) return null;
        const summary = { success: result.success, happinessChange: 0, skillUp: '', promoted: false, message: '' };
        if (result.success) {
            const maxHappiness = this.maxStats.happiness;
            const currentHappiness = this.stats.happiness;
            const rawGain = Config.CAREER.WORK_HAPPINESS_BASE * (1 - (currentHappiness / maxHappiness));
            summary.happinessChange = Math.max(Config.CAREER.WORK_HAPPINESS_MIN, rawGain);
            this.stats.happiness = Math.min(maxHappiness, currentHappiness + summary.happinessChange);
            const calculateSkillGain = (currentLevel, baseGain) => baseGain * (20 / (20 + currentLevel));
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
                    this.skills.research += calculateSkillGain(this.skills.research, 1.0);
                    this.skills.navigation += calculateSkillGain(this.skills.navigation, 1.0);
                    break;
                case 'Healer':
                    summary.skillUp = 'empathy';
                    this.skills.empathy += calculateSkillGain(this.skills.empathy, baseSkillGain);
                    break;
                case 'Artisan':
                    summary.skillUp = 'crafting';
                    this.skills.crafting += calculateSkillGain(this.skills.crafting, baseSkillGain);
                    if (result.craftedItem) this.handleAction("CRAFT_ITEM", result.craftedItem);
                    break;
            }
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

    practiceHobby(hobbyName) {
        if (this.hobbies.hasOwnProperty(hobbyName)) {
            if (this.stats.energy < Config.ACTIONS.PRACTICE_HOBBY.ENERGY_COST) return;
            this.hobbies[hobbyName] += 1;
            this.stats.happiness += Config.ACTIONS.PRACTICE_HOBBY.HAPPINESS_RESTORE;
            this.stats.energy -= Config.ACTIONS.PRACTICE_HOBBY.ENERGY_COST;
            this.addJournalEntry(`I spent some time practicing ${hobbyName}.`);
        }
    }

    consumeItem(itemName) { return this.inventorySystem.consumeItem(itemName); }
    placeItem(itemName) { return this.inventorySystem.placeItem(itemName); }
    returnItemToInventory(itemName) { this.inventorySystem.addItem(itemName, 1); }
    craftItem(itemName) { this.inventorySystem.craftItem(itemName); }
    forage() { this.inventorySystem.forage(); }
    interact(npcName, interactionType = 'CHAT') { return this.relationshipSystem.interact(npcName, interactionType); }
    getMoodMultiplier() {
        switch (this.mood) {
            case 'happy': return Config.MOOD_MULTIPLIERS.HAPPY;
            case 'sad': return Config.MOOD_MULTIPLIERS.SAD;
            case 'angry': return Config.MOOD_MULTIPLIERS.ANGRY;
            default: return Config.MOOD_MULTIPLIERS.NEUTRAL;
        }
    }

    addJournalEntry(text) {
        const newEntry = { date: new Date().toLocaleString(), text: text };
        this.journal.push(newEntry);
        const limit = Config.LIMITS.MAX_JOURNAL_ENTRIES || 100;
        if (this.journal.length > limit) this.journal = this.journal.slice(-limit);
        if (!this._journalSavePending) {
            this._journalSavePending = true;
            const performSave = async () => {
                await this.persistence.saveJournal(this.journal);
                this._journalSavePending = false;
            };
            if (typeof queueMicrotask === 'function') queueMicrotask(performSave);
            else Promise.resolve().then(performSave);
        }
    }

    discoverRecipe(recipeName) { return this.inventorySystem.discoverRecipe(recipeName); }

    recalculateCleanlinessPenalty() {
        this._cachedGlobalPenalty = 0;
        this._cachedLocalPenalties = {};

        // Security: Iterating only own own properties of the map
        for (const debrisId of Object.keys(this.debris)) {
            const d = this.debris[debrisId];
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
        if (this.homeConfig.rooms[roomId] && this.homeConfig.rooms[roomId].unlocked !== undefined) return this.homeConfig.rooms[roomId].unlocked;
        return RoomDefinitions[roomId] ? RoomDefinitions[roomId].unlocked : false;
    }

    cleanDebris(id) { return this.debrisSystem.clean(id); }

    async unlockRoom(roomId) {
        if (!RoomDefinitions[roomId]) return;
        if (!this.homeConfig.rooms[roomId]) {
            this.homeConfig.rooms[roomId] = { wallpaper: RoomDefinitions[roomId].defaultWallpaper, flooring: RoomDefinitions[roomId].defaultFlooring, wallpaperItem: 'Default', flooringItem: 'Default', unlocked: false };
        }
        this.homeConfig.rooms[roomId].unlocked = true;
        this.addJournalEntry(`I unlocked the ${RoomDefinitions[roomId].name}! More space to decorate.`);
        await this.persistence.savePet(this);
    }

    updateDominantArchetype() {
        let maxPoints = -1;
        let candidates = [];
        for (const archetype in this.personalityPoints) {
            const points = this.personalityPoints[archetype];
            if (points > maxPoints) {
                maxPoints = points;
                candidates = [archetype];
            } else if (points === maxPoints) candidates.push(archetype);
        }
        if (candidates.length === 0) return;
        if (candidates.length === 1) {
            this.dominantArchetype = candidates[0];
            return;
        }
        let maxSkillScore = -1;
        let skillWinners = [];
        let incumbentInCandidates = false;
        for (const archetype of candidates) {
            if (archetype === this.dominantArchetype) incumbentInCandidates = true;
            let score = 0;
            switch (archetype) {
                case 'Adventurer': score = this.skills.navigation; break;
                case 'Nurturer': score = this.skills.empathy; break;
                case 'Intellectual': score = this.skills.logic + this.skills.research; break;
                case 'Recluse': score = this.skills.focus + this.skills.crafting; break;
                case 'Mischievous': score = this.skills.communication; break;
            }
            if (score > maxSkillScore) {
                maxSkillScore = score;
                skillWinners = [archetype];
            } else if (score === maxSkillScore) skillWinners.push(archetype);
        }
        if (incumbentInCandidates && skillWinners.includes(this.dominantArchetype)) return;
        if (skillWinners.length > 0) this.dominantArchetype = this.rng.choice(skillWinners);
    }

    updateCareer() {
        let newlyUnlockedCareer = null;
        if (this.personalityPoints['Adventurer'] >= 10 && this.personalityPoints['Intellectual'] >= 10 && this.skills.navigation > 10 && this.skills.research > 10) newlyUnlockedCareer = 'Archaeologist';
        else if (this.dominantArchetype === 'Intellectual' && this.skills.logic > 10) newlyUnlockedCareer = 'Innovator';
        else if (this.dominantArchetype === 'Adventurer' && this.skills.navigation > 10) newlyUnlockedCareer = 'Scout';
        else if (this.dominantArchetype === 'Nurturer' && this.skills.empathy > 10) newlyUnlockedCareer = 'Healer';
        else if (this.dominantArchetype === 'Recluse' && this.skills.crafting > 10 && this.skills.focus > 5) newlyUnlockedCareer = 'Artisan';

        if (newlyUnlockedCareer && !this.unlockedCareers.includes(newlyUnlockedCareer)) {
            this.unlockedCareers.push(newlyUnlockedCareer);
            this.careerLevels[newlyUnlockedCareer] = 1;
            this.careerXP[newlyUnlockedCareer] = 0;
            this.newCareerUnlocked = newlyUnlockedCareer;
            this.addJournalEntry(`I unlocked the ${newlyUnlockedCareer} career path!`);
            if (!this.currentCareer) {
                this.currentCareer = newlyUnlockedCareer;
                this.addJournalEntry(`I started working as a ${newlyUnlockedCareer}!`);
            }
        }
    }

    gainCareerXP(amount) {
        if (!this.currentCareer) return false;
        const currentXP = this.careerXP[this.currentCareer] || 0;
        const currentLevel = this.careerLevels[this.currentCareer] || 1;
        if (currentLevel >= 5) return false;
        this.careerXP[this.currentCareer] = currentXP + amount;
        const nextThreshold = CareerDefinitions.XP_THRESHOLDS[currentLevel + 1];
        if (nextThreshold && this.careerXP[this.currentCareer] >= nextThreshold) {
            this.careerLevels[this.currentCareer]++;
            const newTitle = CareerDefinitions.TITLES[this.currentCareer][this.careerLevels[this.currentCareer]];
            this.addJournalEntry(`I was promoted to ${newTitle}!`);
            this.stats.happiness += Config.CAREER.PROMOTION_BONUS;
            return true;
        }
        return false;
    }

    switchCareer(careerId) {
        if (this.unlockedCareers.includes(careerId)) {
            this.currentCareer = careerId;
            return true;
        }
        return false;
    }

    async exportDNA() { return await GeneticsSystem.serialize(this.genome); }

    static async generateDataFromDNA(dnaString) {
        const genome = await GeneticsSystem.deserialize(dnaString);
        const parts = dnaString.split('.');
        const seedSource = parts.length === 2 ? parts[1] : dnaString;
        const tempRng = new SeededRandom(seedSource);
        const phenotype = genome.calculatePhenotype(tempRng);
        let maxScore = -1;
        let dominant = 'Adventurer';
        const personalityKeys = ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'];
        for (const type of personalityKeys) {
            if (phenotype[type] > maxScore) maxScore = phenotype[type];
        }
        const contenders = personalityKeys.filter(type => phenotype[type] === maxScore);
        if (contenders.length > 0) dominant = contenders[0];
        const initialPoints = {};
        personalityKeys.forEach(key => initialPoints[key] = phenotype[key]);
        const initialHomeConfig = { rooms: { "Entryway": { wallpaper: 'wallpaper_default', flooring: 'flooring_default', wallpaperItem: 'Default', flooringItem: 'Default' } } };

        return {
            uuid: null,
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
            generation: 1,
            isLegacyReady: false,
            legacyTraits: phenotype.specialAbility ? [phenotype.specialAbility] : [],
            moodSensitivity: phenotype.moodSensitivity,
            hobbies: { painting: 0, music: 0 },
            relationships: { 'Grizzled Scout': { level: 0 }, 'Master Artisan': { level: 0 }, 'Sickly Villager': { level: 0 } },
            quests: {},
            location: 'Home',
            genome: { genotype: genome.genotype, phenotype: phenotype },
            homeConfig: initialHomeConfig,
            universeSeed: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        };
    }
}
// CI Integrity Check Fix
