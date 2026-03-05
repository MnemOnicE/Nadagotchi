/**
 * @fileoverview Utility class for handling game state persistence via localStorage.
 * Includes mechanisms for data integrity (checksums), legacy support, and specialized save slots (Pet, Hall of Fame, Journal).
 */

import { toBase64, fromBase64 } from './utils/Encoding.js';
<<<<<<< HEAD
import { CryptoUtils } from './utils/CryptoUtils.js';
=======
>>>>>>> 74fdaab (Update js/DebugConsole.js)

/**
 * PersistenceManager handles saving and loading game data.
 * It provides an abstraction layer over `localStorage` with added security features.
 * @class PersistenceManager
 */
export class PersistenceManager {
    constructor() {
        /** @type {Object.<string, string>} Cache of the last saved JSON strings to prevent redundant writes. */
        this.lastSavedJson = {};
        /** @type {?number} ID of the pending save timer/callback. */
        this._saveTimer = null;
        /** @type {boolean} Whether the pending timer is an idle callback. */
        this._isIdleCallback = false;
    }

    /**
     * Saves the active Nadagotchi's data to localStorage.
     * Uses a non-blocking scheduling mechanism to avoid frame drops.
     * @param {object} nadagotchiData - The Nadagotchi object to save.
     * @param {object} [homeConfig=null] - DEPRECATED: The home configuration object. Now part of nadagotchiData.
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async savePet(nadagotchiData, homeConfig = null) {
=======
     */
    savePet(nadagotchiData, homeConfig = null) {
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        // Merge homeConfig into the save payload if provided as a separate argument (Legacy support)
        const payload = { ...nadagotchiData };
        if (homeConfig) {
            payload.homeConfig = homeConfig;
        }

        // Pass the UUID as salt to bind the save file to this specific pet instance
        this._scheduleSave("nadagotchi_save", payload, payload.uuid);
    }

    /**
     * Schedules a save operation to run during idle time or after a short delay.
     * This debounces rapid calls and moves execution off the critical path.
     * @param {string} key - Storage key.
     * @param {object} data - Data to save.
     * @param {string} salt - Salt for hashing.
     * @private
     */
    _scheduleSave(key, data, salt) {
        if (this._saveTimer) {
            if (this._isIdleCallback && typeof cancelIdleCallback !== 'undefined') {
                cancelIdleCallback(this._saveTimer);
            } else {
                clearTimeout(this._saveTimer);
            }
        }

<<<<<<< HEAD
        const task = async () => {
            this._saveTimer = null;
            await this._save(key, data, salt);
=======
        const task = () => {
            this._saveTimer = null;
            this._save(key, data, salt);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        };

        if (typeof requestIdleCallback !== 'undefined') {
            this._isIdleCallback = true;
            // Schedule with a timeout fallback to ensure it eventually runs
            this._saveTimer = requestIdleCallback(task, { timeout: 2000 });
        } else {
            this._isIdleCallback = false;
            // Fallback for environments without requestIdleCallback (e.g. Node/Jest without polyfill)
            this._saveTimer = setTimeout(task, 200);
        }
    }

    /**
     * Loads the active Nadagotchi's data from localStorage.
<<<<<<< HEAD
     * @returns {Promise<object|null>} The parsed Nadagotchi data, or null if no save exists or data is corrupted.
     */
    async loadPet() {
        // Provide a callback to extract the UUID from the parsed data for hash verification
        return await this._load("nadagotchi_save", (data) => data.uuid);
=======
     * @returns {object|null} The parsed Nadagotchi data, or null if no save exists or data is corrupted.
     */
    loadPet() {
        // Provide a callback to extract the UUID from the parsed data for hash verification
        return this._load("nadagotchi_save", (data) => data.uuid);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Adds a retired Nadagotchi to the "Hall of Fame" in localStorage.
     * @param {object} nadagotchiData - The data of the pet to retire.
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveToHallOfFame(nadagotchiData) {
        const fameList = await this.loadHallOfFame();
        fameList.push(nadagotchiData);
        await this._save("hall_of_fame", fameList);
=======
     */
    saveToHallOfFame(nadagotchiData) {
        const fameList = this.loadHallOfFame();
        fameList.push(nadagotchiData);
        this._save("hall_of_fame", fameList);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Retrieves the list of all retired pets from the Hall of Fame.
<<<<<<< HEAD
     * @returns {Promise<Array<object>>} An array of retired Nadagotchi data objects.
     */
    async loadHallOfFame() {
        return (await this._load("hall_of_fame")) || [];
=======
     * @returns {Array<object>} An array of retired Nadagotchi data objects.
     */
    loadHallOfFame() {
        return this._load("hall_of_fame") || [];
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Clears the save data for the active pet.
     * This is typically used when a pet is retired to allow starting a new generation.
     */
    clearActivePet() {
        // Cancel any pending save to prevent resurrection
        if (this._saveTimer) {
             if (this._isIdleCallback && typeof cancelIdleCallback !== 'undefined') {
                  cancelIdleCallback(this._saveTimer);
             } else {
                  clearTimeout(this._saveTimer);
             }
             this._saveTimer = null;
        }
        localStorage.removeItem("nadagotchi_save");
        delete this.lastSavedJson["nadagotchi_save"];
    }

    /**
     * Clears all game-related data from localStorage (except settings and hall of fame).
     * Used for starting a completely new game.
     */
    clearAllData() {
        // Cancel any pending save
        if (this._saveTimer) {
             if (this._isIdleCallback && typeof cancelIdleCallback !== 'undefined') {
                  cancelIdleCallback(this._saveTimer);
             } else {
                  clearTimeout(this._saveTimer);
             }
             this._saveTimer = null;
        }

        const keysToClear = [
            "nadagotchi_save",
            "nadagotchi_journal",
            "nadagotchi_recipes",
            "nadagotchi_calendar",
            "nadagotchi_furniture",
            "nadagotchi_home_config"
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Saves the player's journal entries to localStorage.
     * @param {Array<object>} journalEntries - The array of journal entries to save.
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveJournal(journalEntries) {
        await this._save("nadagotchi_journal", journalEntries);
=======
     */
    saveJournal(journalEntries) {
        this._save("nadagotchi_journal", journalEntries);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the player's journal entries from localStorage.
<<<<<<< HEAD
     * @returns {Promise<Array<object>>} The array of journal entries, or empty array if none found.
     */
    async loadJournal() {
        return (await this._load("nadagotchi_journal")) || [];
=======
     * @returns {Array<object>} The array of journal entries, or empty array if none found.
     */
    loadJournal() {
        return this._load("nadagotchi_journal") || [];
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Saves the list of discovered recipes to localStorage.
     * @param {Array<string>} recipeList - The array of discovered recipe names.
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveRecipes(recipeList) {
        await this._save("nadagotchi_recipes", recipeList);
=======
     */
    saveRecipes(recipeList) {
        this._save("nadagotchi_recipes", recipeList);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the list of discovered recipes from localStorage.
<<<<<<< HEAD
     * @returns {Promise<Array<string>>} The array of discovered recipe names, or empty array if none found.
     */
    async loadRecipes() {
        return (await this._load("nadagotchi_recipes")) || [];
=======
     * @returns {Array<string>} The array of discovered recipe names, or empty array if none found.
     */
    loadRecipes() {
        return this._load("nadagotchi_recipes") || [];
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Saves the game's calendar data to localStorage.
     * @param {object} calendarData - The Calendar object to save.
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveCalendar(calendarData) {
        await this._save("nadagotchi_calendar", calendarData);
=======
     */
    saveCalendar(calendarData) {
        this._save("nadagotchi_calendar", calendarData);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the game's calendar data from localStorage.
<<<<<<< HEAD
     * @returns {Promise<object|null>} The parsed calendar data, or null if no save exists.
     */
    async loadCalendar() {
        return await this._load("nadagotchi_calendar");
=======
     * @returns {object|null} The parsed calendar data, or null if no save exists.
     */
    loadCalendar() {
        return this._load("nadagotchi_calendar");
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Saves the placed furniture data to localStorage.
     * @param {object} furnitureData - The furniture object keyed by room ID.
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveFurniture(furnitureData) {
        await this._save("nadagotchi_furniture", furnitureData);
=======
     */
    saveFurniture(furnitureData) {
        this._save("nadagotchi_furniture", furnitureData);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the placed furniture data from localStorage.
     * Supports migration from legacy array format to room-keyed object.
<<<<<<< HEAD
     * @returns {Promise<object>} The furniture object keyed by room ID (e.g., { "Entryway": [] }).
     */
    async loadFurniture() {
        const data = await this._load("nadagotchi_furniture");
=======
     * @returns {object} The furniture object keyed by room ID (e.g., { "Entryway": [] }).
     */
    loadFurniture() {
        const data = this._load("nadagotchi_furniture");
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        if (!data) return { "Entryway": [] }; // Default empty state

        // Migration: If data is an Array (Legacy), wrap it in Entryway
        if (Array.isArray(data)) {
<<<<<<< HEAD
=======
            console.log("Migrating legacy furniture data to Entryway...");
>>>>>>> 74fdaab (Update js/DebugConsole.js)
            return { "Entryway": data };
        }

        return data;
    }

    /**
     * Saves the home configuration (Wallpaper/Flooring).
     * @deprecated Home Config is now stored in the pet data.
     * @param {object} config - { rooms: { "Entryway": { ... } } }
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveHomeConfig(config) {
        await this._save("nadagotchi_home_config", config);
=======
     */
    saveHomeConfig(config) {
        this._save("nadagotchi_home_config", config);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the home configuration.
     * Supports migration from legacy flat format to room-keyed object.
     * @deprecated Home Config is now loaded via loadPet(). Use for migration only.
<<<<<<< HEAD
     * @returns {Promise<object>} { rooms: { "Entryway": { ... } } }
     */
    async loadHomeConfig() {
        const data = await this._load("nadagotchi_home_config");
=======
     * @returns {object} { rooms: { "Entryway": { ... } } }
     */
    loadHomeConfig() {
        const data = this._load("nadagotchi_home_config");
>>>>>>> 74fdaab (Update js/DebugConsole.js)

        // Default State
        const defaultState = {
            rooms: {
                "Entryway": { wallpaper: 'wallpaper_default', flooring: 'flooring_default', wallpaperItem: 'Default', flooringItem: 'Default' }
            }
        };

        if (!data) return defaultState;

        // Migration: If data has 'wallpaper' at root level (Legacy)
        if (data.wallpaper || data.flooring) {
<<<<<<< HEAD
=======
            console.log("Migrating legacy home config to Entryway...");
>>>>>>> 74fdaab (Update js/DebugConsole.js)
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
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        await this._save("nadagotchi_settings", settings);
=======
     */
    saveSettings(settings) {
        this._save("nadagotchi_settings", settings);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the global game settings from localStorage.
<<<<<<< HEAD
     * @returns {Promise<object|null>} The parsed settings, or null if no save exists.
     */
    async loadSettings() {
        return await this._load("nadagotchi_settings");
=======
     * @returns {object|null} The parsed settings, or null if no save exists.
     */
    loadSettings() {
        return this._load("nadagotchi_settings");
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Saves the achievement progress to localStorage.
     * @param {object} achievementData - The achievement data (unlocked list + progress).
<<<<<<< HEAD
     * @returns {Promise<void>}
     */
    async saveAchievements(achievementData) {
        await this._save("nadagotchi_achievements", achievementData);
=======
     */
    saveAchievements(achievementData) {
        this._save("nadagotchi_achievements", achievementData);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Loads the achievement progress from localStorage.
<<<<<<< HEAD
     * @returns {Promise<object>} The parsed achievement data, or default structure.
     */
    async loadAchievements() {
        return (await this._load("nadagotchi_achievements")) || { unlocked: [], progress: {} };
    }

    /**
     * Helper method to save data with simple obfuscation (Base64) and a secure integrity check (SHA-256).
=======
     * @returns {object} The parsed achievement data, or default structure.
     */
    loadAchievements() {
        return this._load("nadagotchi_achievements") || { unlocked: [], progress: {} };
    }

    /**
     * Helper method to save data with simple obfuscation (Base64) and an integrity check (Hash).
>>>>>>> 74fdaab (Update js/DebugConsole.js)
     * @param {string} key - The localStorage key.
     * @param {any} data - The data to save.
     * @param {string} [salt=null] - Optional salt (e.g., UUID) to bind the hash to the data content.
     * @private
     */
<<<<<<< HEAD
    async _save(key, data, salt = null) {
=======
    _save(key, data, salt = null) {
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        try {
            const json = JSON.stringify(data);

            // OPTIMIZATION: Skip save if data hasn't changed
            if (this.lastSavedJson[key] === json) {
                return;
            }

            const encoded = toBase64(json);
            const strToHash = salt ? encoded + salt : encoded;
<<<<<<< HEAD

            // Generate SHA-256 hash
            const hash = await CryptoUtils.generateHash(strToHash, ""); // Salt is already in strToHash if provided

=======
            const hash = this._hash(strToHash);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
            localStorage.setItem(key, `${encoded}|${hash}`);

            // Update cache
            this.lastSavedJson[key] = json;
        } catch (e) {
            console.error(`Failed to save data for key ${key}:`, e);
        }
    }

    /**
     * Helper method to load data with integrity verification.
<<<<<<< HEAD
     * Supports legacy plain JSON saves and legacy DJB2 hashes for migration.
     * @param {string} key - The localStorage key.
     * @param {function} [saltCallback=null] - Optional callback to extract salt from parsed data for verification.
     * @returns {Promise<any|null>} The parsed data, or null if missing, corrupted, or tampered.
     * @private
     */
    async _load(key, saltCallback = null) {
=======
     * Supports legacy plain JSON saves by checking for JSON syntax first.
     * @param {string} key - The localStorage key.
     * @param {function} [saltCallback=null] - Optional callback to extract salt from parsed data for verification.
     * @returns {any|null} The parsed data, or null if missing, corrupted, or tampered.
     * @private
     */
    _load(key, saltCallback = null) {
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        const raw = localStorage.getItem(key);
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
            json = fromBase64(encoded);
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
<<<<<<< HEAD

        // Check 1: Secure SHA-256 (64 hex characters)
        if (/^[0-9a-f]{64}$/i.test(hash)) {
             const expectedHash = await CryptoUtils.generateHash(strToHash, "");
             if (expectedHash !== hash) {
                 console.warn(`Save file tampered (SHA-256 hash mismatch) for key ${key}.`);
                 return null;
             }
        }
        // Check 2: Legacy DJB2 (Numeric string)
        else {
             const expectedLegacyHash = this._hashLegacy(strToHash);
             if (expectedLegacyHash !== hash) {
                 console.warn(`Save file tampered (Legacy hash mismatch) for key ${key}.`);
                 return null;
             }
             // Valid legacy save: We should upgrade it on next save (automatic via _save)
=======
        if (this._hash(strToHash) !== hash) {
            console.warn(`Save file tampered (hash mismatch) for key ${key}.`);
            return null;
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        }

        return data;
    }

    /**
<<<<<<< HEAD
     * Legacy hash function for integrity checking (DJB2 variant).
     * Kept for backwards compatibility to verify old saves before upgrading.
=======
     * Simple hash function for integrity checking (DJB2 variant).
>>>>>>> 74fdaab (Update js/DebugConsole.js)
     * @param {string} str - The string to hash.
     * @returns {string} The hash value.
     * @private
     */
<<<<<<< HEAD
    _hashLegacy(str) {
=======
    _hash(str) {
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }
}
