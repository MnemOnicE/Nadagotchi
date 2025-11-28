/**
 * Constants for the Genetics System.
 */
export const MUTATION_RATE = 0.05;
export const MAX_PERSONALITY = 100;
export const MAX_PHYSIO = 10;
export const POSSIBLE_TRAITS = ['Night Owl', 'Photosynthetic'];

/**
 * Represents the genetic makeup of a Nadagotchi.
 * Encapsulates Genotype (Allele Pairs) and Phenotype (Expressed Stats).
 */
export class Genome {
    /**
     * @param {Object} genes - Optional initial genotype.
     */
    constructor(genes = null) {
        // Genotype: The hidden DNA (Pairs of [Allele1, Allele2])
        if (genes) {
            this.genotype = genes;
        } else {
            // Helper to generate a wild personality gene (10-30)
            const randomGene = () => Math.floor(Math.random() * 21) + 10;

            this.genotype = {
                // Personality Potentials (0-100)
                Adventurer: [randomGene(), randomGene()],
                Nurturer: [randomGene(), randomGene()],
                Mischievous: [randomGene(), randomGene()],
                Intellectual: [randomGene(), randomGene()],
                Recluse: [randomGene(), randomGene()],

                // Physiological Traits
                metabolism: [5, 5],   // 1=Slow, 10=Fast
                moodSensitivity: [5, 5],

                // Legacy Traits (Strings or null)
                specialAbility: [null, null]
            };
        }

        // Phenotype: The expressed stats used by the game
        this.phenotype = this.calculatePhenotype();
    }

    /**
     * Calculates the expressed traits (phenotype) from the genotype.
     * @returns {Object} The phenotype object.
     */
    calculatePhenotype() {
        const phenotype = {};
        for (const [trait, alleles] of Object.entries(this.genotype)) {
            if (trait === 'specialAbility') {
                // Traits: Specific strings override null.
                // If both are strings and different, pick one randomly.
                const activeTraits = alleles.filter(a => a !== null);
                if (activeTraits.length > 0) {
                    phenotype[trait] = activeTraits[Math.floor(Math.random() * activeTraits.length)];
                } else {
                    phenotype[trait] = null;
                }

                // Check for Homozygous state
                // Only consider it homozygous if both alleles are the same non-null trait.
                // If both are null, it's effectively homozygous null, but that doesn't trigger the flag usually.
                // But for "Active + Bonus Effect", we care about the trait.
                if (alleles[0] !== null && alleles[0] === alleles[1]) {
                    phenotype.isHomozygous = true;
                } else {
                    phenotype.isHomozygous = false;
                }

            } else if (trait === 'metabolism') {
                // Metabolism: Average of the two alleles
                const sum = alleles.reduce((a, b) => a + b, 0);
                phenotype[trait] = sum / alleles.length;
                if (alleles[0] === alleles[1]) {
                    phenotype.isHomozygousMetabolism = true;
                }

            } else {
                // Numeric Stats (Personality, MoodSensitivity): The Higher of the two alleles is Dominant
                phenotype[trait] = Math.max(...alleles);

                // Check for Homozygous state for numeric stats
                const capitalizedTrait = trait.charAt(0).toUpperCase() + trait.slice(1);
                if (alleles[0] === alleles[1]) {
                    phenotype[`isHomozygous${capitalizedTrait}`] = true;
                }
            }
        }
        return phenotype;
    }
}

/**
 * System for handling genetic inheritance and breeding logic.
 */
export class GeneticsSystem {
    /**
     * Generates a new Genome based on a parent Genome and environmental items.
     * @param {Genome} parentGenome - The genome of the parent.
     * @param {string[]} environmentalItems - List of items present during breeding.
     * @returns {Genome} A new Genome instance for the offspring.
     */
    static breed(parentGenome, environmentalItems = []) {
        const newGenotype = {};
        const parentGenotype = parentGenome.genotype;

        // Environment Mapping
        // Maps item IDs (from BreedingScene) to Gene targets and values.
        const envMap = {
            'Ancient Tome': { gene: 'Intellectual', value: 70 },
            'Heart Amulet': { gene: 'Nurturer', value: 70 },
            'Muse Flower': { gene: 'Mischievous', value: 70 },
            'Nutrient Bar': { gene: 'metabolism', value: 8 },
            'Espresso': { gene: 'metabolism', value: 9 },
            'Chamomile': { gene: 'metabolism', value: 2 },
            'Metabolism-Slowing Tonic': { gene: 'metabolism', value: 2 },
            'book': { gene: 'Intellectual', value: 80 }          // Generic Book (for tests/flexibility)
        };

        for (const geneKey in parentGenotype) {
            // --- Step 1: Meiosis (Parental Contribution) ---
            // Randomly select one allele from the parent's pair.
            const parentAlleles = parentGenotype[geneKey];
            let parentAllele = parentAlleles[Math.floor(Math.random() * parentAlleles.length)];

            // --- Step 2: Environmental Contribution (The "Second Parent") ---
            let envAllele = null;

            // Check if any environmental item targets this gene
            for (const item of environmentalItems) {
                const mapping = envMap[item];
                // Check if the item maps to the current gene
                if (mapping && mapping.gene === geneKey) {
                    envAllele = mapping.value;
                    break; // Use the first matching item found
                }
            }

            // If no item targets this gene, provide a random "Wild" allele
            if (envAllele === null) {
                if (geneKey === 'specialAbility') {
                    envAllele = null; // Wild usually doesn't provide special traits
                } else if (geneKey === 'metabolism' || geneKey === 'moodSensitivity') {
                    // Physio: Wild values are typically average/random (1-10)
                    envAllele = Math.floor(Math.random() * 10) + 1;
                } else {
                    // Personality: Wild values are low (10-30) as per new requirement
                    envAllele = Math.floor(Math.random() * 21) + 10;
                }
            }

            // --- Step 3: Mutation ---
            // Mutate Parent Allele
            if (Math.random() < MUTATION_RATE) {
                parentAllele = GeneticsSystem.mutateAllele(geneKey, parentAllele);
            }
            // Mutate Environment Allele
            if (Math.random() < MUTATION_RATE) {
                envAllele = GeneticsSystem.mutateAllele(geneKey, envAllele);
            }

            newGenotype[geneKey] = [parentAllele, envAllele];
        }

        return new Genome(newGenotype);
    }

    /**
     * Helper to mutate a single allele value.
     * @param {string} geneKey - The name of the gene.
     * @param {*} value - The current value of the allele.
     * @returns {*} The mutated value.
     */
    static mutateAllele(geneKey, value) {
        if (geneKey === 'specialAbility') {
            // Chance to flip to a random trait or back to null
            if (value === null) {
                return POSSIBLE_TRAITS[Math.floor(Math.random() * POSSIBLE_TRAITS.length)];
            } else {
                // Small chance to lose trait? Or switch?
                // Let's say switch or lose.
                return Math.random() < 0.5 ? null : POSSIBLE_TRAITS[Math.floor(Math.random() * POSSIBLE_TRAITS.length)];
            }
        } else {
            // Numeric mutation
            let mutationAmount = (geneKey === 'metabolism' || geneKey === 'moodSensitivity') ? 1 : 5;
            let newValue = value + (Math.random() < 0.5 ? mutationAmount : -mutationAmount);

            // Clamp values
            const max = (geneKey === 'metabolism' || geneKey === 'moodSensitivity') ? MAX_PHYSIO : MAX_PERSONALITY;
            return Math.max(0, Math.min(max, newValue));
        }
    }
}
