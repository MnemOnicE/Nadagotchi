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
        if (this.pet.debris.length >= Config.DEBRIS.MAX_COUNT) return;

        // Base Chance
        if (this.pet.rng.random() > Config.DEBRIS.SPAWN_CHANCE_DAILY) return;

        // Determine Type
        const types = ['weed', 'rock_small'];

        // Seasonal Forage
        if (season === 'Spring' && this.pet.rng.random() < 0.3) types.push('Berries');
        if (season === 'Autumn' && this.pet.rng.random() < 0.3) types.push('Sticks');

        const type = this.pet.rng.choice(types);

        // Generate Position (Will be refined by MainScene relative to screen)
        // We store normalized 0-1 coords to be safe across resolutions?
        // Or just generic "Garden" coords (0-800, 300-600)
        // Let's store generic relative coords (x: 0.1-0.9, y: 0.6-0.9)
        const x = this.pet.rng.range(10, 90) / 100;
        const y = this.pet.rng.range(60, 90) / 100;

        const debris = {
            id: this.pet.generateUUID(),
            type: type,
            x: x,
            y: y,
            created: Date.now()
        };

        this.pet.debris.push(debris);
        this.pet.addJournalEntry(`Something appeared in the garden: ${type}`);
    }

    /**
     * Spawns a poop item. Called when hunger is processed?
     * Or simpler: Daily check.
     */
    spawnPoop() {
        // Limit
        if (this.pet.debris.length >= Config.DEBRIS.MAX_COUNT) return;

        const x = this.pet.rng.range(10, 90) / 100;
        const y = this.pet.rng.range(60, 90) / 100;

        const debris = {
            id: this.pet.generateUUID(),
            type: 'poop',
            x: x,
            y: y,
            created: Date.now()
        };
        this.pet.debris.push(debris);
        // Ensure mood impact immediately?
        // No, handled by live()
    }

    /**
     * Cleans/Collects a debris item.
     * @param {string} id
     * @returns {object} Result { success, message, reward }
     */
    clean(id) {
        const index = this.pet.debris.findIndex(d => d.id === id);
        if (index === -1) return { success: false, message: "Item not found." };

        const item = this.pet.debris[index];

        // Cost
        if (this.pet.stats.energy < Config.DEBRIS.CLEAN_ENERGY_COST) {
            return { success: false, message: "Too tired to clean." };
        }
        this.pet.stats.energy -= Config.DEBRIS.CLEAN_ENERGY_COST;

        // Remove
        this.pet.debris.splice(index, 1);

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
