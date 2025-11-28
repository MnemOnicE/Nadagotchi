import { Genome, GeneticsSystem } from '../js/GeneticsSystem.js';

describe('GeneticsSystem', () => {

    describe('Genome Class', () => {
        test('should calculate phenotype correctly (Dominant Numeric)', () => {
            const genes = {
                Adventurer: [100, 10], // 100 dominant
                Nurturer: [5, 5],
                Mischievous: [10, 10],
                Intellectual: [10, 10],
                Recluse: [10, 10],
                metabolism: [5, 5],
                moodSensitivity: [5, 5],
                specialAbility: [null, null]
            };
            const genome = new Genome(genes);
            expect(genome.phenotype.Adventurer).toBe(100);
        });

        test('should calculate phenotype correctly (Traits)', () => {
            const genes = {
                Adventurer: [10, 10],
                Nurturer: [10, 10],
                Mischievous: [10, 10],
                Intellectual: [10, 10],
                Recluse: [10, 10],
                metabolism: [5, 5],
                moodSensitivity: [5, 5],
                specialAbility: ['Night Owl', null] // "Night Owl" should override null
            };
            const genome = new Genome(genes);
            expect(genome.phenotype.specialAbility).toBe('Night Owl');
        });
    });

    describe('Breeding Logic', () => {
        let parentGenome;

        beforeEach(() => {
            // Setup a parent with known genotype
            const genes = {
                Adventurer: [100, 10], // Heterozygous High/Low
                Nurturer: [10, 10],
                Mischievous: [10, 10],
                Intellectual: [10, 10],
                Recluse: [10, 10],
                metabolism: [5, 5],
                moodSensitivity: [5, 5],
                specialAbility: [null, null]
            };
            parentGenome = new Genome(genes);
        });

        test('Recessive Inheritance: Should be able to inherit recessive allele', () => {
            // We want to force picking the '10' from [100, 10]
            // And force Environment to be Wild (low value)
            // And force no mutation.

            const originalRandom = Math.random;
            // Math.random calls:
            // For each gene (loop order? Object keys order is generally definition order but not guaranteed.
            // However, Adventurer is usually first in our definition).

            // Let's rely on statistical test or mocking specific calls?
            // Mocking is safer for "Ensure...".

            // Call order per gene:
            // 1. Pick Parent Allele (0 or 1 index)
            // 2. Pick Env Allele (Wild logic) -> Random 1-20 or 1-10
            // 3. Mutate Parent (Check < 0.05)
            // 4. Mutate Env (Check < 0.05)

            // We need to mock randomly. This is brittle if order changes.
            // Alternative: Run many times and check if at least one result has low value.

            let obtainedRecessive = false;
            for(let i=0; i<100; i++) {
                const child = GeneticsSystem.breed(parentGenome, []);
                // If child Adventurer is around 10 (plus wild/mutation), it's recessive.
                // Parent Dominant is 100. Recessive is 10.
                // Wild is 1-20.
                // So if we pick 10 and wild 10 -> Max is 10. Phenotype 10.
                // If we pick 100 -> Phenotype 100.
                if (child.phenotype.Adventurer < 50) {
                    obtainedRecessive = true;
                    break;
                }
            }
            expect(obtainedRecessive).toBe(true);
        });

        test('Environmental Dominance: Book should give high Intellectual', () => {
            // Pass 'book' or 'logic'
            const child = GeneticsSystem.breed(parentGenome, ['logic']);

            // Logic item -> Intellectual 70.
            // Parent Intellectual -> 10.
            // Child Genotype -> [10, 70].
            // Phenotype -> 70.

            // Allow for mutation (+/- 5).
            expect(child.phenotype.Intellectual).toBeGreaterThanOrEqual(65);
        });

        test('Environmental Dominance: Nutrient Bar should affect Metabolism', () => {
            const child = GeneticsSystem.breed(parentGenome, ['nutrient']);
            // Nutrient Bar -> Metabolism 8.
            expect(child.phenotype.metabolism).toBeGreaterThanOrEqual(7); // 8 +/- 1 mutation
        });

        test('Trait Mutation: Should be able to lose or switch trait', () => {
            // Mock random to force trait mutation logic
            const genes = {
                Adventurer: [10, 10], Nurturer: [10, 10], Mischievous: [10, 10],
                Intellectual: [10, 10], Recluse: [10, 10],
                metabolism: [5, 5], moodSensitivity: [5, 5],
                specialAbility: ['Night Owl', null]
            };
            const pGenome = new Genome(genes);

            // We need to hit lines 145-150 in GeneticsSystem.js
            // This happens inside breed -> mutateAllele -> specialAbility block

            // To ensure we test the logic, we can just call mutateAllele directly if it was exposed?
            // It is static helper but not exported.
            // So we rely on breed.

            // We can try to force mutation with mock
            const originalRandom = Math.random;
            Math.random = jest.fn();

            // Setup random calls to trigger trait mutation.
            // 1. Pick Parent Allele (Say index 0: 'Night Owl') -> returns 0
            // 2. Pick Env Allele (Wild/Null) -> returns 0
            // 3. Mutate Parent? -> returns 0.01 (Yes < 0.05)
            // 4. Inside mutateAllele('specialAbility', 'Night Owl'):
            //    It checks value === null? No.
            //    returns Math.random() < 0.5 ? null : ...
            //    Let's make it return 0.1 (<0.5) -> null.

            Math.random
                .mockReturnValueOnce(0) // Parent allele index 0
                .mockReturnValueOnce(0) // Env allele selection (irrelevant, wild)
                .mockReturnValueOnce(0.01) // Mutate Parent: Yes
                .mockReturnValueOnce(0.1) // Lose trait (becomes null)
                .mockReturnValueOnce(0.9); // Mutate Env: No

            // We need to iterate until we hit specialAbility loop.
            // The loop order is not guaranteed.
            // This mocking strategy is fragile if loop order changes.
            // A better way is to loop breed many times and check if we lost the trait.

            Math.random = originalRandom;

            let lostTrait = false;
            for(let i=0; i<200; i++) {
                const child = GeneticsSystem.breed(pGenome, []);
                // If we started with 'Night Owl' and null.
                // Child could have 'Night Owl', null, or New Trait.
                // We want to see if we can get null from 'Night Owl' via mutation.
                // Or get a DIFFERENT trait.

                // If phenotype is null, it means we have [null, null].
                // Parent gave Night Owl? If it mutated to null, yes.
                // Or Parent gave null (50% chance).
                // To be sure it's mutation, we need [Night Owl, Night Owl] parent?

            }
            // Actually, code coverage just needs execution.
            // Using a homozygous parent ['Night Owl', 'Night Owl']
            // Breeding with no env (gives null).
            // Child gets [Night Owl, null]. Phenotype: Night Owl.
            // If mutation happens on Night Owl allele -> it becomes null or different trait.
            // If it becomes null -> Child is [null, null] -> Phenotype null.
            // If it becomes different -> Child is [Different, null] -> Phenotype Different.

            const homoGenes = { ...genes, specialAbility: ['Night Owl', 'Night Owl'] };
            const homoParent = new Genome(homoGenes);

            let changed = false;
            for(let i=0; i<500; i++) {
                const child = GeneticsSystem.breed(homoParent, []);
                if (child.phenotype.specialAbility !== 'Night Owl') {
                    changed = true;
                    break;
                }
            }
            expect(changed).toBe(true);
        });
    });
});
