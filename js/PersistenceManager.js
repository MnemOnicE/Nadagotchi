/**
 * @fileoverview Utility class for handling game state persistence via localStorage.
 * Includes mechanisms for data integrity (checksums), legacy support, and specialized save slots (Pet, Hall of Fame, Journal).
 */

/**
 * PersistenceManager handles saving and loading game data.
 * It provides an abstraction layer over `localStorage` with added security features.
 * @class PersistenceManager
 */
export class PersistenceManager {
    /**
     * Saves the active Nadagotchi's data to localStorage.
     * @param {object} nadagotchiData - The Nadagotchi object to save.
     */
    savePet(nadagotchiData) {
        // Pass the UUID as salt to bind the save file to this specific pet instance
        this._save("nadagotchi_save", nadagotchiData, nadagotchiData.uuid);
    }

    /**
     * Loads the active Nadagotchi's data from localStorage.
     * @returns {object|null} The parsed Nadagotchi data, or null if no save exists or data is corrupted.
     */
    loadPet() {
        // Provide a callback to extract the UUID from the parsed data for hash verification
        return this._load("nadagotchi_save", (data) => data.uuid);
    }

    /**
     * Adds a retired Nadagotchi to the "Hall of Fame" in localStorage.
     * @param {object} nadagotchiData - The data of the pet to retire.
     */
    saveToHallOfFame(nadagotchiData) {
        const fameList = this.loadHallOfFame();
        fameList.push(nadagotchiData);
        this._save("hall_of_fame", fameList);
    }

    /**
     * Retrieves the list of all retired pets from the Hall of Fame.
     * @returns {Array<object>} An array of retired Nadagotchi data objects.
     */
    loadHallOfFame() {
        return this._load("hall_of_fame") || [];
    }

    /**
     * Clears the save data for the active pet.
     * This is typically used when a pet is retired to allow starting a new generation.
     */
    clearActivePet() {
        localStorage.removeItem("nadagotchi_save");
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
            "nadagotchi_furniture"
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Saves the player's journal entries to localStorage.
     * @param {Array<object>} journalEntries - The array of journal entries to save.
     */
    saveJournal(journalEntries) {
        this._save("nadagotchi_journal", journalEntries);
    }

    /**
     * Loads the player's journal entries from localStorage.
     * @returns {Array<object>} The array of journal entries, or empty array if none found.
     */
    loadJournal() {
        return this._load("nadagotchi_journal") || [];
    }

    /**
     * Saves the list of discovered recipes to localStorage.
     * @param {Array<string>} recipeList - The array of discovered recipe names.
     */
    saveRecipes(recipeList) {
        this._save("nadagotchi_recipes", recipeList);
    }

    /**
     * Loads the list of discovered recipes from localStorage.
     * @returns {Array<string>} The array of discovered recipe names, or empty array if none found.
     */
    loadRecipes() {
        return this._load("nadagotchi_recipes") || [];
    }

    /**
     * Saves the game's calendar data to localStorage.
     * @param {object} calendarData - The Calendar object to save.
     */
    saveCalendar(calendarData) {
        this._save("nadagotchi_calendar", calendarData);
    }

    /**
     * Loads the game's calendar data from localStorage.
     * @returns {object|null} The parsed calendar data, or null if no save exists.
     */
    loadCalendar() {
        return this._load("nadagotchi_calendar");
    }

    /**
     * Saves the placed furniture data to localStorage.
     * @param {Array<object>} furnitureData - The array of placed furniture objects.
     */
    saveFurniture(furnitureData) {
        this._save("nadagotchi_furniture", furnitureData);
    }

    /**
     * Loads the placed furniture data from localStorage.
     * @returns {Array<object>|null} The array of placed furniture objects, or null if no save exists.
     */
    loadFurniture() {
        return this._load("nadagotchi_furniture");
    }

    /**
     * Saves the global game settings to localStorage.
     * @param {object} settings - The settings object to save.
     */
    saveSettings(settings) {
        this._save("nadagotchi_settings", settings);
    }

    /**
     * Loads the global game settings from localStorage.
     * @returns {object|null} The parsed settings, or null if no save exists.
     */
    loadSettings() {
        return this._load("nadagotchi_settings");
    }

    /**
     * Helper method to save data with simple obfuscation (Base64) and an integrity check (Hash).
     * @param {string} key - The localStorage key.
     * @param {any} data - The data to save.
     * @param {string} [salt=null] - Optional salt (e.g., UUID) to bind the hash to the data content.
     * @private
     */
    _save(key, data, salt = null) {
        try {
            const json = JSON.stringify(data);
            const encoded = btoa(json);
            const strToHash = salt ? encoded + salt : encoded;
            const hash = this._hash(strToHash);
            localStorage.setItem(key, `${encoded}|${hash}`);
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
    _load(key, saltCallback = null) {
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
        if (this._hash(strToHash) !== hash) {
            console.warn(`Save file tampered (hash mismatch) for key ${key}.`);
            return null;
        }

        return data;
    }

    /**
     * Simple hash function for integrity checking (DJB2 variant).
     * @param {string} str - The string to hash.
     * @returns {string} The hash value.
     * @private
     */
    _hash(str) {
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
