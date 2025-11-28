import { GeneticsSystem } from '../js/GeneticsSystem.js';

describe('GeneticsSystem', () => {
    let mockParent;

    beforeEach(() => {
        mockParent = {
            dominantArchetype: 'Adventurer',
            personalityPoints: {
                Adventurer: 10,
                Nurturer: 5,
                Mischievous: 2,
                Intellectual: 1,
                Recluse: 0
            },
            moodSensitivity: 5,
            legacyTraits: ['OldTrait'],
            genome: null // Simulating a first-gen parent without a formal genome object
        };
    });

    test('should inherit dominant archetype with high weight', () => {
        const genome = GeneticsSystem.inherit(mockParent);
        // Expect Adventurer to be highest (5-7 range, others lower)
        expect(genome.personalityGenes['Adventurer']).toBeGreaterThanOrEqual(4); // Allowing for mutation -1
    });

    test('should inherit secondary archetype with medium weight', () => {
        const genome = GeneticsSystem.inherit(mockParent);
        // Nurturer is secondary
        expect(genome.personalityGenes['Nurturer']).toBeGreaterThanOrEqual(1); // Base 2, mutation -1
    });

    test('should apply environmental factors', () => {
        const environmentalFactors = ['logic']; // Ancient Tome -> Intellectual
        const genome = GeneticsSystem.inherit(mockParent, environmentalFactors);

        // Base for Intellectual is 0. +3 from env. +/-1 mutation.
        // Range 2-4.
        expect(genome.personalityGenes['Intellectual']).toBeGreaterThanOrEqual(2);
    });

    test('should handle legacy trait inheritance (probabilistic)', () => {
        // Mock random to ensure inheritance
        const originalRandom = Math.random;
        Math.random = jest.fn()
            .mockReturnValueOnce(0.5) // Dominant variation
            .mockReturnValueOnce(0.5) // Secondary variation
            .mockReturnValueOnce(0.9) // Mutation check (fail)
            .mockReturnValueOnce(0.9) // Mutation check (fail)
            .mockReturnValueOnce(0.9) // Mutation check (fail)
            .mockReturnValueOnce(0.9) // Mutation check (fail)
            .mockReturnValueOnce(0.9) // Mutation check (fail)
            .mockReturnValueOnce(0.9) // Mood sens check (fail)
            .mockReturnValueOnce(0.1) // Trait inheritance check (pass < 0.3)
            .mockReturnValueOnce(0.9); // New random trait check (fail)

        const genome = GeneticsSystem.inherit(mockParent);
        expect(genome.legacyTraits).toContain('OldTrait');

        Math.random = originalRandom;
    });

    test('should not inherit legacy trait if probability fails', () => {
        // Mock random to ensure NO inheritance
        const originalRandom = Math.random;
        Math.random = jest.fn();
        // Skip through the initial random calls for genes/mood
        // We can just make it always return 0.99 for high values
        Math.random.mockReturnValue(0.99);

        const genome = GeneticsSystem.inherit(mockParent);
        expect(genome.legacyTraits).not.toContain('OldTrait');

        Math.random = originalRandom;
    });

    test('should mutate mood sensitivity', () => {
         // Mock random to force mutation
         const originalRandom = Math.random;
         Math.random = jest.fn()
            .mockReturnValueOnce(0.5) // Dominant
            .mockReturnValueOnce(0.5) // Secondary
            .mockReturnValueOnce(0.9) // M
            .mockReturnValueOnce(0.9) // M
            .mockReturnValueOnce(0.9) // M
            .mockReturnValueOnce(0.9) // M
            .mockReturnValueOnce(0.9) // M
            .mockReturnValueOnce(0.1) // Mood sens check (pass < 0.3)
            .mockReturnValueOnce(0.1) // Mood sens direction (< 0.5 => +1)
            .mockReturnValueOnce(0.9) // Trait
            .mockReturnValueOnce(0.9); // New Trait

        const genome = GeneticsSystem.inherit(mockParent);
        // Parent was 5. Expect 6.
        expect(genome.moodSensitivity).toBe(6);

        Math.random = originalRandom;
    });
});
