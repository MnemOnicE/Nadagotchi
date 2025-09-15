/**
 * Represents the core Nadagotchi entity, its "Brain".
 * This class holds the Nadagotchi's state, including its personality, stats, skills, and more.
 */
class Nadagotchi {
    /**
     * Creates a new Nadagotchi.
     * @param {string} initialArchetype - The initial archetype of the Nadagotchi (e.g., 'Adventurer', 'Nurturer').
     */
    constructor(initialArchetype) {
        // --- I. PERSONALITY & MOOD SYSTEM ---
        /** @type {string} - The current mood of the Nadagotchi ('happy', 'sad', 'angry', 'neutral'). */
        this.mood = 'neutral';
        /** @type {string} - The dominant personality archetype. */
        this.dominantArchetype = initialArchetype;
        /** @type {Object.<string, number>} - Points for each personality archetype. */
        this.personalityPoints = {
            Adventurer: 0,
            Nurturer: 0,
            Mischievous: 0,
            Intellectual: 0,
            Recluse: 0
        };
        this.personalityPoints[initialArchetype] = 10;

        // --- CORE STATS ---
        /** @type {{hunger: number, energy: number, happiness: number}} - Core needs and happiness levels. */
        this.stats = {
            hunger: 100,
            energy: 100,
            happiness: 70
        };

        // --- III. CAREER & SKILL SYSTEM (Placeholder) ---
        /** @type {Object.<string, number>} - Skills the Nadagotchi can learn. */
        this.skills = {
            // Core Skills
            communication: 1,
            resilience: 1,
            // Archetype-Specific Skills
            navigation: 0, // Adventurer
            empathy: 0,    // Nurturer
            logic: 0       // Intellectual
        };
        /** @type {?string} - The current career of the Nadagotchi. */
        this.currentCareer = null; // e.g., 'Scout', 'Healer'
        /** @type {Array} - Items that can be used for training or other activities. */
        this.inventory = [];

        // --- II. GENERATIONAL LEGACY SYSTEM (Placeholder) ---
        /** @type {number} - The age of the Nadagotchi. */
        this.age = 0;
        /** @type {Array<string>} - Inherited traits from previous generations. */
        this.legacyTraits = []; // e.g., 'Swift Learner', 'Zen Focus'
    }

    /**
     * Simulates the passage of time for the Nadagotchi.
     * This method should be called in the main game loop. It handles stat decay and autonomous mood changes.
     */
    live() {
        // 1. Stats decay over time
        this.stats.hunger -= 0.05; // Slower decay for balance
        this.stats.energy -= 0.02; // Slower decay for balance

        // Clamp stats to a minimum of 0
        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;

        // 2. Mood is affected by needs
        if (this.stats.hunger < 30 || this.stats.energy < 20) {
            this.mood = 'sad';
        } else if (this.stats.hunger < 10) {
            this.mood = 'angry';
        } else if (this.stats.hunger > 80 && this.stats.energy > 80) {
            this.mood = 'happy';
        } else {
            this.mood = 'neutral';
        }

        // 3. Age increases
        this.age += 0.001; // Slower aging
    }

    /**
     * Handles a player-initiated action.
     * This method updates the Nadagotchi's state based on the action performed.
     * @param {string} actionType - The type of action (e.g., 'FEED', 'PLAY', 'STUDY').
     * @param {any} [item=null] - An optional item used in the action.
     */
    handleAction(actionType, item = null) {
        switch (actionType) {
            case 'FEED':
                this.stats.hunger += 15;
                if (this.stats.hunger > 100) this.stats.hunger = 100;
                this.stats.happiness += 5;
                if (this.stats.happiness > 100) this.stats.happiness = 100;

                // A 'Nurturer' gains a personality point from being cared for
                if (this.dominantArchetype === 'Nurturer') {
                    this.personalityPoints.Nurturer++;
                }
                break;
            case 'PLAY':
                this.stats.energy -= 10;
                if (this.stats.energy < 0) this.stats.energy = 0;
                this.stats.happiness += 10;
                if (this.stats.happiness > 100) this.stats.happiness = 100;

                // Different archetypes react differently to play
                if (['Adventurer', 'Mischievous'].includes(this.dominantArchetype)) {
                    this.mood = 'happy';
                    this.personalityPoints[this.dominantArchetype]++;
                } else if (this.dominantArchetype === 'Recluse') {
                    this.mood = 'sad';
                    this.stats.happiness -= 5; // Recluses don't like to play
                }
                break;
            case 'STUDY':
                this.stats.energy -= 5;
                if (this.stats.energy < 0) this.stats.energy = 0;
                this.stats.happiness -= 5; // Studying can be draining
                if (this.stats.happiness < 0) this.stats.happiness = 0;

                if (this.dominantArchetype === 'Intellectual') {
                    this.mood = 'happy';
                    this.personalityPoints.Intellectual++;
                    this.skills.logic += 0.1; // Studying increases a skill!
                    this.stats.happiness += 10; // Intellectuals enjoy studying
                } else {
                    this.personalityPoints.Intellectual++; // Anyone can learn
                }
                break;
        }
        // Ensure stats don't go out of bounds
        if (this.stats.happiness > 100) this.stats.happiness = 100;
        if (this.stats.happiness < 0) this.stats.happiness = 0;

        this.updateDominantArchetype();
    }

    /**
     * Updates the dominant archetype based on which personality has the most points.
     */
    updateDominantArchetype() {
        let maxPoints = -1;
        let newDominantArchetype = this.dominantArchetype;

        for (const archetype in this.personalityPoints) {
            if (this.personalityPoints.hasOwnProperty(archetype)) {
                if (this.personalityPoints[archetype] > maxPoints) {
                    maxPoints = this.personalityPoints[archetype];
                    newDominantArchetype = archetype;
                }
            }
        }
        this.dominantArchetype = newDominantArchetype;
    }
}
