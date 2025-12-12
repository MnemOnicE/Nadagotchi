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
        let dialogue = pet.interact('Master Artisan');
        expect(pet.questSystem.getQuest('masterwork_crafting')).toBeDefined();
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(1);
        expect(dialogue).toBeTruthy();

        // 2. Try to advance without Sticks
        dialogue = pet.interact('Master Artisan');
        // Should log "waiting for 5 Sticks" in journal (pushed before the chat log)
        let journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("waiting for 5 Sticks"))).toBe(true);
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(1);

        // 3. Get Sticks
        pet.inventory['Sticks'] = 5;

        // 4. Interact to Advance
        pet.interact('Master Artisan');
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(2);
        expect(pet.inventory['Sticks']).toBeUndefined(); // Consumed
        expect(pet.discoveredRecipes).toContain("Masterwork Chair");

        // Verify Journal Update for Stage 2
        journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("I gave the Sticks"))).toBe(true);

        // 5. Try to advance without Chair
        pet.interact('Master Artisan');
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(2);
        // Should log status for stage 2
        journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("I need to craft a Masterwork Chair"))).toBe(true);

        // 6. Craft Chair
        // Need materials for chair (Def from ItemData.js/Recipes)
        // Masterwork Chair: { 'Sticks': 10, 'Shiny Stone': 2 }
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
        pet.interact('Master Artisan');
        expect(pet.questSystem.getQuest('masterwork_crafting').stage).toBe(3);
        expect(pet.inventory['Masterwork Chair']).toBeUndefined(); // Consumed
        journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("impressed by my chair"))).toBe(true);

        // 8. Recurring Interaction
        const initialCrafting = pet.skills.crafting;
        pet.interact('Master Artisan');
        expect(pet.skills.crafting).toBeGreaterThan(initialCrafting);
        journalEntries = pet.journal.map(j => j.text);
        expect(journalEntries.some(t => t.includes("greeted me warmly"))).toBe(true);
    });
});
