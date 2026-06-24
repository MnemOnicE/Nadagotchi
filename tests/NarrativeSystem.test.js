import { jest } from '@jest/globals';
import { NarrativeSystem } from '../js/NarrativeSystem.js';
import { DialogueDefinitions } from '../js/DialogueDefinitions.js';

describe('NarrativeSystem', () => {
    let originalRandom;

    beforeEach(() => {
        // Mock Math.random to always return 0 to reliably select the first item in an array
        originalRandom = Math.random;
        Math.random = jest.fn(() => 0);
    });

    afterEach(() => {
        // Restore Math.random
        Math.random = originalRandom;
    });

    describe('getNPCDialogue', () => {
        it('should return "..." if NPC data does not exist', () => {
            const result = NarrativeSystem.getNPCDialogue('Unknown NPC', 0, false);
            expect(result).toBe('...');
        });

        it('should return default dialogue if relationship level is low and no active quest', () => {
            const npcName = 'Grizzled Scout';
            const result = NarrativeSystem.getNPCDialogue(npcName, 0, false);
            const expectedLines = DialogueDefinitions[npcName]['default'];
            expect(result).toBe(expectedLines[0]);
        });

        it('should return friend dialogue if relationship level is >= 5', () => {
            const npcName = 'Grizzled Scout';
            const result = NarrativeSystem.getNPCDialogue(npcName, 5, false);
            const expectedLines = DialogueDefinitions[npcName]['friend'];
            expect(result).toBe(expectedLines[0]);
        });

        it('should return quest_active dialogue if hasActiveQuest is true and category exists', () => {
            const npcName = 'Grizzled Scout';
            const result = NarrativeSystem.getNPCDialogue(npcName, 0, true);
            const expectedLines = DialogueDefinitions[npcName]['quest_active'];
            expect(result).toBe(expectedLines[0]);
        });

        it('should return friend dialogue if hasActiveQuest is true but no quest_active lines exist, but relation is >= 5', () => {
            const npcName = 'Sickly Villager'; // Doesn't have quest_active
            const result = NarrativeSystem.getNPCDialogue(npcName, 5, true);
            const expectedLines = DialogueDefinitions[npcName]['friend'];
            expect(result).toBe(expectedLines[0]);
        });
    });

    describe('generateEntry', () => {
        it('should return MOOD_CHANGE template for specific archetype', () => {
            const result = NarrativeSystem.generateEntry('Adventurer', 'MOOD_CHANGE', { newMood: 'sad' });
            expect(result).toBe("I haven't been on an adventure in a while... feeling bored.");
        });

        it('should resolve random array choice for MOOD_CHANGE template', () => {
             // Math.random is mocked to 0, should pick the first element
             const result = NarrativeSystem.generateEntry('Adventurer', 'MOOD_CHANGE', { newMood: 'happy' });
             expect(result).toBe("I'm pumped! Where should we explore next?");
        });

        it('should fallback to Default archetype if requested archetype does not exist', () => {
            const result = NarrativeSystem.generateEntry('UnknownArchetype', 'MOOD_CHANGE', { newMood: 'happy' });
            expect(result).toBe("I'm feeling good today!");
        });

        it('should return WEATHER_CHANGE template', () => {
            const result = NarrativeSystem.generateEntry('Intellectual', 'WEATHER_CHANGE', { weather: 'Sunny' });
            expect(result).toBe("Excellent lighting for reading.");
        });

        it('should return AGE_MILESTONE template', () => {
            const result = NarrativeSystem.generateEntry('Mischievous', 'AGE_MILESTONE', {});
            expect(result).toBe("I'm getting bigger! More mischief to make!");
        });

        it('should return null if event type does not exist', () => {
            const result = NarrativeSystem.generateEntry('Default', 'UNKNOWN_EVENT', {});
            expect(result).toBeNull();
        });

        it('should return null if specific context key does not exist', () => {
            const result = NarrativeSystem.generateEntry('Default', 'MOOD_CHANGE', { newMood: 'confused' });
            expect(result).toBeNull();
        });
    });

    describe('getAdvice', () => {
        it('should return advice for a specific archetype', () => {
            const result = NarrativeSystem.getAdvice('Nurturer');
            const templates = NarrativeSystem.getTemplates();
            const expectedLines = templates['ADVICE']['Nurturer'];
            expect(result).toBe(expectedLines[0]);
        });

        it('should fallback to Default advice if archetype is not found', () => {
            const result = NarrativeSystem.getAdvice('UnknownArchetype');
            const templates = NarrativeSystem.getTemplates();
            const expectedLines = templates['ADVICE']['Default'];
            expect(result).toBe(expectedLines[0]);
        });
    });

    describe('getTemplates', () => {
         it('should return a valid object containing ADVICE and Default categories', () => {
             const templates = NarrativeSystem.getTemplates();
             expect(templates).toHaveProperty('ADVICE');
             expect(templates).toHaveProperty('Default');
             expect(templates).toHaveProperty('Adventurer');
             expect(templates).toHaveProperty('Nurturer');
             expect(templates).toHaveProperty('Intellectual');
             expect(templates).toHaveProperty('Mischievous');
             expect(templates).toHaveProperty('Recluse');
         });
    });
});
