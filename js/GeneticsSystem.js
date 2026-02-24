/**
 * @fileoverview Logic for the genetics system, including Genome structure and breeding mechanics.
 * Handles genotype-to-phenotype mapping, mutation, and environmental influences.
 */

import { SeededRandom } from './utils/SeededRandom.js';
import { Config } from './Config.js';
import { CryptoUtils } from './utils/CryptoUtils.js';

import { toBase64, fromBase64 } from './utils/Encoding.js';

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
     * Creates a new Genome.
     * @param {Object} [genes=null] - Optional initial genotype object. If null, a wild genome is generated.
     * @param {Object} [phenotype=null] - Optional initial phenotype object. If provided, skips calculation.
     * @param {SeededRandom} [rng=null] - The seeded RNG instance. Required if genes or phenotype are missing/incomplete.
     */
    constructor(genes = null, phenotype = null, rng = null) {
        // Fallback to Math.random if no RNG provided (Legacy support / Safety)
        const random = rng ? () => rng.random() : () => Math.random();
        const range = rng ? (min, max) => rng.range(min, max) : (min, max) => Math.floor(Math.random() * (max - min)) + min;

        // Genotype: The hidden DNA (Pairs of [Allele1, Allele2])
        if (genes) {
            this.genotype = genes;
        } else {
            // Helper to generate a wild personality gene (10-30)
            const randomGene = () => range(10, 31); // 10 to 30 inclusive

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
        if (phenotype) {
            this.phenotype = phenotype;
        } else {
            this.phenotype = this.calculatePhenotype(rng);
        }
    }

    /**
     * Calculates the expressed traits (phenotype) from the genotype.
     * Strategies vary by trait type: Average for metabolism, Max for personality (Dominant logic).
     * @param {SeededRandom} [rng=null] - RNG for resolving ties/random traits.
     * @returns {Object} The phenotype object containing expressed values and homozygous flags.
     */
    calculatePhenotype(rng = null) {
        const random = rng ? () => rng.random() : () => Math.random();
        const choice = rng ? (arr) => rng.choice(arr) : (arr) => arr[Math.floor(Math.random() * arr.length)];

        const phenotype = {};
        for (const [trait, alleles] of Object.entries(this.genotype)) {
            if (trait === 'specialAbility') {
                // Traits: Specific strings override null.
                // If both are strings and different, pick one randomly.
                const activeTraits = alleles.filter(a => a !== null);
                if (activeTraits.length > 0) {
                    phenotype[trait] = choice(activeTraits);
                } else {
                    phenotype[trait] = null;
                }

                // Check for Homozygous state
                // Only consider it homozygous if both alleles are the same non-null trait.
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
     * Map of item IDs to Gene targets and values.
     */
    static ENV_MAP = {
        'Ancient Tome': { gene: 'Intellectual', value: 70 },
        'Heart Amulet': { gene: 'Nurturer', value: 70 },
        'Muse Flower': { gene: 'Mischievous', value: 70 },
        'Nutrient Bar': { gene: 'metabolism', value: 8 },
        'Espresso': { gene: 'metabolism', value: 9 },
        'Chamomile': { gene: 'metabolism', value: 2 },
        'Metabolism-Slowing Tonic': { gene: 'metabolism', value: 2 },
        'book': { gene: 'Intellectual', value: 80 },          // Generic Book (for tests/flexibility)

        // Expanded Environment Influence (Crafted Items & Resources)
        'Fancy Bookshelf': { gene: 'Intellectual', value: 75 },
        'Masterwork Chair': { gene: 'Recluse', value: 75 },
        'Logic-Boosting Snack': { gene: 'Intellectual', value: 60 },
        'Stamina-Up Tea': { gene: 'Adventurer', value: 65 },
        'Shiny Stone': { gene: 'Mischievous', value: 60 },
        'Frostbloom': { gene: 'Recluse', value: 70 },
        'Berries': { gene: 'Nurturer', value: 50 }
    };

    /**
     * Generates a new Genome based on a parent Genome and environmental items.
     * The environment acts as a "second parent" for allele contribution.
     * @param {Genome} parentGenome - The genome of the parent.
     * @param {string[]} [environmentalItems=[]] - List of items present during breeding (e.g., in inventory).
     * @param {SeededRandom} [rng=null] - The seeded RNG instance.
     * @returns {Genome} A new Genome instance for the offspring.
     */
    static breed(parentGenome, environmentalItems = [], rng = null) {
        const random = rng ? () => rng.random() : () => Math.random();
        const range = rng ? (min, max) => rng.range(min, max) : (min, max) => Math.floor(Math.random() * (max - min)) + min;
        const choice = rng ? (arr) => rng.choice(arr) : (arr) => arr[Math.floor(Math.random() * arr.length)];

        const newGenotype = {};
        const parentGenotype = parentGenome.genotype;

        // Pre-process environmental items to map genes to values
        // Strategy: First valid item for a gene wins (preserves original priority)
        const geneTargetMap = {};
        for (const item of environmentalItems) {
            const mapping = GeneticsSystem.ENV_MAP[item];
            if (mapping && geneTargetMap[mapping.gene] === undefined) {
                geneTargetMap[mapping.gene] = mapping.value;
            }
        }

        for (const geneKey in parentGenotype) {
            // --- Step 1: Meiosis (Parental Contribution) ---
            // Randomly select one allele from the parent's pair.
            const parentAlleles = parentGenotype[geneKey];
            let parentAllele = choice(parentAlleles);

            // --- Step 2: Environmental Contribution (The "Second Parent") ---
            // Direct lookup instead of iteration
            let envAllele = geneTargetMap[geneKey] ?? null;

            // If no item targets this gene, provide a random "Wild" allele
            if (envAllele === null) {
                if (geneKey === 'specialAbility') {
                    envAllele = null; // Wild usually doesn't provide special traits
                } else if (geneKey === 'metabolism' || geneKey === 'moodSensitivity') {
                    // Physio: Wild values are typically average/random (1-10)
                    envAllele = range(1, 11);
                } else {
                    // Personality: Wild values are low (10-30) as per new requirement
                    envAllele = range(10, 31);
                }
            }

            // --- Step 3: Mutation ---
            // Mutate Parent Allele
            if (random() < MUTATION_RATE) {
                parentAllele = GeneticsSystem.mutateAllele(geneKey, parentAllele, rng);
            }
            // Mutate Environment Allele
            if (random() < MUTATION_RATE) {
                envAllele = GeneticsSystem.mutateAllele(geneKey, envAllele, rng);
            }

            newGenotype[geneKey] = [parentAllele, envAllele];
        }

        // Return new Genome, passing RNG to ensure consistent phenotype calculation if needed
        return new Genome(newGenotype, null, rng);
    }

    /**
     * Helper to mutate a single allele value.
     * @param {string} geneKey - The name of the gene.
     * @param {*} value - The current value of the allele.
     * @param {SeededRandom} [rng=null] - The seeded RNG instance.
     * @returns {*} The mutated value.
     */
    static mutateAllele(geneKey, value, rng = null) {
        const random = rng ? () => rng.random() : () => Math.random();
        const choice = rng ? (arr) => rng.choice(arr) : (arr) => arr[Math.floor(Math.random() * arr.length)];

        if (geneKey === 'specialAbility') {
            // Chance to flip to a random trait or back to null
            if (value === null) {
                return choice(POSSIBLE_TRAITS);
            } else {
                // Small chance to lose trait? Or switch?
                // Let's say switch or lose.
                return random() < 0.5 ? null : choice(POSSIBLE_TRAITS);
            }
        } else {
            // Numeric mutation
            let mutationAmount = (geneKey === 'metabolism' || geneKey === 'moodSensitivity') ? 1 : 5;
            let newValue = value + (random() < 0.5 ? mutationAmount : -mutationAmount);

            // Clamp values
            const max = (geneKey === 'metabolism' || geneKey === 'moodSensitivity') ? MAX_PHYSIO : MAX_PERSONALITY;
            return Math.max(0, Math.min(max, newValue));
        }
    }

    /**
     * Serializes a Genome into a secure, shareable string.
     * Format: [Base64(JSON(Genotype))].[Checksum]
     * @param {Genome} genome - The genome to export.
     * @returns {Promise<string>} The encoded DNA string.
     */
    static async serialize(genome) {
        if (!genome || !genome.genotype) throw new Error("Invalid Genome for Serialization");

        // 1. Serialize Genotype (Only DNA, no state)
        const jsonStr = JSON.stringify(genome.genotype);

        // 2. Base64 Encode
        const encoded = toBase64(jsonStr);

        // 3. Generate Checksum
        const checksum = await GeneticsSystem._generateChecksum(encoded);

        // 4. Combine
        return `${encoded}.${checksum}`;
    }

    /**
     * Deserializes a DNA string into a Genome object.
     * @param {string} dnaString - The encoded DNA string.
     * @returns {Promise<Genome>} A new Genome instance.
     * @throws {Error} If integrity check fails or format is invalid.
     */
    static async deserialize(dnaString) {
        const parts = dnaString.split('.');
        if (parts.length !== 2) throw new Error("Invalid DNA Format");
        const [encoded, checksum] = parts;

        // 1. Verify Checksum
        const expectedChecksum = await GeneticsSystem._generateChecksum(encoded);
        if (checksum !== expectedChecksum) throw new Error("DNA Integrity Check Failed");

        // 2. Decode
        let jsonStr;
        try {
            jsonStr = fromBase64(encoded);
        } catch (e) {
            throw new Error("Invalid Base64 Encoding");
        }

        // 3. Parse JSON
        let genotype;
        try {
            genotype = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error("Invalid JSON Data");
        }

        // 4. Validate Structure (Basic check)
        const requiredGenes = ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse', 'metabolism', 'moodSensitivity', 'specialAbility'];
        for (const gene of requiredGenes) {
            if (!genotype[gene] || !Array.isArray(genotype[gene])) {
                throw new Error(`Invalid Genotype Structure: Missing ${gene}`);
            }
        }

        // 5. Return new Genome
        // Note: The deserialized genome has NO RNG initially.
        return new Genome(genotype);
    }

    /**
     * Generates a secure SHA-256 checksum for a string.
     * @param {string} str - The input string.
     * @returns {Promise<string>} The checksum as a hex string.
     * @private
     */
    static async _generateChecksum(str) {
        // Use the salt from Config to prevent tampering
        return await CryptoUtils.generateHash(str, Config.SECURITY.DNA_SALT);
    }
}
