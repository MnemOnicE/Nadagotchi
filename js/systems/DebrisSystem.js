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

        if (this._addDebris(type, x, y, 'GARDEN')) {
            this.pet.addJournalEntry(`Something appeared in the garden: ${type}`);
        }
    }

    /**
     * Internal helper to add a debris item to the pet's map and update state.
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {string} location
     * @returns {boolean} True if the debris was successfully added.
     * @private
     */
    _addDebris(type, x, y, location) {
        if (this.pet.debrisCount >= Config.DEBRIS.MAX_COUNT) return false;
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
        return true;
    }

    /**
     * Helper to check if a spot is already occupied by debris.
     * @param {number} x
     * @param {number} y
     * @param {string} location
     * @param {object[]} debrisList
     * @returns {boolean}
     * @private
     */
    _isSpotOccupied(x, y, location, debrisList) {
        const overlapThresholdSq = 0.05 * 0.05;
        for (const d of debrisList) {
            const dLoc = d.location || 'GARDEN';
            if (dLoc !== location) continue;

            const dx = d.x - x;
            const dy = d.y - y;
            if (dx * dx + dy * dy < overlapThresholdSq) {
                return true;
            }
        }
        return false;
    }

    /**
     * Spawns a poop item.
     */
    spawnPoop() {
        let x, y;
        let valid = false;
        let attempts = 0;
        const maxAttempts = 10;
        const location = this.pet.location || 'GARDEN';
        // Optimization: Get values once to reduce array allocations inside the search loop
        const debrisList = Object.values(this.pet.debris);

        // Try to find a spot that doesn't overlap existing debris
        while (!valid && attempts < maxAttempts) {
            attempts++;
            x = this.pet.rng.range(10, 90) / 100;
            y = this.pet.rng.range(60, 90) / 100;

            valid = !this._isSpotOccupied(x, y, location, debrisList);
        }

        if (!valid) return;

        if (this._addDebris('poop', x, y, this.pet.location || 'GARDEN')) {
            // Chance for a funny journal entry (10%)
            if (this.pet.rng.random() < 0.1) {
                 this.pet.addJournalEntry("The garden has received a... natural gift.");
            } else {
                 this.pet.addJournalEntry("Something smells funny in the garden.");
            }
        this._addDebris('poop', x, y, location);

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
        const item = this.pet.debris[id];
        if (!item) return { success: false, message: "Item not found." };

        if (this.pet.stats.energy < Config.DEBRIS.CLEAN_ENERGY_COST) {
            return { success: false, message: "Too tired to clean." };
        }
        this.pet.stats.energy -= Config.DEBRIS.CLEAN_ENERGY_COST;

        delete this.pet.debris[id];
        this.pet.debrisCount--;
        this.pet.recalculateCleanlinessPenalty();

        const rewardConfig = {
            weed: { msg: "You pulled a weed.", res: Config.DEBRIS.CLEAN_SKILL_GAIN },
            poop: { msg: "Yuck! You cleaned it up.", res: Config.DEBRIS.CLEAN_SKILL_GAIN * 2, hap: 5 },
            rock_small: { msg: "You found a Shiny Stone!", inv: 'Shiny Stone' },
            Berries: { msg: "You found some wild Berries.", inv: 'Berries' },
            Sticks: { msg: "You gathered some Sticks.", inv: 'Sticks' }
        // Optimized reward lookup to reduce code duplication
        const rewardConfig = {
            'weed': { msg: "You pulled a weed.", res: Config.DEBRIS.CLEAN_SKILL_GAIN },
            'poop': { msg: "Yuck! You cleaned it up.", res: Config.DEBRIS.CLEAN_SKILL_GAIN * 2, hap: 5 },
            'rock_small': { msg: "You found a Shiny Stone!", inv: 'Shiny Stone' },
            'Berries': { msg: "You found some wild Berries.", inv: 'Berries' },
            'Sticks': { msg: "You gathered some Sticks.", inv: 'Sticks' }
        };

        const reward = rewardConfig[item.type];
        if (reward) {
            if (reward.res) this.pet.skills.resilience += reward.res;
            if (reward.hap) this.pet.stats.happiness += reward.hap;
            if (reward.inv) this.pet.inventorySystem.addItem(reward.inv, 1);
            return { success: true, message: reward.msg };
        }

        return { success: true, message: "Item removed." };
    }
}
