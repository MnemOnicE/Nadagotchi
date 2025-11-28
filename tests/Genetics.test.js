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

        test('should calculate phenotype correctly (Average Metabolism)', () => {
            const genes = {
                Adventurer: [10, 10],
                Nurturer: [10, 10],
                Mischievous: [10, 10],
                Intellectual: [10, 10],
                Recluse: [10, 10],
                metabolism: [8, 4], // Average should be 6
                moodSensitivity: [5, 5],
                specialAbility: [null, null]
            };
            const genome = new Genome(genes);
            expect(genome.phenotype.metabolism).toBe(6);
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
            expect(genome.phenotype.isHomozygous).toBe(false);
        });

        test('should detect homozygous traits', () => {
            const genes = {
                Adventurer: [10, 10],
                Nurturer: [10, 10],
                Mischievous: [10, 10],
                Intellectual: [10, 10],
                Recluse: [10, 10],
                metabolism: [5, 5],
                moodSensitivity: [5, 5],
                specialAbility: ['Night Owl', 'Night Owl']
            };
            const genome = new Genome(genes);
            expect(genome.phenotype.specialAbility).toBe('Night Owl');
            expect(genome.phenotype.isHomozygous).toBe(true);
        });

        test('should initialize with random defaults if no genes provided', () => {
            const genome = new Genome();
            // Check that values are within expected range (10-30 for personality)
            expect(genome.genotype.Adventurer[0]).toBeGreaterThanOrEqual(10);
            expect(genome.genotype.Adventurer[0]).toBeLessThanOrEqual(30);
            expect(genome.genotype.metabolism[0]).toBe(5); // Physio defaults
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
            let obtainedRecessive = false;
            for(let i=0; i<100; i++) {
                const child = GeneticsSystem.breed(parentGenome, []);
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
            expect(child.phenotype.Intellectual).toBeGreaterThanOrEqual(65);
        });

        test('Environmental Dominance: Nutrient Bar should affect Metabolism', () => {
            const child = GeneticsSystem.breed(parentGenome, ['nutrient']);
            // Nutrient Bar -> Metabolism 8.
            // We check if at least one allele is >= 7 (allowing for -1 mutation)
            const hasHighAllele = child.genotype.metabolism.some(allele => allele >= 7);
            expect(hasHighAllele).toBe(true);
        });

        test('Environmental Dominance: Espresso should affect Metabolism', () => {
            const child = GeneticsSystem.breed(parentGenome, ['espresso']);
            // Espresso -> Metabolism 9.
            // Check genotype has high value (allowing for -1 mutation)
            const hasHighAllele = child.genotype.metabolism.some(allele => allele >= 8);
            expect(hasHighAllele).toBe(true);
        });

        test('Trait Mutation: Should be able to lose or switch trait', () => {
             const homoGenes = {
                Adventurer: [10, 10], Nurturer: [10, 10], Mischievous: [10, 10],
                Intellectual: [10, 10], Recluse: [10, 10],
                metabolism: [5, 5], moodSensitivity: [5, 5],
                specialAbility: ['Night Owl', 'Night Owl']
            };
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
