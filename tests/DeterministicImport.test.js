
import { Nadagotchi } from '../js/Nadagotchi.js';
import { GeneticsSystem, Genome } from '../js/GeneticsSystem.js';
import { Config } from '../js/Config.js';

describe('Deterministic Import', () => {
    it('should produce identical pets for the same DNA string', async () => {
        // 1. Create a Genome with heterozygous special ability to force RNG choice
        const genotype = {
            Adventurer: [10, 10],
            Nurturer: [10, 10],
            Mischievous: [10, 10],
            Intellectual: [10, 10],
            Recluse: [10, 10],
            metabolism: [5, 5],
            moodSensitivity: [5, 5],
            specialAbility: ['Night Owl', 'Photosynthetic'] // Heterozygous!
        };
        const genome = new Genome(genotype);

        // 2. Serialize to DNA
        const dnaString = await GeneticsSystem.serialize(genome);

        // 3. Generate data multiple times
        const results = [];
        const iterations = 50;

        for (let i = 0; i < iterations; i++) {
            const data = await Nadagotchi.generateDataFromDNA(dnaString);
            // We care about the expressed special trait in legacyTraits
            results.push(data.legacyTraits[0]);
        }

        // 4. Analyze results
        const uniqueResults = [...new Set(results)];

        // Expectation: It SHOULD be length 1 for deterministic behavior
        expect(uniqueResults.length).toBe(1);
    });
});
