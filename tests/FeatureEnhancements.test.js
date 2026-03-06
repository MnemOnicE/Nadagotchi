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

    beforeEach(async () => {
        pet = new Nadagotchi('Intellectual');
        await pet.init();

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

        test('isHomozygousAdventurer grants bonus happiness on EXPLORE', async () => {
            pet = new Nadagotchi('Adventurer');
            await pet.init();

            pet.genome.phenotype.isHomozygousAdventurer = true;
            pet.stats.happiness = 50;

            // EXPLORE: Adventurer gets +20 happiness.
            // Bonus: +10 happiness.
            // Total: 50 + 20 + 10 = 80.

            pet.handleAction('EXPLORE');
            expect(pet.stats.happiness).toBe(80);
        });

        test('isHomozygousNurturer grants bonus empathy on INTERACT_PLANT', async () => {
            pet = new Nadagotchi('Nurturer');
            await pet.init();

            pet.genome.phenotype.isHomozygousNurturer = true;
            const initialEmpathy = pet.skills.empathy;

            // INTERACT_PLANT: +0.15 * moodMultiplier (1.5 for Nurturer -> Happy) = 0.225
            // Bonus: +0.2
            // Total increase: 0.425

            pet.handleAction('INTERACT_PLANT');
            expect(pet.skills.empathy).toBeCloseTo(initialEmpathy + 0.425);
        });

        test('isHomozygousMischievous grants energy refund on PLAY', async () => {
            pet = new Nadagotchi('Mischievous');
            await pet.init();

            pet.genome.phenotype.isHomozygousMischievous = true;
            pet.stats.energy = 50;

            // PLAY: Energy -10.
            // Bonus: Energy = min(max, energy + 5).
            // Net energy change: -10 + 5 = -5.
            // Expected: 45.

            pet.handleAction('PLAY');
            expect(pet.stats.energy).toBe(45);
        });

        test('isHomozygousRecluse grants bonus focus on MEDITATE', async () => {
            pet = new Nadagotchi('Recluse');
            await pet.init();

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
        // Deterministic RNG Mock to prevent mutation during testing
        const mockRNG = {
            random: () => 0.5, // Always > 0.05 to prevent mutation
            range: (min, max) => min,
            choice: (arr) => arr[0]
        };

        test('Expanded envMap includes crafted items and resources', () => {
            const parentGenome = new Genome(null, null, mockRNG);
            const environmentalItems = ['Fancy Bookshelf', 'Shiny Stone'];

            // Pass mockRNG to breed to suppress mutation
            const childGenome = GeneticsSystem.breed(parentGenome, environmentalItems, mockRNG);

            // Check Intellectual gene. Should contain 75 (Fancy Bookshelf).
            const intellectualAlleles = childGenome.genotype.Intellectual;
            expect(intellectualAlleles).toContain(75);

            // Check Mischievous gene. Should contain 60 (Shiny Stone).
            const mischievousAlleles = childGenome.genotype.Mischievous;
            expect(mischievousAlleles).toContain(60);
        });

         test('Breed with Logic-Boosting Snack', () => {
            const parentGenome = new Genome(null, null, mockRNG);
            const childGenome = GeneticsSystem.breed(parentGenome, ['Logic-Boosting Snack'], mockRNG);
            // Logic-Boosting Snack -> Intellectual 60
            expect(childGenome.genotype.Intellectual).toContain(60);
        });

        test('Breed with Stamina-Up Tea', () => {
            const parentGenome = new Genome(null, null, mockRNG);
            const childGenome = GeneticsSystem.breed(parentGenome, ['Stamina-Up Tea'], mockRNG);
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

        test('Incumbent wins tie unless challenger has strictly higher skills', () => {
            // Verify tie breaking logic
            pet.personalityPoints = {
                Adventurer: 20,
                Intellectual: 20,
                Nurturer: 10, Mischievous: 10, Recluse: 10
            };

            // Scenario 1: Challenger (Adventurer) has strictly higher skills -> Challenger Wins
            pet.skills.logic = 5; // Intellectual Score
            pet.skills.navigation = 10; // Adventurer Score (Higher)
            pet.dominantArchetype = 'Intellectual'; // Incumbent

            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Adventurer');

            // Scenario 2: Challenger has equal skills -> Incumbent Wins
            pet.skills.logic = 10;
            pet.skills.navigation = 10;
            pet.dominantArchetype = 'Intellectual';

            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Intellectual');
        });
    });
});
