/**
 * Represents the core Nadagotchi entity, its "Brain".
 * This class holds the Nadagotchi's state, including its personality, stats, skills, and more.
 * @class Nadagotchi
 */
class Nadagotchi {
    /**
     * Creates a new Nadagotchi.
     * @param {string} initialArchetype - The initial archetype of the Nadagotchi.
     * @param {object} [loadedData=null] - Optional saved data to load from.
     */
    constructor(initialArchetype, loadedData = null) {
        if (loadedData) {
            // This is a loaded pet. Populate all properties from the save file.
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
            this.moodSensitivity = loadedData.moodSensitivity || 5;
        } else {
            // This is a brand new game. Start from defaults.
            this.mood = 'neutral';
            this.dominantArchetype = initialArchetype;
            this.personalityPoints = {
                Adventurer: 0, Nurturer: 0, Mischievous: 0,
                Intellectual: 0, Recluse: 0
            };
            this.personalityPoints[initialArchetype] = 10;

            this.stats = { hunger: 100, energy: 100, happiness: 70 };
            this.skills = {
                communication: 1, resilience: 1, navigation: 0,
                empathy: 0, logic: 0, focus: 0, crafting: 0
            };
            this.currentCareer = null;
            this.inventory = {};
            this.age = 0;
            this.generation = 1;
            this.isLegacyReady = false;
            this.legacyTraits = [];
            this.moodSensitivity = 5;
        }

        /** @type {?string} A flag used by the UI to show a one-time notification when a career is unlocked. */
        this.newCareerUnlocked = null;

        /** @type {PersistenceManager} Manages saving and loading game data. */
        this.persistence = new PersistenceManager();
        /** @type {Array<{date: string, text: string}>} A log of significant events. */
        this.journal = this.persistence.loadJournal();
        /** @type {Array<string>} A list of crafting recipes the pet has discovered. */
        this.discoveredRecipes = this.persistence.loadRecipes();
        /** @type {Object.<string, {materials: Object.<string, number>, description: string}>} */
        this.recipes = {
            "Fancy Bookshelf": {
                materials: { "Sticks": 5, "Shiny Stone": 1 },
                description: "A beautiful bookshelf that makes studying more effective."
            }
        };

        /** @type {{painting: number, music: number}} A map of hobby levels. */
        this.hobbies = loadedData ? loadedData.hobbies : { painting: 0, music: 0 };
        /** @type {Object.<string, {level: number}>} A map of relationships with NPCs. */
        this.relationships = loadedData ? loadedData.relationships : {
            'Grizzled Scout': { level: 0 },
            'Master Artisan': { level: 0 },
            'Sickly Villager': { level: 0 }
        };
        /** @type {string} The pet's current location. */
        this.location = loadedData ? loadedData.location : 'Home';
    }

    /**
     * Simulates the passage of time for the Nadagotchi.
     * This method should be called in the main game loop. It handles stat decay, mood changes, and aging.
     * @param {object} [worldState={ weather: "Sunny", time: "Day", activeEvent: null }] - An object containing information about the game world.
     * @param {string} worldState.weather - The current weather (e.g., "Sunny", "Rainy").
     * @param {string} worldState.time - The current time of day (e.g., "Day", "Night").
     * @param {?object} worldState.activeEvent - The currently active world event, if any.
     */
    live(worldState = { weather: "Sunny", time: "Day", activeEvent: null }) {
        let hungerDecay = 0.05;
        let energyDecay = 0.02;
        let happinessChange = 0;

        if (worldState.activeEvent && worldState.activeEvent.name.includes('Festival')) {
            this.stats.happiness += 0.02;
        }

        switch (worldState.weather) {
            case "Rainy":
                if (this.dominantArchetype === "Adventurer") happinessChange -= 0.01;
                if (this.dominantArchetype === "Nurturer") energyDecay *= 0.5;
                break;
            case "Stormy":
                if (this.dominantArchetype === "Adventurer") happinessChange -= 0.03;
                if (this.dominantArchetype === "Recluse") happinessChange += 0.01;
                energyDecay *= 1.2;
                break;
            case "Cloudy":
                energyDecay *= 0.8;
                break;
            case "Sunny":
                if (this.dominantArchetype === "Adventurer") happinessChange += 0.01;
                energyDecay *= 1.1;
                break;
        }

        switch (worldState.time) {
            case "Night":
                hungerDecay *= 0.5;
                if (this.dominantArchetype === "Recluse") happinessChange += 0.01;
                if (this.dominantArchetype === "Adventurer") energyDecay *= 1.1;
                break;
            case "Dusk":
            case "Dawn":
                energyDecay *= 0.9;
                break;
            case "Day":
                if (this.dominantArchetype === "Intellectual") energyDecay *= 1.1;
                break;
        }

        this.stats.hunger -= hungerDecay;
        this.stats.energy -= energyDecay;
        this.stats.happiness += happinessChange;

        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;
        if (this.stats.happiness < 0) this.stats.happiness = 0;
        if (this.stats.happiness > 100) this.stats.happiness = 100;

        if (this.stats.hunger < 10) {
            this.mood = 'angry';
        } else if (this.stats.hunger < 30 || this.stats.energy < 20) {
            this.mood = 'sad';
        } else if (this.stats.hunger > 80 && this.stats.energy > 80) {
            this.mood = 'happy';
        } else {
            this.mood = 'neutral';
        }

        this.age += 0.001;
        if (this.age > 50 && !this.isLegacyReady) {
            this.isLegacyReady = true;
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
                this.stats.hunger = Math.min(100, this.stats.hunger + 15);
                this.stats.happiness = Math.min(100, this.stats.happiness + 5);
                if (this.dominantArchetype === 'Nurturer') this.personalityPoints.Nurturer++;
                break;

            case 'PLAY':
                this.stats.energy = Math.max(0, this.stats.energy - 10);
                this.stats.happiness = Math.min(100, this.stats.happiness + 10);
                if (['Adventurer', 'Mischievous'].includes(this.dominantArchetype)) {
                    this.mood = 'happy';
                    this.personalityPoints[this.dominantArchetype]++;
                } else if (this.dominantArchetype === 'Recluse') {
                    this.mood = 'sad';
                    this.stats.happiness -= 15;
                }
                break;

            case 'STUDY':
                this.stats.energy = Math.max(0, this.stats.energy - 5);
                this.stats.happiness = Math.max(0, this.stats.happiness - 5);
                moodMultiplier = this._getMoodMultiplier();
                this.skills.logic += (0.1 * moodMultiplier);

                if (this.dominantArchetype === 'Intellectual') {
                    this.mood = 'happy';
                    this.personalityPoints.Intellectual++;
                    this.stats.happiness += 15;
                } else {
                    this.personalityPoints.Intellectual++;
                }

                if (this.dominantArchetype === 'Adventurer') {
                    this.skills.navigation += (0.05 * moodMultiplier);
                }

                if (Math.random() < 0.05) this.discoverRecipe("Logic-Boosting Snack");
                break;

            case 'INTERACT_BOOKSHELF':
                this.stats.energy -= 5;
                this.stats.happiness -= 5;
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += 20;
                    this.mood = 'happy';
                }
                moodMultiplier = this._getMoodMultiplier();
                this.skills.logic += (0.15 * moodMultiplier);
                this.personalityPoints.Intellectual++;
                break;

            case 'INTERACT_PLANT':
                this.stats.energy -= 5;
                this.stats.happiness += 10;
                if (this.dominantArchetype === 'Nurturer') {
                    this.stats.happiness += 20;
                    this.mood = 'happy';
                }
                moodMultiplier = this._getMoodMultiplier();
                this.skills.empathy += (0.15 * moodMultiplier);
                this.personalityPoints.Nurturer++;
                break;

            case 'INTERACT_FANCY_BOOKSHELF':
                this.stats.energy -= 5;
                this.stats.happiness += 10; // It's a nice bookshelf!
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += 25; // Even better for intellectuals
                    this.mood = 'happy';
                }
                moodMultiplier = this._getMoodMultiplier();
                this.skills.logic += (0.25 * moodMultiplier); // Higher buff
                this.personalityPoints.Intellectual += 2;
                this.addJournalEntry("I spent some time studying at my beautiful new bookshelf. I feel so smart!");
                break;

            case 'EXPLORE':
                this.stats.energy = Math.max(0, this.stats.energy - 15);
                if (this.dominantArchetype === 'Adventurer') {
                    this.mood = 'happy';
                    this.stats.happiness += 20;
                    this.personalityPoints.Adventurer += 2;
                    this.skills.navigation += 0.1;
                    if (Math.random() < 0.1) this.discoverRecipe("Stamina-Up Tea");
                } else if (this.dominantArchetype === 'Recluse') {
                    this.mood = 'sad';
                    this.stats.happiness -= 20;
                } else {
                    this.stats.happiness += 5;
                }
                break;

            case "MEDITATE":
                this.stats.energy = Math.min(100, this.stats.energy + 5);
                this.stats.happiness += 5;
                moodMultiplier = this._getMoodMultiplier();
                this.skills.focus += (0.1 * moodMultiplier);
                if (this.dominantArchetype === "Recluse") this.personalityPoints.Recluse += 2;
                break;

            case "CRAFT_ITEM":
                this.craftItem(item);
                break;

            case 'PRACTICE_HOBBY':
                this.practiceHobby(item);
                break;

            case 'FORAGE':
                this.forage();
                break;
        }

        this.stats.happiness = Math.max(0, Math.min(100, this.stats.happiness));
        this.updateDominantArchetype();
        this.updateCareer();
    }

    /**
     * Increases the level of a specific hobby and updates stats.
     * @param {string} hobbyName - The name of the hobby to practice (e.g., 'painting').
     */
    practiceHobby(hobbyName) {
        if (this.hobbies.hasOwnProperty(hobbyName)) {
            this.hobbies[hobbyName] += 1;
            this.stats.happiness += 5;
            this.stats.energy -= 5;
            this.addJournalEntry(`I spent some time practicing ${hobbyName}.`);
        }
    }

    /**
     * Attempts to craft a specified item. Checks for required materials, consumes them, and adds the item to inventory.
     * @param {string} itemName - The name of the item to craft from the `this.recipes` object.
     */
    craftItem(itemName) {
        const recipe = this.recipes[itemName];
        if (!recipe) {
            this.addJournalEntry(`I tried to craft '${itemName}', but I don't know the recipe.`);
            return;
        }

        // Check if pet has all required materials
        for (const material in recipe.materials) {
            const requiredAmount = recipe.materials[material];
            const hasAmount = this.inventory[material] || 0;
            if (hasAmount < requiredAmount) {
                this.addJournalEntry(`I don't have enough ${material} to craft a ${itemName}.`);
                this.stats.happiness -= 5; // Frustration
                return;
            }
        }

        // Consume materials
        for (const material in recipe.materials) {
            this._removeItem(material, recipe.materials[material]);
        }

        // Add crafted item to inventory
        this._addItem(itemName, 1);
        this.stats.energy -= 15;
        this.stats.happiness += 20;
        const moodMultiplier = this._getMoodMultiplier();
        this.skills.crafting += (0.5 * moodMultiplier);
        this.addJournalEntry(`I successfully crafted a ${itemName}!`);
    }

    /**
     * Simulates foraging for items, changing location, updating stats, and adding items to inventory.
     */
    forage() {
        this.location = 'Forest';
        this.stats.energy -= 10;
        const moodMultiplier = this._getMoodMultiplier();
        this.skills.navigation += (0.2 * moodMultiplier);

        const foundItem = Phaser.Utils.Array.GetRandom(['Berries', 'Sticks', 'Shiny Stone']);
        this._addItem(foundItem, 1);
        this.addJournalEntry(`I went foraging in the ${this.location} and found a ${foundItem}.`);
        this.location = 'Home';
    }

    /**
     * Manages interaction with an NPC, updating relationship status and stats.
     * @param {string} npcName - The name of the NPC being interacted with.
     * @param {string} [interactionType='CHAT'] - The type of interaction (e.g., 'CHAT', 'GIFT').
     */    interact(npcName, interactionType) {
        if (this.relationships.hasOwnProperty(npcName)) {
            if (interactionType === 'GIFT' && this.inventory['Berries'] > 0) {
                this._removeItem('Berries', 1);
                this.relationships[npcName].level += 5;
                this.stats.happiness += 10;
                this.skills.empathy += 0.2;
                this.addJournalEntry(`I gave Berries to ${npcName}. They seemed to like it!`);
            } else {
                this.relationships[npcName].level += 1;
                this.stats.happiness += 2;
                this.skills.communication += 0.1;
    interact(npcName, interactionType = 'CHAT') {
        if (!this.relationships.hasOwnProperty(npcName)) {
            return;
        }

        const moodMultiplier = this._getMoodMultiplier();
        this.relationships[npcName].level += 1;
        this.stats.happiness += 3;
        this.skills.communication += 0.1;

        switch (npcName) {
            case 'Grizzled Scout':
                this.skills.navigation += 0.15 * moodMultiplier;
                this.addJournalEntry("The Grizzled Scout shared a story about a hidden grove. I learned a little about navigating the woods.");
                break;
            case 'Master Artisan':
                this.skills.crafting += 0.15 * moodMultiplier;
                this.addJournalEntry("The Master Artisan showed me a clever technique for joining wood. My crafting skill improved.");
                break;
            case 'Sickly Villager':
                this.skills.empathy += 0.15 * moodMultiplier;
                this.addJournalEntry("I spent some time with the Sickly Villager. It felt good to offer some comfort.");
                break;
            default:
                this.addJournalEntry(`I had a nice chat with ${npcName}.`);
                break;
        }
    }

    /**
     * Calculates the skill gain multiplier based on the pet's current mood.
     * @returns {number} The calculated mood multiplier (e.g., 1.5 for happy, 0.5 for sad).
     * @private
     */
    _getMoodMultiplier() {
        switch (this.mood) {
            case 'happy': return 1.5;
            case 'sad': return 0.5;
            case 'angry': return 0.2;
            default: return 1.0;
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
     */
    discoverRecipe(recipeName) {
        if (!this.discoveredRecipes.includes(recipeName)) {
            this.discoveredRecipes.push(recipeName);
            this.persistence.saveRecipes(this.discoveredRecipes);
            this.addJournalEntry(`I discovered a new recipe: ${recipeName}!`);
        }
    }

    /**
     * Updates the dominant archetype based on which personality has the most points.
     * In case of a tie, the existing dominant archetype is preferred to prevent rapid switching.
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
        // Otherwise, a new dominant archetype is chosen randomly from the contenders.
        // This prevents the pet's core personality from flipping back and forth unpredictably.
        if (potentialDominantArchetypes.length > 0 && !potentialDominantArchetypes.includes(this.dominantArchetype)) {
            // In a Phaser environment, we can use the random utility.
            if (typeof Phaser !== 'undefined' && Phaser.Utils && Phaser.Utils.Array) {
                this.dominantArchetype = Phaser.Utils.Array.GetRandom(potentialDominantArchetypes);
            } else {
                // In a non-Phaser environment (like testing), we fall back to a deterministic choice
                // to ensure tests are repeatable.
                this.dominantArchetype = potentialDominantArchetypes[0];
            }
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

            if (this.dominantArchetype === 'Intellectual' && this.skills.logic > 10) {
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
