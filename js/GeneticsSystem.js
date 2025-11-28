/**
 * Represents the genetic makeup of a Nadagotchi.
 * Encapsulates personality genes, mood sensitivity, and legacy traits.
 */
export class GeneticsSystem {
    /**
     * @param {Object} personalityGenes - Baseline potential for archetypes.
     * @param {number} moodSensitivity - Value (1-10) determining mood volatility.
     * @param {string[]} legacyTraits - Array of rare unlockable buffs.
     */
    constructor(personalityGenes = {}, moodSensitivity = 5, legacyTraits = []) {
        this.personalityGenes = personalityGenes;
        this.moodSensitivity = moodSensitivity;
        this.legacyTraits = legacyTraits;
    }

    /**
     * Generates a new genome based on a parent Nadagotchi and environmental factors.
     * @param {Nadagotchi} parent - The parent Nadagotchi instance.
     * @param {string[]} environmentalFactors - List of items present during breeding.
     * @returns {GeneticsSystem} A new GeneticsSystem instance for the offspring.
     */
    static inherit(parent, environmentalFactors = []) {
        const newGenes = {};
        const parentArchetypes = parent.personalityPoints || {};

        // 1. Identify Dominant and Secondary Archetypes
        let dominant = parent.dominantArchetype;
        let sortedArchetypes = Object.keys(parentArchetypes).sort((a, b) => parentArchetypes[b] - parentArchetypes[a]);

        // Ensure dominant is first (it should be, but let's be safe if Nadagotchi logic drifted)
        // Actually, Nadagotchi.dominantArchetype is the source of truth.
        // Secondary is the next highest.
        let secondary = sortedArchetypes.find(a => a !== dominant) || dominant;

        // Initialize genes with base 0
        ['Adventurer', 'Nurturer', 'Mischievous', 'Intellectual', 'Recluse'].forEach(type => {
            newGenes[type] = 0;
        });

        // 2. Base Stats: Weighted inheritance
        // Dominant gives high baseline, Secondary gives medium. Others low.
        // We define baseline values.
        // Example: Dominant -> 5-7, Secondary -> 2-4, Others -> 0-1

        newGenes[dominant] = 5 + Math.floor(Math.random() * 3); // 5 to 7
        if (dominant !== secondary) {
            newGenes[secondary] = 2 + Math.floor(Math.random() * 3); // 2 to 4
        }

        // 3. Mutation: Small random variance
        Object.keys(newGenes).forEach(type => {
            if (Math.random() < 0.2) { // 20% chance to mutate each gene
                newGenes[type] += Math.random() < 0.5 ? 1 : -1;
            }
            // Clamp to ensure non-negative (though prompt implies potential)
            if (newGenes[type] < 0) newGenes[type] = 0;
        });

        // 4. Environmental Influence
        if (environmentalFactors.includes('logic')) { // Ancient Tome
            newGenes['Intellectual'] = (newGenes['Intellectual'] || 0) + 3;
        }
        if (environmentalFactors.includes('empathy')) { // Heart Amulet
            newGenes['Nurturer'] = (newGenes['Nurturer'] || 0) + 3;
        }
        if (environmentalFactors.includes('creativity')) { // Muse Flower
            newGenes['Mischievous'] = (newGenes['Mischievous'] || 0) + 2;
            // Note: Hobbies might be handled separately in Nadagotchi initialization,
            // but the prompt says "boost the corresponding gene".
        }

        // 5. Mood Sensitivity
        // Inherit from parent (or genome if it exists) with mutation
        let parentSensitivity = parent.moodSensitivity || (parent.genome ? parent.genome.moodSensitivity : 5);
        let newSensitivity = parentSensitivity;
        if (Math.random() < 0.3) {
            newSensitivity += Math.random() < 0.5 ? 1 : -1;
        }
        // Clamp 1-10
        newSensitivity = Math.max(1, Math.min(10, newSensitivity));

        // 6. Legacy Traits
        // Probabilistic inheritance
        const newTraits = [];
        const parentTraits = parent.legacyTraits || []; // Nadagotchi has flat legacyTraits currently

        parentTraits.forEach(trait => {
            if (Math.random() < 0.3) { // 30% chance
                newTraits.push(trait);
            }
        });

        // Chance for new trait based on mutation or environment?
        // Prompt says: "Legacy Traits: An array of rare, unlockable buffs... that have a low chance of being passed down."
        // BreedingScene currently adds random new traits.
        // "If specific items ... boost corresponding gene ... Traits: Calculate probabilistic inheritance"

        // I will keep the logic from BreedingScene regarding *new* traits being added randomly?
        // BreedingScene had: `if (Math.random() < 0.05) newPetData.legacyTraits.push(...)`
        // I should probably include this logic here too.
        if (Math.random() < 0.05) {
            const possibleTraits = ["Quick Learner", "Resilient Spirit", "Charming"];
            const randomTrait = possibleTraits[Math.floor(Math.random() * possibleTraits.length)];
            if (!newTraits.includes(randomTrait)) {
                newTraits.push(randomTrait);
            }
        }

        return new GeneticsSystem(newGenes, newSensitivity, newTraits);
    }
}
