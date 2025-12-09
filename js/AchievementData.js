/**
 * @fileoverview Definitions for all available achievements.
 * Includes ID, metadata (name, description, icon), and unlock conditions.
 */

export const Achievements = [
    {
        id: 'first_craft',
        name: 'First Craft',
        description: 'Craft your first item.',
        icon: '🔨',
        condition: (progress) => progress.craftCount >= 1
    },
    {
        id: 'novice_explorer',
        name: 'Novice Explorer',
        description: 'Explore the wilderness 5 times.',
        icon: '🌲',
        condition: (progress) => progress.exploreCount >= 5
    },
    {
        id: 'socialite',
        name: 'Socialite',
        description: 'Chat with neighbors 10 times.',
        icon: '💬',
        condition: (progress) => progress.chatCount >= 10
    },
    {
        id: 'scholar',
        name: 'Scholar',
        description: 'Study 5 times.',
        icon: '📚',
        condition: (progress) => progress.studyCount >= 5
    }
];
