// tests/Nadagotchi.test.js
import { Nadagotchi } from '../js/Nadagotchi';
import { PersistenceManager } from '../js/PersistenceManager';

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Mock Phaser since it's not available in the Node.js test environment
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Nadagotchi', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Force a deterministic genome to avoid random homozygous bonuses in general tests
        pet.genome.genotype = {
            Adventurer: [10, 20],
            Nurturer: [10, 20],
            Mischievous: [10, 20], // Definitely not homozygous
            Intellectual: [40, 40], // Expected for 'Intellectual' starter
            Recluse: [10, 20],
            metabolism: [5, 5],
            moodSensitivity: [5, 5],
            specialAbility: [null, null]
        };
        pet.genome.phenotype = pet.genome.calculatePhenotype();
    });

    describe('constructor', () => {
        test('should initialize from loadedData', () => {
            const loadedData = {
                mood: 'happy',
                dominantArchetype: 'Nurturer',
                personalityPoints: { Adventurer: 5, Nurturer: 15, Mischievous: 2, Intellectual: 8, Recluse: 1 },
                stats: { hunger: 80, energy: 85, happiness: 90 },
                skills: { communication: 5, resilience: 3, navigation: 1, empathy: 7, logic: 4, focus: 2, crafting: 1 },
                currentCareer: 'Healer',
                inventory: ['Berries'],
                age: 10,
                generation: 2,
                isLegacyReady: false,
                legacyTraits: ['Charisma'],
                moodSensitivity: 7,
                hobbies: { painting: 10, music: 5 },
                relationships: { 'Grizzled Scout': { level: 10 } },
                location: 'Home'
            };
            const loadedPet = new Nadagotchi('Adventurer', loadedData);

            expect(loadedPet.mood).toBe('happy');
            expect(loadedPet.dominantArchetype).toBe('Nurturer');
            expect(loadedPet.stats.hunger).toBe(80);
            expect(loadedPet.skills.empathy).toBe(7);
            expect(loadedPet.currentCareer).toBe('Healer');
            expect(loadedPet.inventory).toContain('Berries');
            expect(loadedPet.age).toBe(10);
            expect(loadedPet.generation).toBe(2);
            expect(loadedPet.hobbies.painting).toBe(10);
            expect(loadedPet.relationships['Grizzled Scout'].level).toBe(10);
        });
    });

    describe('live', () => {
        test('should decrease hunger and energy over time', () => {
            const initialHunger = pet.stats.hunger;
            const initialEnergy = pet.stats.energy;
            pet.live();
            expect(pet.stats.hunger).toBeLessThan(initialHunger);
            expect(pet.stats.energy).toBeLessThan(initialEnergy);
        });

        test('should change mood based on stats', () => {
            pet.stats.hunger = 20;
            pet.live();
            expect(pet.mood).toBe('sad');

            pet.stats.hunger = 5;
            pet.live();
            expect(pet.mood).toBe('angry');

            pet.stats.hunger = 90;
            pet.stats.energy = 90;
            pet.live();
            expect(pet.mood).toBe('happy');
        });

        test('should not allow happiness to fall below 0', () => {
            const adventurerPet = new Nadagotchi('Adventurer');
            adventurerPet.stats.happiness = 0.02; // Set happiness low enough to go negative
            adventurerPet.live({ weather: "Stormy", time: "Night", activeEvent: null }); // Stormy weather reduces happiness by 0.03 for Adventurer
            expect(adventurerPet.stats.happiness).toBe(0);
        });
    });

    describe('updateDominantArchetype', () => {
        test('should update the dominant archetype to the one with the most points', () => {
            pet.personalityPoints.Nurturer = 15;
            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Nurturer');
        });

        test('should not change dominant archetype when it is part of a tie', () => {
            // Intellectual starts at 10 points.
            expect(pet.dominantArchetype).toBe('Intellectual');

            // Set Nurturer to the same score.
            pet.personalityPoints.Nurturer = 10;

            // Ensure skills are equal or favor incumbent to test incumbent advantage
            pet.skills.empathy = 0;
            pet.skills.logic = 0;
            pet.skills.research = 0;

            pet.updateDominantArchetype();

            // The dominant archetype should remain 'Intellectual' because it was the incumbent in the tie.
            expect(pet.dominantArchetype).toBe('Intellectual');
        });

        test('should switch dominant archetype in a tie if challenger has higher skills', () => {
            // Intellectual starts at 10 points.
            pet.dominantArchetype = 'Intellectual';
            pet.personalityPoints.Intellectual = 10;

            // Set Nurturer to the same score.
            pet.personalityPoints.Nurturer = 10;

            // Give Nurturer higher relevant skills (Empathy)
            pet.skills.empathy = 20;
            pet.skills.logic = 0;
            pet.skills.research = 0;

            pet.updateDominantArchetype();

            // The dominant archetype should switch to 'Nurturer' because it has higher skills
            expect(pet.dominantArchetype).toBe('Nurturer');
        });

        test('should switch to the first archetype in a tie when the incumbent is not involved', () => {
            // Intellectual starts at 10 points. Drop its score so it's not in the running.
            pet.personalityPoints.Intellectual = 5;

            // Nurturer and Recluse tie for the highest score.
            pet.personalityPoints.Nurturer = 15;
            pet.personalityPoints.Recluse = 15;

            pet.updateDominantArchetype();

            // With randomized tie-breaking, any of the tied candidates can be chosen.
            expect(['Nurturer', 'Recluse']).toContain(pet.dominantArchetype);
        });

        test('should correctly handle a three-way tie for dominant archetype', () => {
            pet.personalityPoints.Intellectual = 5; // Demote the current dominant
            pet.personalityPoints.Adventurer = 20;
            pet.personalityPoints.Nurturer = 20;
            pet.personalityPoints.Mischievous = 20;

            // Equalize skills to test deterministic fallback
            pet.skills.communication = 0;
            // Adventurer (Nav: 0), Nurturer (Emp: 0), Mischievous (Comm: 0)

            pet.updateDominantArchetype();

            // With randomized tie-breaking, any of the three can be chosen.
            expect(['Adventurer', 'Nurturer', 'Mischievous']).toContain(pet.dominantArchetype);
        });
    });

    describe('handleAction', () => {
        test('FEED should increase hunger and happiness', () => {
            pet.stats.hunger = 50;
            pet.stats.happiness = 50;
            pet.handleAction('FEED');
            expect(pet.stats.hunger).toBe(65);
            expect(pet.stats.happiness).toBe(55);
        });

        test('FEED should not increase hunger or happiness beyond 100', () => {
            pet.stats.hunger = 95;
            pet.stats.happiness = 98;
            pet.handleAction('FEED');
            expect(pet.stats.hunger).toBe(100);
            expect(pet.stats.happiness).toBe(100);
        });

        test('PLAY should decrease energy and increase happiness', () => {
            pet.stats.energy = 50;
            pet.stats.happiness = 50;
            pet.handleAction('PLAY');
            expect(pet.stats.energy).toBe(40);
            expect(pet.stats.happiness).toBe(60);
        });

        test('PLAY should have unique effects for different archetypes', () => {
            const reclusePet = new Nadagotchi('Recluse');
            reclusePet.stats.happiness = 50;
            reclusePet.handleAction('PLAY');
            expect(reclusePet.mood).toBe('sad');
            expect(reclusePet.stats.happiness).toBe(45);

            const adventurerPet = new Nadagotchi('Adventurer');
            adventurerPet.handleAction('PLAY');
            expect(adventurerPet.mood).toBe('happy');
        });

        test('STUDY should affect stats and increase logic skill', () => {
            pet.stats.energy = 50;
            pet.stats.happiness = 50;
            pet.skills.logic = 1;
            pet.handleAction('STUDY');
            expect(pet.stats.energy).toBe(45);
            // 50 - 5 (cost) + 15 (Intellectual) + 5 (Homozygous Bonus) = 65
            expect(pet.stats.happiness).toBe(65);
            expect(pet.skills.logic).toBeGreaterThan(1);
        });

        test('EXPLORE should decrease energy and have varied effects by archetype', () => {
            const adventurerPet = new Nadagotchi('Adventurer');
            adventurerPet.stats.happiness = 50;
            adventurerPet.handleAction('EXPLORE');
            expect(adventurerPet.mood).toBe('happy');
            // 50 + 20 (Adventurer) + 10 (Homozygous Bonus) = 80
            expect(adventurerPet.stats.happiness).toBe(80);

            const reclusePet = new Nadagotchi('Recluse');
            // Force Adventurer genes to be heterozygous to avoid random bonus
            reclusePet.genome.genotype.Adventurer = [5, 10];
            reclusePet.genome.phenotype = reclusePet.genome.calculatePhenotype();

            reclusePet.stats.happiness = 50;
            reclusePet.handleAction('EXPLORE');
            expect(reclusePet.mood).toBe('sad');
            expect(reclusePet.stats.happiness).toBe(30);
        });

        test('should ignore case for action types', () => {
            pet.stats.hunger = 50;
            pet.handleAction('feed');
            expect(pet.stats.hunger).toBe(65);
        });
    });

    describe('updateCareer', () => {
        test('should assign a career when skill and archetype requirements are met', () => {
            pet.dominantArchetype = 'Intellectual';
            pet.skills.logic = 11;
            pet.updateCareer();
            expect(pet.currentCareer).toBe('Innovator');
        });

        test('should not assign a career if requirements are not met', () => {
            pet.dominantArchetype = 'Intellectual';
            pet.skills.logic = 5;
            pet.updateCareer();
            expect(pet.currentCareer).toBeNull();
        });

        test('should not change career once one is assigned', () => {
            pet.currentCareer = 'Scout';
            pet.dominantArchetype = 'Intellectual';
            pet.skills.logic = 11;
            pet.updateCareer();
            expect(pet.currentCareer).toBe('Scout');
        });
    });

    describe('New Subsystems', () => {
        test('practiceHobby should increase hobby level and affect stats', () => {
            pet.hobbies.painting = 5;
            pet.stats.happiness = 50;
            pet.stats.energy = 50;
            pet.practiceHobby('painting');
            expect(pet.hobbies.painting).toBe(6);
            expect(pet.stats.happiness).toBe(55);
            expect(pet.stats.energy).toBe(45);
        });

        test('forage should add an item to inventory and affect stats and skills', () => {
            const initialInventoryCount = Object.keys(pet.inventory).length;
            pet.stats.energy = 50;
            pet.skills.navigation = 1;
            pet.forage();
            expect(Object.keys(pet.inventory).length).toBe(initialInventoryCount + 1);
            expect(pet.stats.energy).toBe(40);
            expect(pet.skills.navigation).toBeGreaterThan(1);
        });

        test('interact should improve relationships and specific skills based on the NPC', () => {
            pet.relationships['Grizzled Scout'].level = 5;
            pet.skills.navigation = 1;
            pet.interact('Grizzled Scout');
            expect(pet.relationships['Grizzled Scout'].level).toBe(6);
            expect(pet.skills.navigation).toBeGreaterThan(1);
        });

        test('interact with GIFT should use an inventory item and have a greater effect', () => {
            pet.inventory['Berries'] = 1;
            pet.relationships.friend = { level: 5 };
            pet.skills.empathy = 1;
            pet.interact('friend', 'GIFT');
            expect(pet.inventory['Berries']).toBeUndefined();
            expect(pet.relationships.friend.level).toBe(10);
            expect(pet.skills.empathy).toBeGreaterThan(1);
            pet.relationships['Master Artisan'].level = 3;
            pet.skills.crafting = 1;
            pet.interact('Master Artisan');
            expect(pet.relationships['Master Artisan'].level).toBe(4);
            expect(pet.skills.crafting).toBeGreaterThan(1);
        });

        test('craftItem should consume materials and add the new item to inventory', () => {
            pet.inventory = { 'Sticks': 10, 'Shiny Stone': 2 };
            pet.craftItem('Fancy Bookshelf');
            expect(pet.inventory['Sticks']).toBe(5);
            expect(pet.inventory['Shiny Stone']).toBe(1);
            expect(pet.inventory['Fancy Bookshelf']).toBe(1);
        });

        test('craftItem should not work if materials are insufficient', () => {
            pet.inventory = { 'Sticks': 4, 'Shiny Stone': 1 };
            pet.craftItem('Fancy Bookshelf');
            expect(pet.inventory['Fancy Bookshelf']).toBeUndefined();
        });

        test('INTERACT_FANCY_BOOKSHELF should provide a better study buff', () => {
            pet.skills.logic = 1;
            pet.handleAction('INTERACT_FANCY_BOOKSHELF');
            expect(pet.skills.logic).toBeGreaterThan(1.2);
        });
    });
});
