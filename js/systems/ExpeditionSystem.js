import { ExpeditionNodes } from '../ExpeditionDefinitions.js';
import { Config } from '../Config.js';

/**
 * @fileoverview System for generating procedural expeditions.
 * Selects nodes based on environment (season, weather) and randomness.
 */
export class ExpeditionSystem {
    /**
     * @param {object} rng - The seeded random number generator.
     */
    constructor(rng) {
        this.rng = rng;
    }

    /**
     * Generates a path of encounter nodes for an expedition.
     * @param {string} season - The current season (Spring, Summer, Autumn, Winter).
     * @param {string} weather - The current weather (Sunny, Rainy, etc).
     * @param {string} biome - The current biome (Forest, Desert, etc).
     * @param {number} length - Number of nodes in the path (default 3).
     * @returns {Array<object>} An array of node objects.
     */
    generatePath(season, weather, biome = 'Forest', length = 3) {
        const validNodes = [];

        // Filter nodes based on criteria
        for (const key in ExpeditionNodes) {
            const node = ExpeditionNodes[key];
            let isValid = true;

            // Check Season
            if (node.season && !node.season.includes(season)) {
                isValid = false;
            }

            // Check Weather
            if (node.weather && !node.weather.includes(weather)) {
                isValid = false;
            }

            // Check Biome
            if (node.biomes && !node.biomes.includes(biome)) {
                isValid = false;
            }

            if (isValid) {
                validNodes.push(node);
            }
        }

        const path = [];
        if (validNodes.length === 0) return path;

        // Calculate total weight once
        const totalWeight = validNodes.reduce((sum, node) => sum + (node.weight !== undefined ? node.weight : 1.0), 0);

        for (let i = 0; i < length; i++) {
            // Weighted Random Selection
            let randomValue;
            if (typeof this.rng.random === 'function') {
                randomValue = this.rng.random() * totalWeight;
            } else {
                 // Fallback if random() not exposed but range is.
                 randomValue = (this.rng.range(0, 10000) / 10000) * totalWeight;
            }

            let selected = null;
            let currentWeight = 0;

            for (const node of validNodes) {
                currentWeight += (node.weight !== undefined ? node.weight : 1.0);
                if (randomValue <= currentWeight) {
                    selected = node;
                    break;
                }
            }

            // Fallback for floating point precision edge cases
            if (!selected) selected = validNodes[validNodes.length - 1];

            path.push(selected);
        }

        return path;
    }

    /**
     * Resolves an action choice against the pet's stats.
     * @param {object} choice - The choice object from the node definition.
     * @param {import('../Nadagotchi.js').Nadagotchi} pet - The pet instance.
     * @returns {object} The result object (success or failure definition + actual roll).
     */
    resolveChoice(choice, pet) {
        if (!choice.skill) {
            // No skill check, auto success
            return { outcome: 'success', details: choice.success };
        }

        const skillLevel = pet.skills[choice.skill] || 0;
        // Base chance 50%, +10% per skill level vs difficulty?
        // Let's do a simple roll: Roll(0-10) + Skill >= Difficulty
        const roll = this.rng.range(0, 10);
        const total = roll + skillLevel;

        if (total >= choice.difficulty) {
            return { outcome: 'success', details: choice.success, roll: total };
        } else {
            return { outcome: 'failure', details: choice.failure, roll: total };
        }
    }
}
