import { jest } from '@jest/globals';
import { QuestSystem } from '../js/systems/QuestSystem.js';
import { QuestDefinitions } from '../js/QuestDefinitions.js';
import { Config } from '../js/Config.js';

describe('QuestSystem', () => {
    let pet;
    let questSystem;

    beforeEach(() => {
        pet = {
            quests: {},
            inventory: {},
            skills: { crafting: 0 },
            stats: { happiness: 50 },
            relationships: {},
            dailyQuest: null,
            getMoodMultiplier: jest.fn(() => 1.0),
            addJournalEntry: jest.fn(),
            gainCareerXP: jest.fn(),
            inventorySystem: {
                removeItem: jest.fn(),
                discoverRecipe: jest.fn(),
                addItem: jest.fn(),
                canAddItem: jest.fn(() => true)
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

    test('should not advance quest if inventory cannot accept reward items (Validate-First)', () => {
        // Setup a quest state
        const questId = 'masterwork_crafting';
        pet.quests[questId] = { stage: 1 };
        pet.inventory['Sticks'] = 5; // Meets requirements

        // Mock Stage Definition to have item rewards
        const mockStageDef = {
            requirements: { items: { 'Sticks': 5 } },
            consumeRequirements: true,
            rewards: { items: { 'Rare Gem': 1 } },
            nextStage: 2
        };
        jest.spyOn(questSystem, 'getStageDefinition').mockReturnValue(mockStageDef);

        // Mock Inventory Full
        pet.inventorySystem.canAddItem.mockReturnValue(false);

        // Attempt Advance
        const result = questSystem.advanceQuest(questId);

        // Assert Transaction Aborted
        expect(result).toBe(false);
        expect(pet.quests[questId].stage).toBe(1); // Did not advance
        expect(pet.inventorySystem.removeItem).not.toHaveBeenCalled(); // Items NOT consumed
        expect(pet.inventorySystem.addItem).not.toHaveBeenCalled(); // Reward NOT given
    });

    describe('completeDailyQuest', () => {
        test('returns false if no daily quest active', () => {
            pet.dailyQuest = null;
            expect(questSystem.completeDailyQuest()).toBe(false);
        });

        test('returns false if daily quest already completed', () => {
            pet.dailyQuest = { completed: true };
            expect(questSystem.completeDailyQuest()).toBe(false);
        });

        test('returns false if quest type is not FETCH or CRAFT', () => {
            pet.dailyQuest = { type: 'EXPLORE', completed: false };
            expect(questSystem.completeDailyQuest()).toBe(false);
        });

        test('returns false if insufficient inventory items', () => {
            pet.dailyQuest = {
                type: 'FETCH',
                item: 'Sticks',
                qty: 5,
                completed: false
            };
            pet.inventory['Sticks'] = 4;
            expect(questSystem.completeDailyQuest()).toBe(false);
        });

        test('successfully completes daily quest (FETCH)', () => {
            const initialHappiness = 50;
            pet.stats.happiness = initialHappiness;
            pet.dailyQuest = {
                type: 'FETCH',
                item: 'Sticks',
                qty: 5,
                npc: 'Villager',
                completed: false
            };
            pet.inventory['Sticks'] = 10;
            pet.relationships['Villager'] = { level: 2 };

            const result = questSystem.completeDailyQuest();

            expect(result).toBe(true);
            expect(pet.dailyQuest.completed).toBe(true);
            expect(pet.inventorySystem.removeItem).toHaveBeenCalledWith('Sticks', 5);
            expect(pet.gainCareerXP).toHaveBeenCalledWith(20);
            expect(pet.stats.happiness).toBe(initialHappiness + Config.ACTIONS.INTERACT_NPC.QUEST_HAPPINESS_GAIN);
            expect(pet.relationships['Villager'].level).toBe(3);
            expect(pet.addJournalEntry).toHaveBeenCalledWith(expect.stringContaining('I completed a request for Villager'));
        });

        test('successfully completes daily quest (CRAFT)', () => {
            pet.dailyQuest = {
                type: 'CRAFT',
                item: 'Chair',
                qty: 1,
                npc: 'Artisan',
                completed: false
            };
            pet.inventory['Chair'] = 1;
            pet.relationships['Artisan'] = { level: 5 };

            const result = questSystem.completeDailyQuest();

            expect(result).toBe(true);
            expect(pet.dailyQuest.completed).toBe(true);
            expect(pet.inventorySystem.removeItem).toHaveBeenCalledWith('Chair', 1);
        });

        test('does not update relationship if NPC not met', () => {
            pet.dailyQuest = {
                type: 'FETCH',
                item: 'Sticks',
                qty: 5,
                npc: 'Stranger', // Not in relationships
                completed: false
            };
            pet.inventory['Sticks'] = 5;
            // pet.relationships is empty or doesn't have 'Stranger'

            const result = questSystem.completeDailyQuest();

            expect(result).toBe(true);
            expect(pet.relationships['Stranger']).toBeUndefined(); // Should not crash or create it
        });
    });
});
