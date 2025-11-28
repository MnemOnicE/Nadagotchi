// tests/QuestSystem.test.js
import { Nadagotchi } from '../js/Nadagotchi';

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

describe('Quest System - Masterwork Crafting', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Recluse'); // Recluse is good for crafting usually
        // Boost relationship to trigger quest
        pet.relationships['Master Artisan'].level = 5;
    });

    test('should trigger quest at high relationship level', () => {
        pet.interact('Master Artisan');
        // We expect the quest to start
        expect(pet.quests['masterwork_crafting']).toBeDefined();
        expect(pet.quests['masterwork_crafting'].stage).toBe(1);
        expect(pet.journal[pet.journal.length - 1].text).toContain("asked for 5 Sticks");
    });

    test('should progress to stage 2 when giving Sticks', () => {
        // Start quest
        pet.interact('Master Artisan');

        // Give sticks
        pet.inventory['Sticks'] = 5;
        pet.interact('Master Artisan');

        expect(pet.inventory['Sticks']).toBeUndefined(); // Should be consumed (removed if 0)
        expect(pet.quests['masterwork_crafting'].stage).toBe(2);
        expect(pet.discoveredRecipes).toContain("Masterwork Chair");
        expect(pet.journal[pet.journal.length - 1].text).toContain("taught me how to make a Masterwork Chair");
    });

    test('should not progress to stage 2 without Sticks', () => {
        // Start quest
        pet.interact('Master Artisan');

        // No sticks
        pet.inventory['Sticks'] = 0;
        pet.interact('Master Artisan');

        expect(pet.quests['masterwork_crafting'].stage).toBe(1);
        expect(pet.journal[pet.journal.length - 1].text).toContain("waiting for 5 Sticks");
    });

    test('should complete quest when showing Masterwork Chair', () => {
        // Setup stage 2
        pet.quests = { masterwork_crafting: { stage: 2 } };
        pet.discoveredRecipes.push("Masterwork Chair");

        // Give materials
        pet.inventory["Sticks"] = 10;
        pet.inventory["Shiny Stone"] = 2;

        // Legitimate craft
        pet.craftItem("Masterwork Chair");

        pet.interact('Master Artisan');

        expect(pet.quests['masterwork_crafting'].stage).toBe(3);
        expect(pet.inventory["Masterwork Chair"]).toBeUndefined(); // Consumed
        // Check for reward (e.g., skill boost) - assuming we implement some skill boost
        // We might need to check if crafting skill increased more than normal interaction
        expect(pet.journal[pet.journal.length - 1].text).toContain("impressed by my chair");
    });

    test('should save and load quest state', () => {
        pet.quests['masterwork_crafting'] = { stage: 2 };

        // Simulate save/load
        const savedData = JSON.parse(JSON.stringify(pet));
        const loadedPet = new Nadagotchi('Recluse', savedData);

        expect(loadedPet.quests['masterwork_crafting']).toBeDefined();
        expect(loadedPet.quests['masterwork_crafting'].stage).toBe(2);
    });

    test('should provide skill boost after quest completion', () => {
        // Setup completed quest
        pet.quests = { masterwork_crafting: { stage: 3 } };
        pet.skills.crafting = 5;

        pet.interact('Master Artisan');

        // Check for skill increase
        expect(pet.skills.crafting).toBeGreaterThan(5);
        expect(pet.journal[pet.journal.length - 1].text).toContain("advanced crafting theory");
    });
});
