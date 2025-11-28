/**
 * PersistenceManager is a utility class for handling game state saving and loading via localStorage.
 * This allows the game to remember the pet's state, retired pets, and other meta-game data across browser sessions.
 */
export class PersistenceManager {
    /**
     * Saves the active Nadagotchi's data to localStorage.
     * @param {object} nadagotchiData - The Nadagotchi object to save.
     */
    savePet(nadagotchiData) {
        this._save("nadagotchi_save", nadagotchiData);
    }

    /**
     * Loads the active Nadagotchi's data from localStorage.
     * @returns {object|null} The parsed Nadagotchi data, or null if no save exists.
     */
    loadPet() {
        return this._load("nadagotchi_save");
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
     * Clears the save data for the active pet. This is used when a pet is retired
     * to make way for the next generation.
     */
    clearActivePet() {
        localStorage.removeItem("nadagotchi_save");
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
     * @returns {Array<object>} The array of journal entries.
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
     * @returns {Array<string>} The array of discovered recipe names.
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
     * Helper method to save data with obfuscation and integrity check.
     * @param {string} key - The localStorage key.
     * @param {any} data - The data to save.
     * @private
     */
    _save(key, data) {
        try {
            const json = JSON.stringify(data);
            const encoded = btoa(json);
            const hash = this._hash(encoded);
            localStorage.setItem(key, `${encoded}|${hash}`);
        } catch (e) {
            console.error(`Failed to save data for key ${key}:`, e);
        }
    }

    /**
     * Helper method to load data with integrity verification.
     * Supports legacy plain JSON saves.
     * @param {string} key - The localStorage key.
     * @returns {any|null} The parsed data, or null if missing/tampered.
     * @private
     */
    _load(key) {
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
        if (this._hash(encoded) !== hash) {
            console.warn(`Save file tampered (hash mismatch) for key ${key}.`);
            return null;
        }

        try {
            const json = atob(encoded);
            return JSON.parse(json);
        } catch (e) {
            console.error(`Failed to decode save for key ${key}:`, e);
            return null;
        }
    }

    /**
     * Simple hash function for integrity checking.
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
