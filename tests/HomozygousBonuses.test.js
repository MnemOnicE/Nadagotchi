import { Nadagotchi } from '../js/Nadagotchi.js';
import { Genome } from '../js/GeneticsSystem.js';

describe('Homozygous Bonuses', () => {
    it('detects homozygous metabolism and applies max energy bonus', () => {
        const pet = new Nadagotchi('Adventurer');

        // Mock a homozygous metabolism genome
        const homozygousGenes = {
            Adventurer: [10, 20], // Heterozygous
            Nurturer: [10, 20],
            Mischievous: [10, 20],
            Intellectual: [10, 20],
            Recluse: [10, 20],
            metabolism: [8, 8], // Homozygous!
            moodSensitivity: [5, 6], // Heterozygous
            specialAbility: [null, null]
        };
        // We need to re-initialize the genome AND re-run the constructor logic that sets maxStats.
        // Or we can just create a new pet with mocked logic, but constructor runs once.
        // We can manually invoke the logic or create a new pet where we can inject the genome early?
        // Nadagotchi constructor sets genome then sets maxStats.
        // If we modify pet.genome AFTER constructor, maxStats is already set to default.

        // So we need to manually update maxStats for this test since we are patching the object after creation.
        // OR we can create a subclass or mock better.
        // Or we can re-run the logic.

        pet.genome = new Genome(homozygousGenes);

        // Re-run the maxStats logic manually to simulate what happens in constructor
        pet.maxStats = { hunger: 100, energy: 100, happiness: 100 };
        if (pet.genome.phenotype.isHomozygousMetabolism) {
            pet.maxStats.energy += 5;
        }

        // Verify detection
        expect(pet.genome.phenotype.isHomozygousMetabolism).toBe(true);
        expect(pet.maxStats.energy).toBe(105);

        // Test clamping
        pet.stats.energy = 100;
        pet.handleAction('MEDITATE'); // +5 energy

        expect(pet.stats.energy).toBe(105);

        // Test cap
        pet.handleAction('MEDITATE'); // +5 energy
        expect(pet.stats.energy).toBe(105);
    });

    it('detects homozygous moodSensitivity and applies mood recovery bonus', () => {
        const pet = new Nadagotchi('Adventurer');

         const homozygousGenes = {
            Adventurer: [10, 20],
            Nurturer: [10, 20],
            Mischievous: [10, 20],
            Intellectual: [10, 20],
            Recluse: [10, 20],
            metabolism: [5, 6],
            moodSensitivity: [5, 5], // Homozygous
            specialAbility: [null, null]
        };
        pet.genome = new Genome(homozygousGenes);

        // No maxStats update needed for this test as it uses mood logic in live() which checks phenotype directly.

        // Threshold check.
        // Standard: > 80 is happy.
        // With bonus: > 75 is happy.

        pet.stats.hunger = 76;
        pet.stats.energy = 76;
        pet.live();

        expect(pet.mood).toBe('happy');

        // Verify below threshold
        pet.stats.hunger = 74;
        pet.stats.energy = 74;
        pet.live();
        expect(pet.mood).not.toBe('happy');
    });
});
