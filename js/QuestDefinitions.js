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

/**
 * Templates for procedurally generated daily quests.
 * Organized by Season.
 */
export const DailyQuestTemplates = {
    Spring: [
        { id: 'dq_spring_berries', type: 'FETCH', item: 'Berries', qty: 3, npc: 'Sickly Villager', text: "The Villager needs fresh vitamins after winter." },
        { id: 'dq_spring_sticks', type: 'FETCH', item: 'Sticks', qty: 5, npc: 'Master Artisan', text: "The Artisan needs fresh wood for new projects." }
    ],
    Summer: [
        { id: 'dq_summer_tea', type: 'FETCH', item: 'Stamina-Up Tea', qty: 1, npc: 'Grizzled Scout', text: "The Scout is parched from the summer heat." },
        { id: 'dq_summer_stone', type: 'FETCH', item: 'Shiny Stone', qty: 1, npc: 'Master Artisan', text: "The Artisan needs a shiny stone for a mosaic." }
    ],
    Autumn: [
         { id: 'dq_autumn_muse', type: 'FETCH', item: 'Muse Flower', qty: 1, npc: 'Master Artisan', text: "The Artisan seeks a Muse Flower for inspiration." }
    ],
    Winter: [
        { id: 'dq_winter_frost', type: 'FETCH', item: 'Frostbloom', qty: 1, npc: 'Grizzled Scout', text: "The Scout needs a Frostbloom for study." },
        { id: 'dq_winter_warmth', type: 'FETCH', item: 'Stamina-Up Tea', qty: 2, npc: 'Sickly Villager', text: "It's freezing! The Villager needs warm tea." },
        { id: 'dq_winter_firewood', type: 'FETCH', item: 'Sticks', qty: 5, npc: 'Sickly Villager', text: "The Villager needs firewood to stay warm." }
    ],
    // Weather-specific templates (can occur in any season if weather matches)
    Rainy: [
         { id: 'dq_rainy_cocoa', type: 'CRAFT', item: 'Hot Cocoa', qty: 1, npc: 'Sickly Villager', text: "It's a perfect day for Hot Cocoa." }
    ],
    Stormy: [
         { id: 'dq_stormy_repair', type: 'FETCH', item: 'Sticks', qty: 3, npc: 'Grizzled Scout', text: "The storm damaged my shelter. I need repair materials." }
    ]
};
