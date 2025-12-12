import { jest } from '@jest/globals';
import { QuestSystem } from '../js/systems/QuestSystem.js';
import { QuestDefinitions } from '../js/QuestDefinitions.js';

describe('QuestSystem', () => {
    let pet;
    let questSystem;

    beforeEach(() => {
        pet = {
            quests: {},
            inventory: {},
            skills: { crafting: 0 },
            stats: { happiness: 50 },
            getMoodMultiplier: jest.fn(() => 1.0),
            addJournalEntry: jest.fn(),
            inventorySystem: {
                removeItem: jest.fn(),
                discoverRecipe: jest.fn(),
                addItem: jest.fn()
            },
            skills: { crafting: 0 }
        };
        questSystem = new QuestSystem(pet);
    });

    test('startQuest starts a new quest', () => {
        const result = questSystem.startQuest('masterwork_crafting');
        expect(result).toBe(true);
        expect(pet.quests['masterwork_crafting']).toBeDefined();
        expect(pet.quests['masterwork_crafting'].stage).toBe(1);
        expect(pet.addJournalEntry).toHaveBeenCalledWith(expect.stringContaining("The Master Artisan sees potential"));
    });

    test('startQuest does not restart existing quest', () => {
        pet.quests['masterwork_crafting'] = { stage: 1 };
        const result = questSystem.startQuest('masterwork_crafting');
        expect(result).toBe(false);
    });

    test('checkRequirements returns true if requirements met', () => {
        pet.quests['masterwork_crafting'] = { stage: 1 };
        pet.inventory['Sticks'] = 5;
        const result = questSystem.checkRequirements('masterwork_crafting');
        expect(result).toBe(true);
    });

    test('checkRequirements returns false if items missing', () => {
        pet.quests['masterwork_crafting'] = { stage: 1 };
        pet.inventory['Sticks'] = 4;
        const result = questSystem.checkRequirements('masterwork_crafting');
        expect(result).toBe(false);
    });

    test('advanceQuest consumes items and updates stage', () => {
        pet.quests['masterwork_crafting'] = { stage: 1 };
        pet.inventory['Sticks'] = 5;

        const result = questSystem.advanceQuest('masterwork_crafting');

        expect(result).toBe(true);
        expect(pet.quests['masterwork_crafting'].stage).toBe(2);
        expect(pet.inventorySystem.removeItem).toHaveBeenCalledWith('Sticks', 5);
        expect(pet.inventorySystem.discoverRecipe).toHaveBeenCalledWith('Masterwork Chair');
        expect(pet.addJournalEntry).toHaveBeenCalledWith(expect.stringContaining("I gave the Sticks"));
    });

    test('advanceQuest handles flags', () => {
        pet.quests['masterwork_crafting'] = { stage: 2, hasCraftedChair: true };
        pet.inventory['Masterwork Chair'] = 1;

        const result = questSystem.advanceQuest('masterwork_crafting');

        expect(result).toBe(true);
        expect(pet.quests['masterwork_crafting'].stage).toBe(3);
        expect(pet.inventorySystem.removeItem).toHaveBeenCalledWith('Masterwork Chair', 1);
        expect(pet.skills.crafting).toBeGreaterThan(0);
    });

    test('advanceQuest fails if flags missing', () => {
        pet.quests['masterwork_crafting'] = { stage: 2, hasCraftedChair: false }; // Missing flag
        pet.inventory['Masterwork Chair'] = 1;

        const result = questSystem.advanceQuest('masterwork_crafting');
        expect(result).toBe(false);
        expect(pet.quests['masterwork_crafting'].stage).toBe(2);
    });

    test('setQuestFlag sets flag', () => {
        pet.quests['masterwork_crafting'] = { stage: 2 };
        questSystem.setQuestFlag('masterwork_crafting', 'hasCraftedChair');
        expect(pet.quests['masterwork_crafting'].hasCraftedChair).toBe(true);
    });
});
