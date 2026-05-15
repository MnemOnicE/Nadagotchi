import { WikiSystem } from '../js/WikiSystem.js';

describe('WikiSystem', () => {
    let mockPersistence;
    let wikiSystem;

    beforeEach(() => {
        mockPersistence = {
            _load: jest.fn(),
            _save: jest.fn()
        };
        wikiSystem = new WikiSystem(mockPersistence);
    });

    test('should initialize correctly', () => {
        expect(wikiSystem.isReady).toBe(false);
        expect(wikiSystem.categories).toEqual(["pets", "items", "careers", "locations", "mechanics"]);
        expect(wikiSystem.entries).toEqual({});
    });

    test('should load existing data from persistence', async () => {
        const mockData = {
            entries: {
                pets: ["Slime"],
                items: ["Apple"],
                careers: ["Chef"]
            }
        };
        mockPersistence._load.mockResolvedValue(mockData);

        await wikiSystem.init();

        expect(mockPersistence._load).toHaveBeenCalledWith("nadagotchi_wiki");
        expect(wikiSystem.entries.pets).toEqual(["Slime"]);
        expect(wikiSystem.entries.items).toEqual(["Apple"]);
        expect(wikiSystem.entries.careers).toEqual(["Chef"]);

        // Ensure all categories exist even if not in loaded data
        expect(wikiSystem.entries.locations).toEqual([]);
        expect(wikiSystem.entries.mechanics).toEqual([]);
        expect(wikiSystem.isReady).toBe(true);
    });

    test('should initialize empty entries if no data exists', async () => {
        mockPersistence._load.mockResolvedValue(null);

        await wikiSystem.init();

        expect(mockPersistence._load).toHaveBeenCalledWith("nadagotchi_wiki");
        expect(wikiSystem.entries.pets).toEqual([]);
        expect(wikiSystem.entries.items).toEqual([]);
        expect(mockPersistence._save).toHaveBeenCalledWith("nadagotchi_wiki", { entries: wikiSystem.entries });
        expect(wikiSystem.isReady).toBe(true);
    });

    test('should handle missing entries object in loaded data', async () => {
        mockPersistence._load.mockResolvedValue({}); // Data object returned but no entries property

        await wikiSystem.init();

        expect(wikiSystem.entries.pets).toEqual([]);
        expect(wikiSystem.entries.items).toEqual([]);
        expect(wikiSystem.isReady).toBe(true);
    });

    test('init without persistence should not throw and initialize empty', async () => {
        wikiSystem = new WikiSystem(null);
        await wikiSystem.init();
        expect(wikiSystem.entries.pets).toEqual([]);
        expect(wikiSystem.isReady).toBe(true);
    });

    test('unlockEntry should add new entry and save', async () => {
        await wikiSystem.init(); // Initialize empty

        const unlocked = await wikiSystem.unlockEntry("pets", "Dragon");

        expect(unlocked).toBe(true);
        expect(wikiSystem.entries.pets).toContain("Dragon");
        expect(mockPersistence._save).toHaveBeenCalledWith("nadagotchi_wiki", { entries: wikiSystem.entries });
    });

    test('unlockEntry should not add duplicate entry', async () => {
        await wikiSystem.init();
        await wikiSystem.unlockEntry("pets", "Dragon");

        // Reset save mock to check if it's called again
        mockPersistence._save.mockClear();

        const unlocked = await wikiSystem.unlockEntry("pets", "Dragon");

        expect(unlocked).toBe(false);
        expect(wikiSystem.entries.pets).toEqual(["Dragon"]); // Still only one
        expect(mockPersistence._save).not.toHaveBeenCalled();
    });

    test('unlockEntry should reject invalid category', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        await wikiSystem.init();
        mockPersistence._save.mockClear(); // Clear save from init()

        const unlocked = await wikiSystem.unlockEntry("invalid_cat", "ItemX");

        expect(unlocked).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid wiki category: invalid_cat");
        expect(mockPersistence._save).not.toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
    });

    test('hasEntry should return true if entry exists', async () => {
        await wikiSystem.init();
        await wikiSystem.unlockEntry("items", "Sword");

        expect(wikiSystem.hasEntry("items", "Sword")).toBe(true);
    });

    test('hasEntry should return false if entry does not exist', async () => {
        await wikiSystem.init();

        expect(wikiSystem.hasEntry("items", "Shield")).toBe(false);
        // Also check if category is somehow missing completely
        expect(wikiSystem.hasEntry("nonexistent", "Item")).toBe(false);
    });

    test('getEntries should return array of entries for category', async () => {
        await wikiSystem.init();
        await wikiSystem.unlockEntry("locations", "Cave");
        await wikiSystem.unlockEntry("locations", "Forest");

        const locations = wikiSystem.getEntries("locations");
        expect(locations).toEqual(["Cave", "Forest"]);
    });

    test('getEntries should return empty array for non-existent category', async () => {
        await wikiSystem.init();

        const result = wikiSystem.getEntries("invalid");
        expect(result).toEqual([]);
    });
});
