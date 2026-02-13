/**
 * @fileoverview Utility class for handling game state persistence via localStorage.
 * Includes mechanisms for data integrity (checksums), legacy support, and specialized save slots (Pet, Hall of Fame, Journal).
 */

import { Config } from './Config.js';
import { encrypt, decrypt, hmacSha256 } from './utils/CryptoUtils.js';

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
    savePet(nadagotchiData, homeConfig = null) {
        // Merge homeConfig into the save payload if provided as a separate argument (Legacy support)
        const payload = { ...nadagotchiData };
        if (homeConfig) {
            payload.homeConfig = homeConfig;
        }

        // Pass the UUID as salt to bind the save file to this specific pet instance
        // Note: In v1 secure save, the UUID is encrypted within the payload, so extra salt is less critical for binding,
        // but we verify it on load if possible.
        this._save("nadagotchi_save", payload, payload.uuid);
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
            "nadagotchi_furniture",
            "nadagotchi_home_config"
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
     * @param {object} furnitureData - The furniture object keyed by room ID.
     */
    saveFurniture(furnitureData) {
        this._save("nadagotchi_furniture", furnitureData);
    }

    /**
     * Loads the placed furniture data from localStorage.
     * Supports migration from legacy array format to room-keyed object.
     * @returns {object} The furniture object keyed by room ID (e.g., { "Entryway": [] }).
     */
    loadFurniture() {
        const data = this._load("nadagotchi_furniture");
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
    saveHomeConfig(config) {
        this._save("nadagotchi_home_config", config);
    }

    /**
     * Loads the home configuration.
     * Supports migration from legacy flat format to room-keyed object.
     * @deprecated Home Config is now loaded via loadPet(). Use for migration only.
     * @returns {object} { rooms: { "Entryway": { ... } } }
     */
    loadHomeConfig() {
        const data = this._load("nadagotchi_home_config");

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
     * Saves the achievement progress to localStorage.
     * @param {object} achievementData - The achievement data (unlocked list + progress).
     */
    saveAchievements(achievementData) {
        this._save("nadagotchi_achievements", achievementData);
    }

    /**
     * Loads the achievement progress from localStorage.
     * @returns {object} The parsed achievement data, or default structure.
     */
    loadAchievements() {
        return this._load("nadagotchi_achievements") || { unlocked: [], progress: {} };
    }

    /**
     * Securely saves data to localStorage using HMAC-SHA256 and stream encryption.
     * @param {string} key - The localStorage key.
     * @param {any} data - The data to save.
     * @param {string} [extraSalt=null] - Optional extra salt (e.g., UUID) for legacy binding, ignored for key derivation in v1 to allow decryption.
     * @private
     */
    _save(key, data, extraSalt = null) {
        try {
            const json = JSON.stringify(data);

            // Generate a random 16-byte file salt
            const fileSaltBytes = new Uint8Array(16);
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                crypto.getRandomValues(fileSaltBytes);
            } else {
                // In modern environments (Browser, Node.js > 19, JSDOM), crypto is available.
                // We deliberately fail rather than fallback to insecure Math.random() to satisfy security audits.
                console.error("Secure Persistence: 'crypto.getRandomValues' not available.");
                return;
            }
            const fileSalt = Array.from(fileSaltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

            // Derive Key: Global Secret + File Salt
            // We intentionally do NOT use extraSalt here because we can't extract it from the encrypted blob during load
            // without the key itself. The security is guaranteed by the Secret.
            const secret = Config.SECURITY.DNA_SALT || "DEVELOPMENT_ONLY_SALT";
            const compositeKey = secret + fileSalt;

            // Encrypt
            const ciphertext = encrypt(json, compositeKey);

            // HMAC
            const hmac = hmacSha256(compositeKey, ciphertext);

            // Format: v1|fileSalt|ciphertext|hmac
            localStorage.setItem(key, `v1|${fileSalt}|${ciphertext}|${hmac}`);

        } catch (e) {
            console.error(`Failed to save data for key ${key}:`, e);
        }
    }

    /**
     * Loads data with integrity verification and support for legacy formats.
     * @param {string} key - The localStorage key.
     * @param {function} [saltCallback=null] - Callback to extract extra salt (e.g. UUID) from parsed data.
     * @returns {any|null} The parsed data, or null if invalid.
     * @private
     */
    _load(key, saltCallback = null) {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        // V1 Secure Format Check
        if (raw.startsWith('v1|')) {
            try {
                const parts = raw.split('|');
                if (parts.length !== 4) {
                    console.warn(`Corrupted v1 save file for key ${key}.`);
                    return null;
                }

                const [_, fileSalt, ciphertext, storedHmac] = parts;

                const secret = Config.SECURITY.DNA_SALT || "DEVELOPMENT_ONLY_SALT";
                const encryptionKey = secret + fileSalt;

                // Integrity Check
                const calcedHmac = hmacSha256(encryptionKey, ciphertext);
                if (calcedHmac !== storedHmac) {
                    console.warn(`Save file tampered (HMAC mismatch) for key ${key}.`);
                    return null;
                }

                // Decrypt
                const json = decrypt(ciphertext, encryptionKey);
                let data;
                try {
                    data = JSON.parse(json);
                } catch (e) {
                    console.error(`Failed to parse decrypted JSON for key ${key}.`, e);
                    return null;
                }

                // Note: We don't verify saltCallback here because the UUID is internal to the encrypted payload
                // and thus protected by the encryption/HMAC.

                return data;

            } catch (e) {
                console.error(`Failed to load v1 save for key ${key}:`, e);
                return null;
            }
        }

        // Legacy: check if it looks like JSON
        if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
            try {
                return JSON.parse(raw);
            } catch (e) {
                console.error(`Failed to parse legacy save for key ${key}:`, e);
                return null;
            }
        }

        // Legacy: Base64|Hash
        const parts = raw.split('|');
        if (parts.length === 2) {
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

        console.warn(`Unknown save format for key ${key}.`);
        return null;
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
