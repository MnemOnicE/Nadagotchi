import { NarrativeSystem } from '../js/NarrativeSystem.js';
import { DialogueDefinitions } from '../js/DialogueDefinitions.js';

describe('NarrativeSystem', () => {
    describe('getNPCDialogue', () => {
        test('should return "..." for unknown NPCs', () => {
            expect(NarrativeSystem.getNPCDialogue('Unknown NPC', 0, false)).toBe('...');
        });

        test('should return default dialogue for low relationship and no active quest', () => {
            const dialogue = NarrativeSystem.getNPCDialogue('Grizzled Scout', 0, false);
            expect(DialogueDefinitions['Grizzled Scout'].default).toContain(dialogue);
        });

        test('should return friend dialogue for relationshipLevel >= 5', () => {
            const dialogue = NarrativeSystem.getNPCDialogue('Grizzled Scout', 5, false);
            expect(DialogueDefinitions['Grizzled Scout'].friend).toContain(dialogue);
        });

        test('should return quest_active dialogue when hasActiveQuest is true', () => {
            const dialogue = NarrativeSystem.getNPCDialogue('Grizzled Scout', 0, true);
            expect(DialogueDefinitions['Grizzled Scout'].quest_active).toContain(dialogue);
        });

        test('should handle missing quest_active category', () => {
            // Sickly Villager has no quest_active category.
            const dialogue = NarrativeSystem.getNPCDialogue('Sickly Villager', 0, true);
            expect(DialogueDefinitions['Sickly Villager'].default).toContain(dialogue);
        });

        test('should handle missing friend category by falling back to default', () => {
            // Setup a temporary NPC without a friend category
            DialogueDefinitions['Robustness Test NPC'] = {
                'default': ['Fallback success']
            };

            // Should fall back to default when relationship >= 5 but friend is missing
            const dialogue = NarrativeSystem.getNPCDialogue('Robustness Test NPC', 5, false);
            expect(dialogue).toBe('Fallback success');

            // Clean up
            delete DialogueDefinitions['Robustness Test NPC'];
        });
    });

    describe('generateEntry', () => {
        test('should generate MOOD_CHANGE entries', () => {
            const context = { newMood: 'happy' };
            const entry = NarrativeSystem.generateEntry('Adventurer', 'MOOD_CHANGE', context);
            const templates = NarrativeSystem.getTemplates();
            const expected = templates['Adventurer']['MOOD_CHANGE']['happy'];
            if (Array.isArray(expected)) {
                expect(expected).toContain(entry);
            } else {
                expect(entry).toBe(expected);
            }
        });

        test('should generate WEATHER_CHANGE entries', () => {
            const context = { weather: 'Rainy' };
            const entry = NarrativeSystem.generateEntry('Nurturer', 'WEATHER_CHANGE', context);
            const templates = NarrativeSystem.getTemplates();
            expect(entry).toBe(templates['Nurturer']['WEATHER_CHANGE']['Rainy']);
        });

        test('should generate AGE_MILESTONE entries', () => {
            const entry = NarrativeSystem.generateEntry('Intellectual', 'AGE_MILESTONE', {});
            const templates = NarrativeSystem.getTemplates();
            expect(entry).toBe(templates['Intellectual']['AGE_MILESTONE']['default']);
        });

        test('should fallback to Default archetype', () => {
            const context = { newMood: 'happy' };
            const entry = NarrativeSystem.generateEntry('UnknownArchetype', 'MOOD_CHANGE', context);
            const templates = NarrativeSystem.getTemplates();
            expect(entry).toBe(templates['Default']['MOOD_CHANGE']['happy']);
        });

        test('should return null for unknown event types', () => {
            expect(NarrativeSystem.generateEntry('Adventurer', 'UNKNOWN_EVENT', {})).toBeNull();
        });

        test('should return null for missing context keys', () => {
            expect(NarrativeSystem.generateEntry('Adventurer', 'MOOD_CHANGE', {})).toBeNull();
        });
    });

    describe('getAdvice', () => {
        test('should return advice for known archetypes', () => {
            const advice = NarrativeSystem.getAdvice('Adventurer');
            const templates = NarrativeSystem.getTemplates();
            expect(templates['ADVICE']['Adventurer']).toContain(advice);
        });

        test('should fallback to Default advice', () => {
            const advice = NarrativeSystem.getAdvice('UnknownArchetype');
            const templates = NarrativeSystem.getTemplates();
            expect(templates['ADVICE']['Default']).toContain(advice);
        });
    });

    describe('getTemplates', () => {
        test('should return complete template object', () => {
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
