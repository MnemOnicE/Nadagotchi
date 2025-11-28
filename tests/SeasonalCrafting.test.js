
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

// Mock Phaser
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Task Verification', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
    });

    test('Recipe "Metabolism-Slowing Tonic" should exist', () => {
        expect(pet.recipes).toHaveProperty('Metabolism-Slowing Tonic');
    });

    test('Foraging in Winter should yield "Frostbloom"', () => {
        // Simulate Winter by passing it to live(), assuming we implement it that way
        pet.live({ weather: "Sunny", time: "Day", activeEvent: null, season: "Winter" });

        // Spy on GetRandom to check what items are available
        const getRandomSpy = jest.spyOn(Phaser.Utils.Array, 'GetRandom');

        pet.handleAction('FORAGE');

        const calls = getRandomSpy.mock.calls;
        const lastCallArgs = calls[calls.length - 1][0];

        expect(lastCallArgs).toContain('Frostbloom');

        getRandomSpy.mockRestore();
    });

    test('GeneticsSystem should recognize "Metabolism-Slowing Tonic"', () => {
        const parentGenome = new Genome();
        // Breed with the tonic
        const childGenome = GeneticsSystem.breed(parentGenome, ['Metabolism-Slowing Tonic']);

        // We expect one allele to be 2 (from the tonic)
        const metabolismAlleles = childGenome.genotype.metabolism;
        expect(metabolismAlleles).toContain(2);
    });
});
