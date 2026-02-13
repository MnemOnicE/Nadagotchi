
import { Nadagotchi } from '../js/Nadagotchi';
import { GeneticsSystem, Genome } from '../js/GeneticsSystem';

class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Mock Phaser (still needed for some internals, but not GetRandom in Nadagotchi anymore)
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr ? arr[0] : null
        }
    }
};
global.Phaser = Phaser;

describe('Task Verification', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Ensure plenty of energy
        pet.stats.energy = 100;
    });

    test('Recipe "Metabolism-Slowing Tonic" should exist', () => {
        expect(pet.recipes).toHaveProperty('Metabolism-Slowing Tonic');
    });

    test('Foraging in Winter should yield "Frostbloom"', () => {
        // Simulate Winter by passing it to live()
        pet.live({ weather: "Sunny", time: "Day", activeEvent: null, season: "Winter" });

        // Mock RNG to avoid rare artifact drop failure (needs > 0.02)
        jest.spyOn(pet.rng, 'random').mockReturnValue(0.5);

        // Spy on the seeded RNG
        const choiceSpy = jest.spyOn(pet.rng, 'choice');

        pet.handleAction('FORAGE');

        // Check calls to choice()
        expect(choiceSpy).toHaveBeenCalled();

        // Check arguments passed to choice(). Should be the potential items array.
        // The array is constructed inside the method: ['Berries', 'Sticks', 'Shiny Stone', 'Frostbloom']
        const args = choiceSpy.mock.calls[0][0];
        expect(args).toContain('Frostbloom');

        choiceSpy.mockRestore();
    });

    test('GeneticsSystem should recognize "Metabolism-Slowing Tonic"', () => {
        const parentGenome = new Genome(null, null, pet.rng); // Mock RNG needs to be passed now
        // Breed with the tonic
        // Need to mock inventory check if calculating from Nadagotchi instance,
        // but GeneticsSystem.breed is static.

        // GeneticsSystem.breed(parentGenome, envFactors, rng)
        const childGenome = GeneticsSystem.breed(parentGenome, ['Metabolism-Slowing Tonic'], pet.rng);

        // We expect one allele to be 2 (from the tonic)
        const metabolismAlleles = childGenome.genotype.metabolism;
        // With current RNG mock returning 0.5, mutation might not happen or value might shift differently
        // But logic is: if tonic present, target value 2.
        // Wait, EnvMap for Tonic maps to 2.
        // breed() picks one allele from parent, one from mutation/env.
        // If Env factor triggers, it sets one allele to Target + noise.
        // Target is 2. Noise is -1 to 1. So 1, 2, or 3.
        // It SHOULD contain 1, 2, or 3.
        const validValues = [1, 2, 3];
        const hasValid = metabolismAlleles.some(val => validValues.includes(val));
        expect(hasValid).toBe(true);
    });
});
