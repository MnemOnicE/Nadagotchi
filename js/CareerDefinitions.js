/**
 * @fileoverview Definitions for Career Levels, Titles, and XP Requirements.
 */

export const CareerDefinitions = {
    // XP thresholds to reach the NEXT level.
    // e.g. To reach Level 2, you need 100 XP total.
    XP_THRESHOLDS: {
        1: 0,
        2: 100,
        3: 300,
        4: 600,
        5: 1000
    },

    TITLES: {
        Innovator: {
            1: "Lab Assistant",
            2: "Junior Researcher",
            3: "Project Lead",
            4: "Senior Scientist",
            5: "Nobel Laureate"
        },
        Scout: {
            1: "Trail Walker",
            2: "Pathfinder",
            3: "Ranger",
            4: "Expedition Leader",
            5: "Legendary Explorer"
        },
        Healer: {
            1: "First Aider",
            2: "Nurse",
            3: "Doctor",
            4: "Surgeon",
            5: "Miracle Worker"
        },
        Artisan: {
            1: "Apprentice",
            2: "Journeyman",
            3: "Craftsman",
            4: "Master Artisan",
            5: "Grandmaster"
        },
        Archaeologist: {
            1: "Digger",
            2: "Site Supervisor",
            3: "Historian",
            4: "Relic Hunter",
            5: "Time Keeper"
        }
    }
};
