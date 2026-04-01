import { Config } from '../Config.js';

/**
 * @fileoverview Manages debris and forage items in the game world.
 * Handles spawning logic and cleanup rewards.
 */
export class DebrisSystem {
    /**
     * @param {import('../Nadagotchi.js').Nadagotchi} pet
     */
    constructor(pet) {
        this.pet = pet;
    }

    /**
     * Attempts to spawn daily debris based on season and weather.
     * @param {string} season
     * @param {string} weather
     */
    spawnDaily(season, weather) {
        // Limit max debris
        if (this.pet.debrisCount >= Config.DEBRIS.MAX_COUNT) return;

        // Base Chance
        if (this.pet.rng.random() > Config.DEBRIS.SPAWN_CHANCE_DAILY) return;

        // Determine Type
        const types = ['weed', 'rock_small'];

        // Seasonal Forage
        if (season === 'Spring' && this.pet.rng.random() < 0.3) types.push('Berries');
        if (season === 'Autumn' && this.pet.rng.random() < 0.3) types.push('Sticks');

        const type = this.pet.rng.choice(types);

        // Generate Position
        const x = this.pet.rng.range(10, 90) / 100;
        const y = this.pet.rng.range(60, 90) / 100;

        this._addDebris(type, x, y, 'GARDEN');
        this.pet.addJournalEntry(`Something appeared in the garden: ${type}`);
    }

    /**
     * Internal helper to add a debris item to the pet's map and update state.
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {string} location
     * @private
     */
    _addDebris(type, x, y, location) {
        const debris = {
            id: this.pet.generateUUID(),
            type: type,
            location: location,
            x: x,
            y: y,
            created: Date.now()
        };
        this.pet.debris[debris.id] = debris;
        this.pet.debrisCount++;
        this.pet.recalculateCleanlinessPenalty();
    }

    /**
     * Spawns a poop item.
     */
    spawnPoop() {
        // Limit
        if (this.pet.debrisCount >= Config.DEBRIS.MAX_COUNT) return;

        let x, y;
        let valid = false;
        let attempts = 0;
        const maxAttempts = 10;
        const overlapThreshold = 0.05;

        // Try to find a spot that doesn't overlap existing debris
        while (!valid && attempts < maxAttempts) {
            attempts++;
            x = this.pet.rng.range(10, 90) / 100;
            y = this.pet.rng.range(60, 90) / 100;

            // Check overlap with existing debris in same location
            const location = this.pet.location || 'GARDEN';
            let isOverlapping = false;
            for (const id of Object.keys(this.pet.debris)) {
                if (!Object.hasOwn(this.pet.debris, id)) continue;
                const d = this.pet.debris[id];
                const dLoc = d.location || 'GARDEN';
                if (dLoc !== location) continue;

                const dist = Math.hypot(d.x - x, d.y - y);
                if (dist < overlapThreshold) {
                    isOverlapping = true;
                    break;
                }
            }
            valid = !isOverlapping;
        }

        if (!valid) return;

        this._addDebris('poop', x, y, this.pet.location || 'GARDEN');

        // Chance for a funny journal entry (10%)
        if (this.pet.rng.random() < 0.1) {
             this.pet.addJournalEntry("The garden has received a... natural gift.");
        } else {
             this.pet.addJournalEntry("Something smells funny in the garden.");
        }
    }

    /**
     * Cleans/Collects a debris item.
     * @param {string} id
     * @returns {object} Result { success, message, reward }
     */
    clean(id) {
        // Security: Ensure it's an own property to prevent prototype injection
        if (!Object.hasOwn(this.pet.debris, id)) {
            return { success: false, message: "Item not found." };
        }

        const item = this.pet.debris[id];

        // Cost
        if (this.pet.stats.energy < Config.DEBRIS.CLEAN_ENERGY_COST) {
            return { success: false, message: "Too tired to clean." };
        }
        this.pet.stats.energy -= Config.DEBRIS.CLEAN_ENERGY_COST;

        // Remove
        delete this.pet.debris[id];
        this.pet.debrisCount--;
        this.pet.recalculateCleanlinessPenalty();

        let message = "";

        // Logic based on Type
        if (item.type === 'weed') {
            message = "You pulled a weed.";
            this.pet.skills.resilience += Config.DEBRIS.CLEAN_SKILL_GAIN;
        } else if (item.type === 'poop') {
            message = "Yuck! You cleaned it up.";
            this.pet.skills.resilience += (Config.DEBRIS.CLEAN_SKILL_GAIN * 2);
            this.pet.stats.happiness += 5; // Relief
        } else if (item.type === 'rock_small') {
            message = "You found a Shiny Stone!";
            this.pet.inventorySystem.addItem('Shiny Stone', 1);
        } else if (item.type === 'Berries') {
            message = "You found some wild Berries.";
            this.pet.inventorySystem.addItem('Berries', 1);
        } else if (item.type === 'Sticks') {
            message = "You gathered some Sticks.";
            this.pet.inventorySystem.addItem('Sticks', 1);
        }

        return { success: true, message: message };
    }
}
