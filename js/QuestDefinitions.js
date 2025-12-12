/**
 * @fileoverview Static definitions for all quests in the game.
 * Used by QuestSystem to manage quest states and progression.
 */

export const QuestDefinitions = {
    'masterwork_crafting': {
        name: 'Masterwork Crafting',
        startDescription: "The Master Artisan sees potential in me. He asked for 5 Sticks to prove my dedication.",
        stages: {
            1: {
                description: "The Master Artisan is waiting for 5 Sticks.",
                requirements: {
                    items: { 'Sticks': 5 }
                },
                rewards: {
                    recipes: ['Masterwork Chair']
                },
                completionJournalEntry: "I gave the Sticks to the Artisan. He taught me how to make a Masterwork Chair! I need to craft one to show him.",
                nextStage: 2,
                consumeRequirements: true
            },
            2: {
                description: "I need to craft a Masterwork Chair to show the Artisan.",
                requirements: {
                    flags: ['hasCraftedChair'],
                    items: { 'Masterwork Chair': 1 }
                },
                rewards: {
                    skills: { crafting: 2.0 },
                    happiness: 20
                },
                completionJournalEntry: "The Master Artisan was impressed by my chair! He declared me a true craftsman.",
                nextStage: 3,
                consumeRequirements: true
            },
            3: {
                description: "I am a Master Craftsman.",
                isComplete: true,
                recurringInteraction: {
                    rewards: { skills: { crafting: 0.2 } },
                    journalEntry: "The Master Artisan greeted me warmly as a fellow master. We discussed advanced crafting theory."
                }
            }
        }
    }
};
