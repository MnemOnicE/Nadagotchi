// tests/QuestSystem.test.js

jest.mock('../js/PersistenceManager');
const { Nadagotchi } = require('../js/Nadagotchi');
const { PersistenceManager } = require('../js/PersistenceManager');
const { Config } = require('../js/Config');

// Helper to check if journal contains partial text
const journalContains = (journal, text) => {
    return journal.some(entry => entry.text.includes(text));
};

describe('Quest System - Masterwork Crafting', () => {
    let pet;

    beforeEach(() => {
        // Setup mock Persistence
        PersistenceManager.mockImplementation(() => ({
            loadJournal: jest.fn().mockReturnValue([]),
            saveJournal: jest.fn(),
            loadRecipes: jest.fn().mockReturnValue([]),
            saveRecipes: jest.fn(),
            loadPet: jest.fn().mockReturnValue(null),
            savePet: jest.fn()
        }));

        pet = new Nadagotchi('Recluse');
        // Ensure relationships exist (defaults usually do, but just in case)
        pet.relationships = { 'Master Artisan': { level: 0 } };
        pet.quests = {};
    });

    test('should trigger quest at high relationship level', () => {
        pet.relationships['Master Artisan'].level = 5;

        // Interaction should trigger quest start
        pet.interact('Master Artisan');

        expect(pet.quests['masterwork_crafting']).toBeDefined();
        expect(pet.quests['masterwork_crafting'].stage).toBe(1);
        expect(journalContains(pet.journal, "asked for 5 Sticks")).toBe(true);
    });

    test('should progress to stage 2 when giving Sticks', () => {
        // Setup Quest Stage 1
        pet.quests['masterwork_crafting'] = { stage: 1 };
        pet.relationships['Master Artisan'].level = 5;
        // Give items
        pet.inventory['Sticks'] = 10;

        pet.interact('Master Artisan');

        expect(pet.quests['masterwork_crafting'].stage).toBe(2);
        expect(pet.discoveredRecipes).toContain("Masterwork Chair");
        expect(journalContains(pet.journal, "taught me how to make a Masterwork Chair")).toBe(true);
    });

    test('should not progress to stage 2 without Sticks', () => {
        // Setup Quest Stage 1
        pet.quests['masterwork_crafting'] = { stage: 1 };
        pet.relationships['Master Artisan'].level = 5;
        // No items
        pet.inventory['Sticks'] = 0;

        pet.interact('Master Artisan');

        expect(pet.quests['masterwork_crafting'].stage).toBe(1);
        expect(journalContains(pet.journal, "waiting for 5 Sticks")).toBe(true);
    });

    test('should complete quest when showing Masterwork Chair', () => {
        // Setup Quest Stage 2
        pet.quests['masterwork_crafting'] = { stage: 2, hasCraftedChair: true };
        pet.relationships['Master Artisan'].level = 5;
        pet.inventory['Masterwork Chair'] = 1;

        pet.interact('Master Artisan');

        expect(pet.quests['masterwork_crafting'].stage).toBe(3); // Completed
        expect(pet.inventory['Masterwork Chair']).toBeUndefined(); // Taken
        // Check for reward (e.g., skill boost) - assuming we implement some skill boost
        // We might need to check if crafting skill increased more than normal interaction
        expect(journalContains(pet.journal, "impressed by my chair")).toBe(true);
    });

    test('should save and load quest state', () => {
        // Simulate existing save data with quest
        const mockLoadData = {
            quests: {
                'masterwork_crafting': { stage: 2, hasCraftedChair: true }
            },
            relationships: { 'Master Artisan': { level: 5 } },
            inventory: {},
            stats: { hunger: 50, energy: 50, happiness: 50 },
            skills: { crafting: 0, logic: 0, research: 0, empathy: 0, navigation: 0, communication: 0 },
            genome: { genotype: {} }
        };

        const loadedPet = new Nadagotchi('Recluse', mockLoadData);

        expect(loadedPet.quests['masterwork_crafting']).toBeDefined();
        expect(loadedPet.quests['masterwork_crafting'].stage).toBe(2);
        expect(loadedPet.quests['masterwork_crafting'].hasCraftedChair).toBe(true);
    });

    test('should provide skill boost after quest completion', () => {
        // Setup Completed Quest
        pet.quests['masterwork_crafting'] = { stage: 3 };
        pet.relationships['Master Artisan'].level = 10;
        pet.skills.crafting = 5;

        pet.interact('Master Artisan');

        // Check for skill increase
        expect(pet.skills.crafting).toBeGreaterThan(5);
        expect(journalContains(pet.journal, "advanced crafting theory")).toBe(true);
    });
});
