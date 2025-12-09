/**
 * @fileoverview Registry of all event keys used in the application.
 * Defines string constants for UI actions, system events, and scene communication.
 * Using constants prevents typos and facilitates refactoring.
 */

export const EventKeys = {
    // UI Actions (Event Name)
    UI_ACTION: 'uiAction',

    // UI Action Types (Payloads)
    FEED: 'FEED',
    PLAY: 'PLAY',
    STUDY: 'STUDY',
    EXPLORE: 'EXPLORE',
    MEDITATE: 'MEDITATE',
    SLEEP: 'SLEEP',
    CRAFT_ITEM: 'CRAFT_ITEM',
    CONSUME_ITEM: 'CONSUME_ITEM',
    OPEN_CRAFTING_MENU: 'OPEN_CRAFTING_MENU',
    CLOSE_CRAFTING_MENU: 'CLOSE_CRAFTING_MENU',
    OPEN_INVENTORY: 'OPEN_INVENTORY',
    CLOSE_INVENTORY: 'CLOSE_INVENTORY',
    TOGGLE_DEBUG: 'TOGGLE_DEBUG',
    INTERACT_BOOKSHELF: 'INTERACT_BOOKSHELF',
    INTERACT_PLANT: 'INTERACT_PLANT',
    INTERACT_FANCY_BOOKSHELF: 'INTERACT_FANCY_BOOKSHELF',
    PRACTICE_HOBBY: 'PRACTICE_HOBBY',
    FORAGE: 'FORAGE',

    // UI Navigation
    OPEN_JOURNAL: 'OPEN_JOURNAL',
    OPEN_RECIPES: 'OPEN_RECIPES',
    OPEN_HOBBIES: 'OPEN_HOBBIES',
    OPEN_ANCESTOR_MODAL: 'OPEN_ANCESTOR_MODAL',
    OPEN_SETTINGS: 'OPEN_SETTINGS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',

    // NPC Interactions
    INTERACT_NPC: 'INTERACT_NPC', // Generic
    INTERACT_SCOUT: 'INTERACT_SCOUT',
    INTERACT_ARTISAN: 'INTERACT_ARTISAN',
    INTERACT_VILLAGER: 'INTERACT_VILLAGER',

    // System/Meta Actions
    WORK: 'WORK',
    RETIRE: 'RETIRE',
    DECORATE: 'DECORATE',
    PLACE_FURNITURE: 'PLACE_FURNITURE',
    NONE: 'NONE',

    // Scene Communication (Event Name)
    WORK_RESULT: 'workResult',
    UPDATE_STATS: 'updateStats',
    SCENE_COMPLETE: 'SCENE_COMPLETE',

    // System Events
    GAME_SAVED: 'GAME_SAVED',
    GAME_LOADED: 'GAME_LOADED',

    // Tutorial
    START_TUTORIAL: 'START_TUTORIAL'
};
