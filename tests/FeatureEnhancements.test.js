
import { Nadagotchi } from '../js/Nadagotchi';
import { GeneticsSystem, Genome } from '../js/GeneticsSystem';

// Mock localStorage
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

describe('Feature Enhancements', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Ensure genome exists (should be created by constructor)
        if (!pet.genome) pet.genome = new Genome();
    });

    describe('Homozygous Personality Bonuses', () => {
        test('isHomozygousIntellectual grants bonus happiness on STUDY', () => {
            pet.genome.phenotype.isHomozygousIntellectual = true;
            pet.stats.happiness = 50;

            // Standard study: -5 happiness, +15 if Intellectual = net +10.
            // With bonus: should be +15.
            // Let's check the code:
            // STUDY: happiness -5.
            // Bonus: happiness +5. (Net 0 change so far)
            // If Intellectual: happiness +15. (Net +15)
            // Total expected: 50 + 15 = 65.

            pet.handleAction('STUDY');
            expect(pet.stats.happiness).toBe(65);
        });

        test('isHomozygousAdventurer grants bonus happiness on EXPLORE', () => {
            pet = new Nadagotchi('Adventurer');
            pet.genome.phenotype.isHomozygousAdventurer = true;
            pet.stats.happiness = 50;

            // EXPLORE: Adventurer gets +20 happiness.
            // Bonus: +10 happiness.
            // Total: 50 + 20 + 10 = 80.

            pet.handleAction('EXPLORE');
            expect(pet.stats.happiness).toBe(80);
        });

        test('isHomozygousNurturer grants bonus empathy on INTERACT_PLANT', () => {
            pet = new Nadagotchi('Nurturer');
            pet.genome.phenotype.isHomozygousNurturer = true;
            const initialEmpathy = pet.skills.empathy;

            // INTERACT_PLANT: +0.15 * moodMultiplier (1.5 for Nurturer -> Happy) = 0.225
            // Bonus: +0.2
            // Total increase: 0.425

            pet.handleAction('INTERACT_PLANT');
            expect(pet.skills.empathy).toBeCloseTo(initialEmpathy + 0.425);
        });

        test('isHomozygousMischievous grants energy refund on PLAY', () => {
            pet = new Nadagotchi('Mischievous');
            pet.genome.phenotype.isHomozygousMischievous = true;
            pet.stats.energy = 50;

            // PLAY: Energy -10.
            // Bonus: Energy = min(max, energy + 5).
            // Net energy change: -10 + 5 = -5.
            // Expected: 45.

            pet.handleAction('PLAY');
            expect(pet.stats.energy).toBe(45);
        });

        test('isHomozygousRecluse grants bonus focus on MEDITATE', () => {
            pet = new Nadagotchi('Recluse');
            pet.genome.phenotype.isHomozygousRecluse = true;
            const initialFocus = pet.skills.focus;

            // MEDITATE: +0.1 * moodMultiplier (1.0 default/sad? Recluse might be neutral unless specific conditions).
            // Recluse doesn't get auto-mood from Meditate unless coded.
            // Checking Meditate code: moodMultiplier used. Recluse gains +2 Recluse points.
            // Assume mood is neutral (1.0).
            // Base gain: 0.1.
            // Bonus: +0.2.
            // Total: 0.3.

            pet.handleAction('MEDITATE');
            expect(pet.skills.focus).toBeCloseTo(initialFocus + 0.3);
        });
    });

    describe('Environmental Influence Expansion', () => {
        test('Expanded envMap includes crafted items and resources', () => {
            // We can test this by calling breed with new items
            const parentGenome = new Genome();
            const environmentalItems = ['Fancy Bookshelf', 'Shiny Stone'];

            // Fancy Bookshelf -> Intellectual (75)
            // Shiny Stone -> Mischievous (60)

            // We need to run breed multiple times or spy on random to ensure we pick the env allele?
            // Or inspect internal envMap? We can't access private variables easily, but we can infer from results if we mock Math.random to always pick env allele.

            // Mock Math.random to always favor environment?
            // breed logic:
            // 1. Parent Allele (random)
            // 2. Env Allele (from map)
            // 3. Mutation (random)
            // 4. Result = [Parent, Env]

            // If we inspect the resulting genotype, one allele should be the env value.

            const childGenome = GeneticsSystem.breed(parentGenome, environmentalItems);

            // Check Intellectual gene. Should contain 75 (Fancy Bookshelf).
            const intellectualAlleles = childGenome.genotype.Intellectual;
            expect(intellectualAlleles).toContain(75); // Assuming no mutation changed it immediately (5% chance).

            // Check Mischievous gene. Should contain 60 (Shiny Stone).
            const mischievousAlleles = childGenome.genotype.Mischievous;
            expect(mischievousAlleles).toContain(60);
        });

         test('Breed with Logic-Boosting Snack', () => {
            const parentGenome = new Genome();
            const childGenome = GeneticsSystem.breed(parentGenome, ['Logic-Boosting Snack']);
            // Logic-Boosting Snack -> Intellectual 60
            expect(childGenome.genotype.Intellectual).toContain(60);
        });

        test('Breed with Stamina-Up Tea', () => {
            const parentGenome = new Genome();
            const childGenome = GeneticsSystem.breed(parentGenome, ['Stamina-Up Tea']);
            // Stamina-Up Tea -> Adventurer 65
            expect(childGenome.genotype.Adventurer).toContain(65);
        });
    });

    describe('Skill-Based Tie-Breaking', () => {
        test('Breaks tie between Intellectual and Adventurer using Skills', () => {
            // Setup tie
            pet.personalityPoints = {
                Adventurer: 20,
                Intellectual: 20,
                Nurturer: 10,
                Mischievous: 10,
                Recluse: 10
            };

            // Intellectual Skills: Logic + Research
            pet.skills.logic = 10;
            pet.skills.research = 10;
            // Total Intellectual Score = 20

            // Adventurer Skills: Navigation
            pet.skills.navigation = 5;
            // Total Adventurer Score = 5

            // Reset dominant to something else so it has to pick
            pet.dominantArchetype = 'Recluse';

            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Intellectual');

            // Now boost Adventurer skills
            pet.skills.navigation = 30;
            // Adventurer Score = 30 > 20

            // Reset dominant again to force update
            pet.dominantArchetype = 'Recluse';

            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Adventurer');
        });

        test('Breaks tie using Nurturer skill (Empathy)', () => {
            pet.personalityPoints = {
                Adventurer: 20,
                Nurturer: 20,
                Intellectual: 10, M: 10, R: 10
            };

            pet.skills.navigation = 5; // Adventurer Score
            pet.skills.empathy = 10;   // Nurturer Score

            pet.dominantArchetype = 'Recluse';
            pet.updateDominantArchetype();

            expect(pet.dominantArchetype).toBe('Nurturer');
        });

        test('Breaks tie using Recluse skills (Focus + Crafting)', () => {
             pet.personalityPoints = {
                Recluse: 20,
                Nurturer: 20,
                I:10, A:10, M:10
            };

            pet.skills.empathy = 5;
            pet.skills.focus = 5;
            pet.skills.crafting = 5; // Recluse Score = 10

            pet.dominantArchetype = 'Adventurer';
            pet.updateDominantArchetype();

            expect(pet.dominantArchetype).toBe('Recluse');
        });

        test('Incumbent wins tie even with lower skills', () => {
            // Verify existing logic still holds: Incumbent preference overrides skill check
            pet.personalityPoints = {
                Adventurer: 20,
                Intellectual: 20,
                N:10, M:10, R:10
            };

            pet.skills.logic = 5; // Intellectual Score
            pet.skills.navigation = 10; // Adventurer Score (Higher)

            pet.dominantArchetype = 'Intellectual'; // Incumbent

            pet.updateDominantArchetype();
            // Should stay Intellectual because it is one of the max scorers
            expect(pet.dominantArchetype).toBe('Intellectual');
        });
    });
});
