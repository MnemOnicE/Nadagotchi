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
     * @param {number} length - Number of nodes in the path (default 3).
     * @returns {Array<object>} An array of node objects.
     */
    generatePath(season, weather, length = 3) {
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

            if (isValid) {
                validNodes.push(node);
            }
        }

        // Select nodes
        const path = [];
        for (let i = 0; i < length; i++) {
            if (validNodes.length === 0) break;

            // Weighted selection could go here, for now simple random
            // If we want unique nodes per path, we should splice them out
            // But repeats might be okay for generic ones. Let's allow repeats for now.
            const selected = this.rng.choice(validNodes);
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
