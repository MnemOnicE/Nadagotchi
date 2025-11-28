import { Nadagotchi } from '../js/Nadagotchi';
import { Config } from '../js/Config';

// Mock localStorage and Phaser
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Live Loop Integration', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
    });

    test('Night Owl trait should reduce energy decay at Night', () => {
        // Setup Night Owl
        pet.genome.phenotype.specialAbility = 'Night Owl';
        // Ensure metabolism is normalized (multiplier 1.0)
        pet.genome.phenotype.metabolism = Config.GENETICS.METABOLISM_NORMALIZER;

        const initialEnergy = 100;
        pet.stats.energy = initialEnergy;

        // Calculate expected decay
        // Energy Decay = Base * Metabolism * Trait
        // Night Decay Base = Config.DECAY.ENERGY (0.02)
        // Night Env Modifier for Adventurer = 1.1 (Config.ENV_MODIFIERS.NIGHT.ADVENTURER_ENERGY_MULT)
        // So effective base = 0.02 * 1.1 = 0.022
        // Night Owl Multiplier = 0.8
        // Expected Drop = 0.022 * 0.8 = 0.0176

        const worldState = { weather: 'Clear', time: 'Night', activeEvent: null };
        pet.live(worldState);

        const expectedEnergy = initialEnergy - (Config.DECAY.ENERGY * Config.ENV_MODIFIERS.NIGHT.ADVENTURER_ENERGY_MULT * Config.TRAITS.NIGHT_OWL_MULT);
        expect(pet.stats.energy).toBeCloseTo(expectedEnergy, 5);
    });

    test('Adventurer should lose happiness in Rainy weather', () => {
        pet.dominantArchetype = 'Adventurer';
        const initialHappiness = 80;
        pet.stats.happiness = initialHappiness;

        const worldState = { weather: 'Rainy', time: 'Day', activeEvent: null };
        pet.live(worldState);

        // Adventurer Happiness Change in Rain = -0.01
        const expectedHappiness = initialHappiness + Config.ENV_MODIFIERS.RAINY.ADVENTURER_HAPPINESS;
        expect(pet.stats.happiness).toBeCloseTo(expectedHappiness, 5);
    });

    test('Metabolism should scale decay rates', () => {
        // High Metabolism (10) -> 2.0x Multiplier
        pet.genome.phenotype.metabolism = 10;
        pet.genome.phenotype.specialAbility = null; // No traits

        const initialHunger = 100;
        pet.stats.hunger = initialHunger;

        // Base Hunger Decay = 0.05
        // Multiplier = 10 / 5 = 2.0
        // Expected Drop = 0.1

        const worldState = { weather: 'Sunny', time: 'Day', activeEvent: null };
        pet.live(worldState);

        // Sunny doesn't affect hunger.
        // Hunger Decay = Base * Metabolism
        const expectedHunger = initialHunger - (Config.DECAY.HUNGER * 2.0);
        expect(pet.stats.hunger).toBeCloseTo(expectedHunger, 5);
    });
});
