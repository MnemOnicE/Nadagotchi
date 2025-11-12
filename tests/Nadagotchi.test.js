// tests/Nadagotchi.test.js
const fs = require('fs');
const path = require('path');

// Mock localStorage and PersistenceManager
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

const persistenceManagerCode = fs.readFileSync(path.resolve(__dirname, '../js/PersistenceManager.js'), 'utf8');
const PersistenceManager = eval(persistenceManagerCode + '; PersistenceManager');
global.PersistenceManager = PersistenceManager;

// Load the class from the source file and append module.exports
const nadagotchiCode = fs.readFileSync(path.resolve(__dirname, '../js/Nadagotchi.js'), 'utf8');
const Nadagotchi = eval(nadagotchiCode + '; module.exports = Nadagotchi;');

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
                relationships: { friend: { level: 10 } },
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
            expect(loadedPet.relationships.friend.level).toBe(10);
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
    });

    describe('updateDominantArchetype', () => {
        test('should update the dominant archetype to the one with the most points', () => {
            pet.personalityPoints.Nurturer = 15;
            pet.updateDominantArchetype();
            expect(pet.dominantArchetype).toBe('Nurturer');
        });

        test('should not change dominant archetype in case of a tie', () => {
            // Intellectual starts at 10 points.
            // Set Recluse to the same score. Since Recluse is iterated after Intellectual,
            // the bug will cause the dominant archetype to incorrectly switch.
            pet.personalityPoints.Recluse = 10;
            pet.updateDominantArchetype();
            // The dominant archetype should remain Intellectual.
            expect(pet.dominantArchetype).toBe('Intellectual');
        });

        test('should not change dominant archetype to one that appears earlier in case of a tie', () => {
            // Intellectual starts at 10 points.
            // Set Adventurer (which comes before Intellectual in object definition) to the same score.
            pet.personalityPoints.Adventurer = 10;
            pet.updateDominantArchetype();
            // The correct behavior is for the archetype to remain 'Intellectual' as there is no
            // archetype with a strictly greater score.
            expect(pet.dominantArchetype).toBe('Intellectual');
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
            expect(pet.stats.happiness).toBe(60);
            expect(pet.skills.logic).toBeGreaterThan(1);
        });

        test('EXPLORE should decrease energy and have varied effects by archetype', () => {
            const adventurerPet = new Nadagotchi('Adventurer');
            adventurerPet.stats.happiness = 50;
            adventurerPet.handleAction('EXPLORE');
            expect(adventurerPet.mood).toBe('happy');
            expect(adventurerPet.stats.happiness).toBe(70);

            const reclusePet = new Nadagotchi('Recluse');
            reclusePet.stats.happiness = 50;
            reclusePet.handleAction('EXPLORE');
            expect(reclusePet.mood).toBe('sad');
            expect(reclusePet.stats.happiness).toBe(30);
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
            const initialInventoryLength = pet.inventory.length;
            pet.stats.energy = 50;
            pet.skills.navigation = 1;
            pet.forage();
            expect(pet.inventory.length).toBe(initialInventoryLength + 1);
            expect(pet.stats.energy).toBe(40);
            expect(pet.skills.navigation).toBeGreaterThan(1);
        });

        test('interact should improve relationships and skills', () => {
            pet.relationships.friend.level = 5;
            pet.skills.communication = 1;
            pet.interact('friend', 'CHAT');
            expect(pet.relationships.friend.level).toBe(6);
            expect(pet.skills.communication).toBeGreaterThan(1);
        });

        test('interact with GIFT should use an inventory item and have a greater effect', () => {
            pet.inventory.push('Berries');
            pet.relationships.friend.level = 5;
            pet.skills.empathy = 1;
            pet.interact('friend', 'GIFT');
            expect(pet.inventory).not.toContain('Berries');
            expect(pet.relationships.friend.level).toBe(10);
            expect(pet.skills.empathy).toBeGreaterThan(1);
        });
    });
});
