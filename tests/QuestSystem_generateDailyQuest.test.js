import { jest } from '@jest/globals';
import { QuestSystem } from '../js/systems/QuestSystem.js';
import { DailyQuestTemplates } from '../js/QuestDefinitions.js';

// Mock DailyQuestTemplates to have controlled data for testing
jest.mock('../js/QuestDefinitions.js', () => ({
    QuestDefinitions: {},
    DailyQuestTemplates: {
        Spring: [
            { id: 'dq_spring_1', npc: 'NPC1', type: 'FETCH', item: 'Item1', qty: 1, text: 'Spring Quest 1' }
        ],
        Summer: [
            { id: 'dq_summer_1', npc: 'NPC2', type: 'FETCH', item: 'Item2', qty: 2, text: 'Summer Quest 1' }
        ],
        Rainy: [
            { id: 'dq_rainy_1', npc: 'NPC3', type: 'FETCH', item: 'Item3', qty: 3, text: 'Rainy Quest 1' }
        ]
    }
}));

describe('QuestSystem.generateDailyQuest', () => {
    let pet;
    let questSystem;

    beforeEach(() => {
        jest.clearAllMocks();
        pet = {
            rng: {
                choice: jest.fn((arr) => arr[0]) // Default to returning first element
            },
            dailyQuest: null,
            addJournalEntry: jest.fn()
        };
        questSystem = new QuestSystem(pet);
    });

    test('should correctly select a template from the specified season', () => {
        const result = questSystem.generateDailyQuest('Spring');

        expect(result).not.toBeNull();
        expect(result.id).toBe('dq_spring_1');
        expect(pet.dailyQuest).toBe(result);
        expect(pet.rng.choice).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'dq_spring_1' })
        ]));
        expect(pet.addJournalEntry).toHaveBeenCalledWith(expect.stringContaining('Spring Quest 1'));
    });

    test('should combine templates from both season and weather', () => {
        // Mock choice to return the second element to test combination
        pet.rng.choice.mockImplementation((arr) => arr[1]);

        const result = questSystem.generateDailyQuest('Spring', 'Rainy');

        expect(result).not.toBeNull();
        expect(result.id).toBe('dq_rainy_1');
        expect(pet.rng.choice).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'dq_spring_1' }),
            expect.objectContaining({ id: 'dq_rainy_1' })
        ]));
        expect(pet.rng.choice.mock.calls[0][0]).toHaveLength(2);
    });

    test('should handle cases where weather templates are not found', () => {
        const result = questSystem.generateDailyQuest('Spring', 'Sunny');

        expect(result).not.toBeNull();
        expect(result.id).toBe('dq_spring_1');
        expect(pet.rng.choice.mock.calls[0][0]).toHaveLength(1);
    });

    test('should return null if no templates are found for season or weather', () => {
        const result = questSystem.generateDailyQuest('Winter', 'Sunny');

        expect(result).toBeNull();
        expect(pet.dailyQuest).toBeNull();
        expect(pet.addJournalEntry).not.toHaveBeenCalled();
    });

    test('should return null if season templates are missing and weather is null', () => {
        const result = questSystem.generateDailyQuest('Winter');

        expect(result).toBeNull();
    });

    test('should correctly populate all fields of dailyQuest', () => {
        const result = questSystem.generateDailyQuest('Spring');

        expect(result).toEqual({
            id: 'dq_spring_1',
            npc: 'NPC1',
            type: 'FETCH',
            item: 'Item1',
            qty: 1,
            text: 'Spring Quest 1',
            completed: false
        });
    });
});
