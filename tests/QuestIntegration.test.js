import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi.js';

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
global.Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};

describe('Quest Integration', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Ensure deterministic RNG for testing
        pet.rng = { random: () => 0.5, choice: (arr) => arr[0], range: () => 0 };
    });

    test('Masterwork Crafting Quest Flow', () => {
        // Setup Relationship
        pet.relationships['Master Artisan'] = { level: 5 };

        // 1. Start Quest
        let result = pet.interact('Master Artisan');
        // Expect Option to Accept
        const acceptOption = result.options.find(o => o.label === "Accept Quest");
        expect(acceptOption).toBeDefined();
        // Execute
        acceptOption.action();

        expect(pet.questSystem.getQuest('masterwork_crafting')).toBeDefined();
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(1);

        // 2. Try to advance without Sticks
        result = pet.interact('Master Artisan');
        // Should show status text but NO "Complete Stage" option
        expect(result.text).toContain("waiting for 5 Sticks");
        expect(result.options.find(o => o.label === "Complete Stage")).toBeUndefined();
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(1);

        // 3. Get Sticks
        pet.inventory['Sticks'] = 5;

        // 4. Interact to Advance
        result = pet.interact('Master Artisan');
        expect(result.text).toContain("(Requirements Met!)");
        const completeStage1 = result.options.find(o => o.label === "Complete Stage");
        expect(completeStage1).toBeDefined();

        completeStage1.action();

        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(2);
        expect(pet.inventory['Sticks']).toBeUndefined(); // Consumed
        expect(pet.discoveredRecipes).toContain("Masterwork Chair");

        // Verify Journal Update for Stage 2
        let journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("I gave the Sticks"))).toBe(true);

        // 5. Try to advance without Chair
        result = pet.interact('Master Artisan');
        expect(result.text).toContain("I need to craft a Masterwork Chair");
        expect(result.options.find(o => o.label === "Complete Stage")).toBeUndefined();
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(2);

        // 6. Craft Chair
        // Need materials for chair (Def from ItemData.js/Recipes)
        // Masterwork Chair: { 'Sticks': 4, 'Shiny Stone': 1 }
        pet.inventory['Sticks'] = 10;
        pet.inventory['Shiny Stone'] = 5;
        // Also need energy/happiness for crafting
        pet.stats.energy = 100;
        pet.stats.happiness = 100;

        pet.craftItem('Masterwork Chair');
        expect(pet.inventory['Masterwork Chair']).toBe(1);
        // Check flag
        expect(pet.questSystem.getQuest('masterwork_crafting').hasCraftedChair).toBe(true);

        // 7. Interact to Complete
        result = pet.interact('Master Artisan');
        expect(result.text).toContain("(Requirements Met!)");
        const completeStage2 = result.options.find(o => o.label === "Complete Stage");
        expect(completeStage2).toBeDefined();

        completeStage2.action();

        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(3);
        expect(pet.inventory['Masterwork Chair']).toBeUndefined(); // Consumed
        journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("impressed by my chair"))).toBe(true);

        // 8. Recurring Interaction
        const initialCrafting = pet.skills.crafting;
        result = pet.interact('Master Artisan');
        // Just chatting now
        expect(result.text).toContain("fellow master");
        // Skill gain happens automatically on interaction type 'CHAT' inside interact()
        expect(pet.skills.crafting).toBeGreaterThan(initialCrafting);
    });
});
