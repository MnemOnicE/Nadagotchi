
const { Nadagotchi } = require('../js/Nadagotchi.js');
const { Config } = require('../js/Config.js');

// Mock Phaser if needed (Nadagotchi mostly doesn't need it, but sometimes does)
global.Phaser = {
    Math: {
        RND: {
            pick: (arr) => arr[0]
        }
    }
};

describe('Security Fix: Inventory Check in Breeding', () => {
    let parent;

    beforeEach(() => {
        parent = new Nadagotchi('Adventurer');
        // Ensure inventory is empty
        parent.inventory = {};
    });

    test('calculateOffspring should ignore items not in inventory', () => {
        // 'Ancient Tome' provides 70 Intellectual
        // We do NOT have it in inventory.
        const environmentalFactors = ['Ancient Tome'];

        const childData = parent.calculateOffspring(environmentalFactors);

        // Inspect child's genome for Intellectual trait
        const intellectualAlleles = childData.genome.genotype.Intellectual;

        // One allele comes from parent (starter value ~15 or 80 if dominant, but Adventurer is dominant here so Intellectual is low ~10-30)
        // The other comes from environment.
        // If 'Ancient Tome' was accepted, one allele should be close to 70 (allowing for small mutation).
        // If rejected, it should be a wild value (10-30).

        const hasHighValue = intellectualAlleles.some(val => val > 50);

        // This expectation is what we WANT after the fix.
        // Before the fix, this might fail (it will have high value).
        // I will assert what currently happens to confirm vulnerability first?
        // No, I should write the test that expects the CORRECT behavior, and verify it fails.

        expect(hasHighValue).toBe(false);
    });

    test('calculateOffspring should accept items that ARE in inventory', () => {
        // Give the item
        parent.inventory['Ancient Tome'] = 1;

        const environmentalFactors = ['Ancient Tome'];
        const childData = parent.calculateOffspring(environmentalFactors);

        const intellectualAlleles = childData.genome.genotype.Intellectual;

        // Should have a high value (~70)
        const hasHighValue = intellectualAlleles.some(val => val > 50);

        expect(hasHighValue).toBe(true);
    });
});
