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

        /** @type {string} - The current mood of the Nadagotchi. Can be 'happy', 'sad', 'angry', or 'neutral'. */
        this.mood = 'neutral';

        /** @type {string} - The dominant personality archetype, which influences behavior and preferences. */
        this.dominantArchetype = initialArchetype;

        /** @type {Object.<string, number>} - A map tracking the points for each personality archetype. The highest score determines the dominant archetype. */
        this.personalityPoints = {
            Adventurer: 0,
            Nurturer: 0,
            Mischievous: 0,
            Intellectual: 0,
            Recluse: 0
        };
        // Give the initial archetype a starting boost in points.
        this.personalityPoints[initialArchetype] = 10;

        // --- II. CORE STATS ---

        /** @type {{hunger: number, energy: number, happiness: number}} - A collection of the Nadagotchi's primary needs and feelings. */
        this.stats = {
            hunger: 100,    // Decreases over time, replenished by feeding.
            energy: 100,    // Decreases over time and with actions, replenished by resting (not yet implemented).
            happiness: 70   // Influenced by needs being met and activities.
        };

        // --- III. CAREER & SKILL SYSTEM (Placeholder) ---

        /** @type {Object.<string, number>} - A map of skills the Nadagotchi can learn. These are planned to influence career paths and mini-game performance. */
        this.skills = {
            // Core Skills, applicable to all archetypes
            communication: 1,
            resilience: 1,
            // Archetype-Specific Skills, which develop based on activities
            navigation: 0, // Adventurer
            empathy: 0,    // Nurturer
            logic: 0       // Intellectual
        };

        /** @type {?string} - The current career path of the Nadagotchi. This is a placeholder for a future feature. */
        this.currentCareer = null; // e.g., 'Scout', 'Healer'

        /** @type {Array} - A list of items the Nadagotchi possesses. This is a placeholder for a future feature. */
        this.inventory = [];

        // --- IV. GENERATIONAL LEGACY SYSTEM (Placeholder) ---

        /** @type {number} - The age of the Nadagotchi, which increases over time. */
        this.age = 0;

        /** @type {Array<string>} - A list of special traits inherited from previous generations. This is a placeholder for a future feature. */
        this.legacyTraits = []; // e.g., 'Swift Learner', 'Zen Focus'
    }

    /**
     * Simulates the passage of time for the Nadagotchi.
     * This method should be called in the main game loop. It handles stat decay and autonomous mood changes.
     */
    live() {
        // Section 1: Stats Decay
        // Hunger and energy naturally decrease over time. The values are kept low to make the simulation balanced.
        this.stats.hunger -= 0.05;
        this.stats.energy -= 0.02;

        // Ensure stats do not fall below zero.
        if (this.stats.hunger < 0) this.stats.hunger = 0;
        if (this.stats.energy < 0) this.stats.energy = 0;

        // Section 2: Mood Calculation
        // The Nadagotchi's mood is a direct consequence of its current needs.
        // This creates a clear feedback loop for the player.
        if (this.stats.hunger < 30 || this.stats.energy < 20) {
            // If needs are low, the pet becomes sad.
            this.mood = 'sad';
        } else if (this.stats.hunger < 10) {
            // If needs are critically low, the pet becomes angry.
            this.mood = 'angry';
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

        // Section 4: Career Progression Check
        this._updateCareer();
    }

    /**
     * Checks for and applies career progression based on skill thresholds.
     * This is an internal method called by the `live` loop.
     * @private
     */
    _updateCareer() {
        // Do nothing if the Nadagotchi already has a career.
        if (this.currentCareer) {
            return;
        }

        // Check for the "Innovator" career path.
        if (this.skills.logic > 10) {
            this.currentCareer = 'Innovator';
            // In a real game, we might emit an event here for the UI to catch.
            console.log(`Career Unlocked: ${this.currentCareer}`);
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
                // Studying costs a small amount of energy and can be mentally draining.
                this.stats.energy -= 5;
                if (this.stats.energy < 0) this.stats.energy = 0;
                this.stats.happiness -= 5;
                if (this.stats.happiness < 0) this.stats.happiness = 0;

                // New Feature: Mood-based skill gain.
                // The effectiveness of studying is now tied to the Nadagotchi's mood.
                let moodMultiplier;
                switch (this.mood) {
                    case 'happy':
                        moodMultiplier = 1.5; // A happy pet is a fast learner.
                        break;
                    case 'sad':
                        moodMultiplier = 0.5; // A sad pet struggles to focus.
                        break;
                    case 'angry':
                        moodMultiplier = 0.2; // An angry pet barely learns at all.
                        break;
                    default: // 'neutral'
                        moodMultiplier = 1.0; // The baseline learning rate.
                }

                // Personality hook: Intellectuals thrive on studying, but mood is still a factor.
                if (this.dominantArchetype === 'Intellectual') {
                    this.mood = 'happy'; // Studying makes them happy.
                    this.personalityPoints.Intellectual++;
                    // Apply the mood multiplier to the skill gain.
                    this.skills.logic += (0.1 * moodMultiplier);
                    this.stats.happiness += 15; // They gain a significant happiness boost.
                } else {
                    // Even non-Intellectuals can gain points from studying, and their mood affects the outcome.
                    this.personalityPoints.Intellectual++;
                    this.skills.logic += (0.1 * moodMultiplier);
                }
                break;

            case 'EXPLORE':
                // Exploring is tiring but can be very rewarding for certain archetypes.
                this.stats.energy -= 15;
                if (this.stats.energy < 0) this.stats.energy = 0;

                // Personality hook: Adventurers love to explore.
                if (this.dominantArchetype === 'Adventurer') {
                    this.mood = 'happy';
                    this.stats.happiness += 20; // A big boost for doing what they love.
                    this.personalityPoints.Adventurer += 2; // Strongly reinforces the archetype.
                } else if (this.dominantArchetype === 'Recluse') {
                    // Recluses are stressed by exploration.
                    this.mood = 'sad';
                    this.stats.happiness -= 20;
                } else {
                    // Other archetypes get a small, neutral benefit.
                    this.stats.happiness += 5;
                }
                break;
        }
        // Final check to ensure happiness stat stays within the 0-100 bounds after any action.
        if (this.stats.happiness > 100) this.stats.happiness = 100;
        if (this.stats.happiness < 0) this.stats.happiness = 0;

        // After any action that might affect personality, check if the dominant archetype needs to be updated.
        this.updateDominantArchetype();
    }

    /**
     * Updates the dominant archetype based on which personality has the most points.
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
}
