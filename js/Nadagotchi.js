/**
 * Represents the core Nadagotchi entity.
 */
class Nadagotchi {
    /**
     * Creates a new Nadagotchi.
     * @param {string} archetype - The initial archetype of the Nadagotchi (e.g., 'Adventurer', 'Nurturer').
     */
    constructor(archetype) {
        // Store the initial archetype.
        this.archetype = archetype;

        // Set a default initial mood.
        this.mood = 'happy';

        // Initialize personality points for each archetype.
        this.personalityPoints = {
            Adventurer: 0,
            Nurturer: 0,
            Mischievous: 0,
            Intellectual: 0,
            Recluse: 0
        };
        // Give the starting archetype some points.
        if (this.personalityPoints.hasOwnProperty(archetype)) {
            this.personalityPoints[archetype] = 10;
        }

        // Initialize other stats.
        this.stats = {
            hunger: 100,
            energy: 100
        };
    }

    /**
     * Gets the current mood of the Nadagotchi.
     * @returns {string} The current mood.
     */
    getMood() {
        return this.mood;
    }

    /**
     * Sets a new mood for the Nadagotchi.
     * @param {string} newMood - The new mood.
     */
    setMood(newMood) {
        this.mood = newMood;
    }

    /**
     * Gets the dominant archetype of the Nadagotchi.
     * For now, this just returns the initial archetype.
     * @returns {string} The dominant archetype.
     */
    getArchetype() {
        // In the future, this could calculate the dominant archetype based on personality points.
        return this.archetype;
    }

    /**
     * Adjusts the hunger stat of the Nadagotchi.
     * @param {number} amount - The amount to adjust hunger by (can be positive or negative).
     */
    adjustHunger(amount) {
        this.stats.hunger += amount;
        // Clamp hunger between 0 and 100 (or a max value).
        if (this.stats.hunger > 100) {
            this.stats.hunger = 100;
        }
        if (this.stats.hunger < 0) {
            this.stats.hunger = 0;
        }
    }
}
