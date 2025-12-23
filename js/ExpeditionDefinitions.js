/**
 * @fileoverview Data definitions for the Expedition system.
 * // Manual Override: Patch Applied.
 * Contains templates for encounters (Nodes) that can appear during an expedition.
 */

export const ExpeditionNodes = {
    // --- Generic / Forest ---
    BERRY_BUSH: {
        id: 'BERRY_BUSH',
        description: "You find a bush thick with berries.",
        biomes: ['Forest', 'Plains'],
        choices: [
            {
                text: "Gather Berries",
                skill: "navigation",
                difficulty: 2,
                success: { text: "You fill your pockets with sweet berries.", items: { 'Berries': 3 }, xp: 5 },
                failure: { text: "You scratch your hand on a thorn.", stats: { happiness: -2 }, xp: 1 }
            },
            {
                text: "Leave it be",
                success: { text: "You continue on your way.", xp: 0 }
            }
        ]
    },
    OLD_OAK: {
        id: 'OLD_OAK',
        description: "A massive oak tree blocks your path. There might be something in the hollow.",
        biomes: ['Forest'],
        choices: [
            {
                text: "Search Hollow",
                skill: "navigation",
                difficulty: 5,
                success: { text: "You find a hidden stash!", items: { 'Shiny Stone': 1, 'Sticks': 2 }, xp: 10 },
                failure: { text: "It's empty, and full of spiders.", stats: { happiness: -5 }, xp: 2 }
            },
            {
                text: "Climb",
                skill: "focus",
                difficulty: 4,
                success: { text: "The view is amazing!", stats: { happiness: 10 }, xp: 10 },
                failure: { text: "You slip and fall.", stats: { energy: -5 }, xp: 2 }
            }
        ]
    },
    RIVER_CROSSING: {
        id: 'RIVER_CROSSING',
        description: "A fast-flowing river cuts through the land.",
        biomes: ['Forest', 'Plains', 'Mountain'],
        choices: [
            {
                text: "Swim Across",
                skill: "resilience",
                difficulty: 5,
                success: { text: "You make it across, refreshed.", stats: { energy: -5, cleanliness: 10 }, xp: 15 },
                failure: { text: "The current is too strong! You are washed downstream.", stats: { energy: -15, happiness: -5 }, xp: 5 }
            },
            {
                text: "Look for Stones",
                skill: "logic",
                difficulty: 3,
                success: { text: "You find a safe path of stones.", stats: { energy: -2 }, xp: 10 },
                failure: { text: "You slip on a wet mossy stone.", stats: { energy: -5, happiness: -2 }, xp: 2 }
            }
        ]
    },

    // --- Weather Specific ---
    MUDDY_SLOPE: {
        id: 'MUDDY_SLOPE',
        description: "The rain has turned this slope into a mudslide.",
        weather: ['Rainy', 'Stormy'],
        choices: [
            {
                text: "Slide Down!",
                skill: "resilience",
                difficulty: 2, // Fun if resilient
                success: { text: "Wheee! That was fun.", stats: { happiness: 15, cleanliness: -20 }, xp: 5 },
                failure: { text: "You get stuck in the mud.", stats: { energy: -10, cleanliness: -20 }, xp: 2 }
            },
            {
                text: "Careful Descent",
                skill: "logic",
                difficulty: 4,
                success: { text: "You make it down safely.", stats: { energy: -5 }, xp: 5 },
                failure: { text: "You slip anyway.", stats: { energy: -8 }, xp: 2 }
            }
        ]
    },
    FROZEN_POND: {
        id: 'FROZEN_POND',
        description: "A small pond has frozen over.",
        season: ['Winter'],
        choices: [
            {
                text: "Ice Skate",
                skill: "focus",
                difficulty: 6,
                success: { text: "You perform a graceful spin!", stats: { happiness: 20 }, xp: 20 },
                failure: { text: "You fall on your bum.", stats: { happiness: -5, energy: -5 }, xp: 5 }
            },
            {
                text: "Break Ice for Water",
                skill: "resilience",
                difficulty: 3,
                success: { text: "You get some fresh cold water.", items: { 'Clear Water': 1 }, xp: 5 }, // 'Clear Water' might need to be a real item
                failure: { text: "The ice is too thick.", stats: { energy: -5 }, xp: 1 }
            }
        ]
    },

    // --- Rare / Mystery ---
    ANCIENT_RUINS: {
        id: 'ANCIENT_RUINS',
        description: "You stumble upon moss-covered stone ruins.",
        weight: 0.2, // Lower chance
        choices: [
            {
                text: "Decipher Runes",
                skill: "research",
                difficulty: 7,
                success: { text: "You learn secrets of the past.", stats: { happiness: 10 }, xp: 50, items: { 'Ancient Tome': 1 } },
                failure: { text: "It's just gibberish to you.", stats: { happiness: -2 }, xp: 5 }
            },
            {
                text: "Excavate",
                skill: "resilience",
                difficulty: 5,
                success: { text: "You dig up something shiny!", items: { 'Shiny Stone': 2 }, xp: 15 },
                failure: { text: "You dig a hole. It is a nice hole.", stats: { energy: -10 }, xp: 5 }
            }
        ]
    }
};
