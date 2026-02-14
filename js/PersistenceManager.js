/**
 * @fileoverview Utility class for handling game state persistence via localStorage.
 * Includes mechanisms for data integrity (checksums), legacy support, and specialized save slots (Pet, Hall of Fame, Journal).
 */

import { CryptoUtils } from './utils/CryptoUtils.js';

/**
 * PersistenceManager handles saving and loading game data.
 * It provides an abstraction layer over `localStorage` with added security features.
 * @class PersistenceManager
 */
export class PersistenceManager {
    /**
     * Saves the active Nadagotchi's data to localStorage.
     * @param {object} nadagotchiData - The Nadagotchi object to save.
     * @param {object} [homeConfig=null] - DEPRECATED: The home configuration object. Now part of nadagotchiData.
     */
    async savePet(nadagotchiData, homeConfig = null) {
        // Merge homeConfig into the save payload if provided as a separate argument (Legacy support)
        const payload = { ...nadagotchiData };
        if (homeConfig) {
            payload.homeConfig = homeConfig;
        }

        // Pass the UUID as salt to bind the save file to this specific pet instance
        await this._save("nadagotchi_save", payload, payload.uuid);
    }

    /**
     * Loads the active Nadagotchi's data from localStorage.
     * @returns {Promise<object|null>} The parsed Nadagotchi data, or null if no save exists or data is corrupted.
     */
    async loadPet() {
        // Provide a callback to extract the UUID from the parsed data for hash verification
        return await this._load("nadagotchi_save", (data) => data.uuid);
    }

    /**
     * Adds a retired Nadagotchi to the "Hall of Fame" in localStorage.
     * @param {object} nadagotchiData - The data of the pet to retire.
     */
    async saveToHallOfFame(nadagotchiData) {
        const fameList = await this.loadHallOfFame();
        fameList.push(nadagotchiData);
        await this._save("hall_of_fame", fameList);
    }

    /**
     * Retrieves the list of all retired pets from the Hall of Fame.
     * @returns {Promise<Array<object>>} An array of retired Nadagotchi data objects.
     */
    async loadHallOfFame() {
        return (await this._load("hall_of_fame")) || [];
    }

    /**
     * Clears the save data for the active pet.
     * This is typically used when a pet is retired to allow starting a new generation.
     */
    clearActivePet() {
        globalThis.localStorage.removeItem("nadagotchi_save");
    }

    /**
     * Clears all game-related data from localStorage (except settings and hall of fame).
     * Used for starting a completely new game.
     */
    clearAllData() {
        const keysToClear = [
            "nadagotchi_save",
            "nadagotchi_journal",
            "nadagotchi_recipes",
            "nadagotchi_calendar",
            "nadagotchi_furniture",
            "nadagotchi_home_config"
        ];
        keysToClear.forEach(key => globalThis.localStorage.removeItem(key));
    }

    /**
     * Saves the player's journal entries to localStorage.
     * @param {Array<object>} journalEntries - The array of journal entries to save.
     */
    async saveJournal(journalEntries) {
        await this._save("nadagotchi_journal", journalEntries);
    }

    /**
     * Loads the player's journal entries from localStorage.
     * @returns {Promise<Array<object>>} The array of journal entries, or empty array if none found.
     */
    async loadJournal() {
        return (await this._load("nadagotchi_journal")) || [];
    }

    /**
     * Saves the list of discovered recipes to localStorage.
     * @param {Array<string>} recipeList - The array of discovered recipe names.
     */
    async saveRecipes(recipeList) {
        await this._save("nadagotchi_recipes", recipeList);
    }

    /**
     * Loads the list of discovered recipes from localStorage.
     * @returns {Promise<Array<string>>} The array of discovered recipe names, or empty array if none found.
     */
    async loadRecipes() {
        return (await this._load("nadagotchi_recipes")) || [];
    }

    /**
     * Saves the game's calendar data to localStorage.
     * @param {object} calendarData - The Calendar object to save.
     */
    async saveCalendar(calendarData) {
        await this._save("nadagotchi_calendar", calendarData);
    }

    /**
     * Loads the game's calendar data from localStorage.
     * @returns {Promise<object|null>} The parsed calendar data, or null if no save exists.
     */
    async loadCalendar() {
        return await this._load("nadagotchi_calendar");
    }

    /**
     * Saves the placed furniture data to localStorage.
     * @param {object} furnitureData - The furniture object keyed by room ID.
     */
    async saveFurniture(furnitureData) {
        await this._save("nadagotchi_furniture", furnitureData);
    }

    /**
     * Loads the placed furniture data from localStorage.
     * Supports migration from legacy array format to room-keyed object.
     * @returns {Promise<object>} The furniture object keyed by room ID (e.g., { "Entryway": [] }).
     */
    async loadFurniture() {
        const data = await this._load("nadagotchi_furniture");
        if (!data) return { "Entryway": [] }; // Default empty state

        // Migration: If data is an Array (Legacy), wrap it in Entryway
        if (Array.isArray(data)) {
            console.log("Migrating legacy furniture data to Entryway...");
            return { "Entryway": data };
        }

        return data;
    }

    /**
     * Saves the home configuration (Wallpaper/Flooring).
     * @deprecated Home Config is now stored in the pet data.
     * @param {object} config - { rooms: { "Entryway": { ... } } }
     */
    async saveHomeConfig(config) {
        await this._save("nadagotchi_home_config", config);
    }

    /**
     * Loads the home configuration.
     * Supports migration from legacy flat format to room-keyed object.
     * @deprecated Home Config is now loaded via loadPet(). Use for migration only.
     * @returns {Promise<object>} { rooms: { "Entryway": { ... } } }
     */
    async loadHomeConfig() {
        const data = await this._load("nadagotchi_home_config");

        // Default State
        const defaultState = {
            rooms: {
                "Entryway": { wallpaper: 'wallpaper_default', flooring: 'flooring_default', wallpaperItem: 'Default', flooringItem: 'Default' }
            }
        };

        if (!data) return defaultState;

        // Migration: If data has 'wallpaper' at root level (Legacy)
        if (data.wallpaper || data.flooring) {
            console.log("Migrating legacy home config to Entryway...");
            return {
                rooms: {
                    "Entryway": {
                        wallpaper: data.wallpaper || 'wallpaper_default',
                        flooring: data.flooring || 'flooring_default',
                        wallpaperItem: data.wallpaperItem || 'Default',
                        flooringItem: data.flooringItem || 'Default'
                    }
                }
            };
        }

        // Ensure rooms object exists if partial data
        if (!data.rooms) return defaultState;

        return data;
    }

    /**
     * Saves the global game settings to localStorage.
     * @param {object} settings - The settings object to save.
     */
    async saveSettings(settings) {
        await this._save("nadagotchi_settings", settings);
    }

    /**
     * Loads the global game settings from localStorage.
     * @returns {Promise<object|null>} The parsed settings, or null if no save exists.
     */
    async loadSettings() {
        return await this._load("nadagotchi_settings");
    }

    /**
     * Saves the achievement progress to localStorage.
     * @param {object} achievementData - The achievement data (unlocked list + progress).
     */
    async saveAchievements(achievementData) {
        await this._save("nadagotchi_achievements", achievementData);
    }

    /**
     * Loads the achievement progress from localStorage.
     * @returns {Promise<object>} The parsed achievement data, or default structure.
     */
    async loadAchievements() {
        return (await this._load("nadagotchi_achievements")) || { unlocked: [], progress: {} };
    }

    /**
     * Helper method to save data with simple obfuscation (Base64) and an integrity check (Hash).
     * @param {string} key - The localStorage key.
     * @param {any} data - The data to save.
     * @param {string} [salt=null] - Optional salt (e.g., UUID) to bind the hash to the data content.
     * @private
     */
    async _save(key, data, salt = null) {
        try {
            const json = JSON.stringify(data);
            const encoded = btoa(json);
            const strToHash = salt ? encoded + salt : encoded;
            const hash = await this._hash(strToHash);
            globalThis.localStorage.setItem(key, `${encoded}|${hash}`);
        } catch (e) {
            console.error(`Failed to save data for key ${key}:`, e);
        }
    }

    /**
     * Helper method to load data with integrity verification.
     * Supports legacy plain JSON saves by checking for JSON syntax first.
     * @param {string} key - The localStorage key.
     * @param {function} [saltCallback=null] - Optional callback to extract salt from parsed data for verification.
     * @returns {any|null} The parsed data, or null if missing, corrupted, or tampered.
     * @private
     */
    async _load(key, saltCallback = null) {
        const raw = globalThis.localStorage.getItem(key);
        if (!raw) return null;

        // Legacy support: check if it looks like JSON
        if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
            try {
                return JSON.parse(raw);
            } catch (e) {
                console.error(`Failed to parse legacy save for key ${key}:`, e);
                return null;
            }
        }

        const parts = raw.split('|');
        if (parts.length !== 2) {
            console.warn(`Save file corrupted or tampered (invalid format) for key ${key}.`);
            return null;
        }

        const [encoded, hash] = parts;
        let json;
        try {
            json = atob(encoded);
        } catch (e) {
            console.error(`Failed to decode save for key ${key}:`, e);
            return null;
        }

        let data;
        try {
            data = JSON.parse(json);
        } catch (e) {
            console.error(`Failed to parse JSON for key ${key}:`, e);
            return null;
        }

        // Integrity Check
        let salt = "";
        if (saltCallback) {
            salt = saltCallback(data) || "";
        }

        const strToHash = salt ? encoded + salt : encoded;
        const calculatedHash = await this._hash(strToHash);

        if (calculatedHash !== hash) {
            console.warn(`Save file tampered (hash mismatch) for key ${key}.`);
            return null;
        }

        return data;
    }

    /**
     * Secure hash function for integrity checking (SHA-256 via Web Crypto API).
     * @param {string} str - The string to hash.
     * @returns {Promise<string>} The hash value.
     * @private
     */
    async _hash(str) {
        return await CryptoUtils.digest(str);
    }
}
