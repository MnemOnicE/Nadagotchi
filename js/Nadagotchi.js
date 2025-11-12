/**
 * Represents the core Nadagotchi entity, its "Brain".
 * This class holds the Nadagotchi's state, including its personality, stats, skills, and more.
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
            this.mood = loadedData.mood;
            this.dominantArchetype = loadedData.dominantArchetype;
            this.personalityPoints = loadedData.personalityPoints;
            this.stats = loadedData.stats;
            this.skills = loadedData.skills;
            this.currentCareer = loadedData.currentCareer;
            this.inventory = loadedData.inventory || [];
            this.age = loadedData.age;
            this.generation = loadedData.generation || 1;
            this.isLegacyReady = loadedData.isLegacyReady || false;
            this.legacyTraits = loadedData.legacyTraits || [];
            this.moodSensitivity = loadedData.moodSensitivity || 5; // Default to 5 if not present
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
            this.inventory = [];
            this.age = 0;
            this.generation = 1;

            // --- IV. GENERATIONAL LEGACY SYSTEM ---
            /** @type {boolean} - Becomes true when the pet is old enough to retire. */
            this.isLegacyReady = false;
            /** @type {Array<string>} - Special traits inherited from ancestors. */
            this.legacyTraits = [];
            /** @type {number} - A 1-10 scale affecting mood swing intensity. */
            this.moodSensitivity = 5; // Mid-range default
        }

        /** @type {?string} - A flag used by the UI to show a one-time notification when a career is unlocked. */
        this.newCareerUnlocked = null;

        // --- V. META-GAME FEATURES ---
        this.persistence = new PersistenceManager();
        /** @type {Array<object>} - A log of significant events. */
        this.journal = this.persistence.loadJournal();
        /** @type {Array<string>} - A list of crafting recipes the pet has discovered. */
        this.discoveredRecipes = this.persistence.loadRecipes();

        // --- New Subsystems ---
        this.hobbies = loadedData ? loadedData.hobbies : { painting: 0, music: 0 };
        this.relationships = loadedData ? loadedData.relationships : { friend: { level: 0 } };
        this.location = loadedData ? loadedData.location : 'Home';
    }

    /**
     * Simulates the passage of time for the Nadagotchi.
     * This method should be called in the main game loop. It handles stat decay and autonomous mood changes.
     * @param {object} worldState - An object containing information about the game world (e.g., weather, time, activeEvent).
     */
    live(worldState = { weather: "Sunny", time: "Day", activeEvent: null }) {
        // Section 1: Stats Decay with environmental modifiers
        let hungerDecay = 0.05;
        let energyDecay = 0.02;

        // Apply event modifiers first
        if (worldState.activeEvent) {
            // Festivals make the pet happier
            if (worldState.activeEvent.name.includes('Festival')) {
                this.stats.happiness += 0.02;
                if (this.stats.happiness > 100) this.stats.happiness = 100;
            }
        }

        // Apply weather/time modifiers
        if (worldState.weather === "Rainy") {
            if (this.dominantArchetype === "Adventurer") {
                this.stats.happiness -= 0.01; // Adventurers get restless in rain
                if (this.stats.happiness < 0) this.stats.happiness = 0; // Prevent negative happiness
            }
            if (this.dominantArchetype === "Nurturer") {
                energyDecay *= 0.5; // Nurturers get cozy and save energy
            }
        }

        if (worldState.time === "Night") {
            hungerDecay *= 0.5; // Less activity at night means less hunger
        }

        this.stats.hunger -= hungerDecay;
        this.stats.energy -= energyDecay;

        // Ensure stats do not fall below zero.
        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;

        // Section 2: Mood Calculation
        // The Nadagotchi's mood is a direct consequence of its current needs.
        // This creates a clear feedback loop for the player.

        // --- BUG FIX ---
        // The conditional logic has been re-ordered to check for the most critical
        // state ('angry') first, as the previous logic would never allow it to be reached.
        if (this.stats.hunger < 10) {
            // If needs are critically low, the pet becomes angry.
            this.mood = 'angry';
        } else if (this.stats.hunger < 30 || this.stats.energy < 20) {
            // If needs are low, the pet becomes sad.
            this.mood = 'sad';
        } else if (this.stats.hunger > 80 && this.stats.energy > 80) {
            // If needs are high, the pet is happy.
            this.mood = 'happy';
        } else {
            // Otherwise, the pet is in a neutral state.
            this.mood = 'neutral';
        }

        // Section 3: Aging
        // The pet's age gradually increases.
        this.age += 0.001;

        // NEW: Check for legacy readiness
        if (this.age > 50 && !this.isLegacyReady) { // 50 is an example age
            this.isLegacyReady = true;
        }
    }

    /**
     * Handles a player-initiated action.
     * This method updates the Nadagotchi's state based on the action performed.
     * The 'STUDY' action includes a mood-based multiplier for skill gain, making
     * the Nadagotchi's emotional state a critical factor in its development.
     * @param {string} actionType - The type of action (e.g., 'FEED', 'PLAY', 'STUDY').
     * @param {any} [item=null] - An optional item used in the action.
     */
    handleAction(actionType, item = null) {
        // --- BUG FIX ---
        // The moodMultiplier is now calculated *inside* each action that needs it.
        // This ensures that any mood changes from the action itself are accounted for
        // *before* calculating skill gains, which was the source of the bug.
        let moodMultiplier;

        switch (actionType) {
            case 'FEED':
                // Feeding replenishes hunger and provides a small amount of happiness.
                this.stats.hunger += 15;
                if (this.stats.hunger > 100) this.stats.hunger = 100; // Cap hunger at 100
                this.stats.happiness += 5;
                if (this.stats.happiness > 100) this.stats.happiness = 100; // Cap happiness at 100

                // Personality hook: Nurturers gain personality points from being cared for.
                if (this.dominantArchetype === 'Nurturer') {
                    this.personalityPoints.Nurturer++;
                }
                break;

            case 'PLAY':
                // Playing costs energy but increases happiness.
                this.stats.energy -= 10;
                if (this.stats.energy < 0) this.stats.energy = 0; // Prevent negative energy
                this.stats.happiness += 10;
                if (this.stats.happiness > 100) this.stats.happiness = 100;

                // Personality hook: Different archetypes react uniquely to play.
                if (['Adventurer', 'Mischievous'].includes(this.dominantArchetype)) {
                    // These archetypes enjoy playing.
                    this.mood = 'happy';
                    this.personalityPoints[this.dominantArchetype]++;
                } else if (this.dominantArchetype === 'Recluse') {
                    // Recluses dislike playing, which makes them sad and unhappy.
                    this.mood = 'sad';
                    this.stats.happiness -= 15; // More significant happiness drop
                }
                break;

            case 'STUDY':
                this.stats.energy -= 5;
                if (this.stats.energy < 0) this.stats.energy = 0;
                this.stats.happiness -= 5;
                if (this.stats.happiness < 0) this.stats.happiness = 0;

                if (this.dominantArchetype === 'Intellectual') {
                    this.mood = 'happy';
                    this.personalityPoints.Intellectual++;
                    // Recalculate multiplier *after* mood change
                    moodMultiplier = this._getMoodMultiplier();
                    this.skills.logic += (0.1 * moodMultiplier);
                    this.stats.happiness += 15;
                } else {
                    this.personalityPoints.Intellectual++;
                    moodMultiplier = this._getMoodMultiplier();
                    this.skills.logic += (0.1 * moodMultiplier);
                }

                if (this.dominantArchetype === 'Adventurer') {
                    moodMultiplier = this._getMoodMultiplier();
                    this.skills.navigation += (0.05 * moodMultiplier);
                }

                // Chance to discover a recipe
                if (Math.random() < 0.05) { // 5% chance
                    this.discoverRecipe("Logic-Boosting Snack");
                }
                break;

            case 'INTERACT_BOOKSHELF':
                this.stats.energy -= 5;
                this.stats.happiness -= 5;

                // Set mood first, then calculate multiplier
                if (this.dominantArchetype === 'Intellectual') {
                    this.stats.happiness += 20; // Big happiness boost for Intellectuals
                    this.mood = 'happy';
                }

                moodMultiplier = this._getMoodMultiplier();
                this.skills.logic += (0.15 * moodMultiplier); // Slightly more effective
                this.personalityPoints.Intellectual++;
                break;

            case 'INTERACT_PLANT':
                this.stats.energy -= 5;
                this.stats.happiness += 10;

                // Set mood first, then calculate multiplier
                if (this.dominantArchetype === 'Nurturer') {
                    this.stats.happiness += 20; // Big happiness boost for Nurturers
                    this.mood = 'happy';
                }

                moodMultiplier = this._getMoodMultiplier();
                this.skills.empathy += (0.15 * moodMultiplier); // Slightly more effective
                this.personalityPoints.Nurturer++;
                break;

            case 'EXPLORE':
                this.stats.energy -= 15;
                if (this.stats.energy < 0) this.stats.energy = 0;

                if (this.dominantArchetype === 'Adventurer') {
                    this.mood = 'happy';
                    this.stats.happiness += 20;
                    this.personalityPoints.Adventurer += 2;
                    this.skills.navigation += 0.1;

                    // Chance to discover a recipe
                    if (Math.random() < 0.1) { // 10% chance
                        this.discoverRecipe("Stamina-Up Tea");
                    }
                } else if (this.dominantArchetype === 'Recluse') {
                    this.mood = 'sad';
                    this.stats.happiness -= 20;
                } else {
                    this.stats.happiness += 5;
                }
                break;

            case "MEDITATE":
                this.stats.energy += 5;
                if (this.stats.energy > 100) this.stats.energy = 100;
                this.stats.happiness += 5;
                moodMultiplier = this._getMoodMultiplier();
                this.skills.focus += (0.1 * moodMultiplier);
                if (this.dominantArchetype === "Recluse") {
                    this.personalityPoints.Recluse += 2;
                }
                break;

            case "CRAFT_ITEM":
                this.stats.energy -= 10;
                moodMultiplier = this._getMoodMultiplier();
                this.skills.crafting += (0.1 * moodMultiplier);
                this.inventory.push("Simple Widget");
                if (this.dominantArchetype === "Recluse") {
                    this.stats.happiness += 10;
                }
                break;
            case 'PRACTICE_HOBBY':
                this.practiceHobby(item); // e.g., item = 'painting'
                break;
            case 'FORAGE':
                this.forage();
                break;
            case 'INTERACT_NPC':
                this.interact('friend', item); // e.g., item = 'GIFT'
                break;
        }
        // Final check to ensure happiness stat stays within the 0-100 bounds after any action.
        if (this.stats.happiness > 100) this.stats.happiness = 100;
        if (this.stats.happiness < 0) this.stats.happiness = 0;

        // After any action that might affect personality, check if the dominant archetype needs to be updated.
        this.updateDominantArchetype();

        // After updating the archetype, check if a new career has been unlocked.
        this.updateCareer();
    }

    /**
     * Increases the level of a specific hobby.
     * @param {string} hobbyName - The name of the hobby to practice.
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
     * Simulates foraging for items, adding them to the inventory.
     */
    forage() {
        this.location = 'Forest'; // Change location
        this.stats.energy -= 10;
        const moodMultiplier = this._getMoodMultiplier();
        this.skills.navigation += (0.2 * moodMultiplier);

        const foundItem = Phaser.Utils.Array.GetRandom(['Berries', 'Sticks', 'Shiny Stone']);
        this.inventory.push(foundItem);
        this.addJournalEntry(`I went foraging in the ${this.location} and found ${foundItem}.`);
        this.location = 'Home'; // Return home
    }

    /**
     * Manages interaction with an NPC.
     * @param {string} npcName - The name of the NPC.
     * @param {string} interactionType - The type of interaction.
     */
    interact(npcName, interactionType) {
        if (this.relationships.hasOwnProperty(npcName)) {
            if (interactionType === 'GIFT' && this.inventory.includes('Berries')) {
                this.inventory.splice(this.inventory.indexOf('Berries'), 1);
                this.relationships[npcName].level += 5;
                this.stats.happiness += 10;
                this.skills.empathy += 0.2;
                this.addJournalEntry(`I gave Berries to ${npcName}. They seemed to like it!`);
            } else {
                this.relationships[npcName].level += 1;
                this.stats.happiness += 2;
                this.skills.communication += 0.1;
                this.addJournalEntry(`I had a nice chat with ${npcName}.`);
            }
        }
    }

    /**
     * Calculates the skill gain multiplier based on the pet's current mood.
     * @returns {number} The calculated mood multiplier.
     * @private
     */
    _getMoodMultiplier() {
        switch (this.mood) {
            case 'happy': return 1.5; // A happy pet is a fast learner.
            case 'sad': return 0.5;   // A sad pet struggles to focus.
            case 'angry': return 0.2; // An angry pet barely learns at all.
            default: return 1.0;      // Neutral is the baseline.
        }
    }

    /**
     * Adds a new entry to the journal and saves it.
     * @param {string} text - The content of the journal entry.
     */
    addJournalEntry(text) {
        const newEntry = { date: new Date().toLocaleString(), text: text };
        this.journal.push(newEntry);
        this.persistence.saveJournal(this.journal);
    }

    /**
     * Adds a new recipe to the list if it's not already discovered and saves.
     * @param {string} recipeName - The name of the recipe.
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
     * @private
     */
    updateDominantArchetype() {
        let maxPoints = -1;
        let newDominantArchetype = this.dominantArchetype;

        // Iterate through all personality archetypes to find the one with the highest score.
        for (const archetype in this.personalityPoints) {
            // A safety check to ensure we only check properties of the object itself.
            if (this.personalityPoints.hasOwnProperty(archetype)) {
                if (this.personalityPoints[archetype] > maxPoints) {
                    maxPoints = this.personalityPoints[archetype];
                    newDominantArchetype = archetype;
                }
            }
        }

        // If a new archetype has more points, it becomes the new dominant one.
        // This allows for dynamic personality shifts based on player actions.
        this.dominantArchetype = newDominantArchetype;
    }

    /**
     * Checks and updates the Nadagotchi's career based on its skills and archetype.
     * This is the logic specified in the v0.6 roadmap.
     * @private
     */
    updateCareer() {
        // Only check for a new career if the Nadagotchi doesn't have one.
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
}
