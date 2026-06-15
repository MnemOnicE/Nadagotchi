import { WikiSystem } from '../js/WikiSystem.js';

describe('WikiSystem', () => {
    let wikiSystem;
    let mockPersistenceManager;

    beforeEach(() => {
        mockPersistenceManager = {
            _load: jest.fn(),
            _save: jest.fn()
        };
        wikiSystem = new WikiSystem(mockPersistenceManager);

        // Suppress console.warn for cleaner test output
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default state', () => {
            expect(wikiSystem.persistence).toBe(mockPersistenceManager);
            expect(wikiSystem.entries).toEqual({});
            expect(wikiSystem.categories).toEqual(["pets", "items", "careers", "locations", "mechanics"]);
            expect(wikiSystem.isReady).toBe(false);
        });
    });

    describe('init', () => {
        it('should call load and set isReady to true', async () => {
            const loadSpy = jest.spyOn(wikiSystem, 'load').mockResolvedValue();
            await wikiSystem.init();
            expect(loadSpy).toHaveBeenCalled();
            expect(wikiSystem.isReady).toBe(true);
        });
    });

    describe('load', () => {
        it('should load data from persistence and ensure all categories exist', async () => {
            const savedData = {
                entries: {
                    pets: ["Slime"],
                    items: ["Apple"]
                }
            };
            mockPersistenceManager._load.mockResolvedValue(savedData);

            await wikiSystem.load();

            expect(mockPersistenceManager._load).toHaveBeenCalledWith('nadagotchi_wiki');
            expect(wikiSystem.entries.pets).toEqual(["Slime"]);
            expect(wikiSystem.entries.items).toEqual(["Apple"]);
            expect(wikiSystem.entries.careers).toEqual([]); // ensured
            expect(wikiSystem.entries.locations).toEqual([]); // ensured
            expect(wikiSystem.entries.mechanics).toEqual([]); // ensured
        });

        it('should initialize empty categories and save if no data exists', async () => {
            mockPersistenceManager._load.mockResolvedValue(null);
            const saveSpy = jest.spyOn(wikiSystem, 'save').mockResolvedValue();

            await wikiSystem.load();

            expect(mockPersistenceManager._load).toHaveBeenCalledWith('nadagotchi_wiki');
            expect(wikiSystem.entries.pets).toEqual([]);
            expect(wikiSystem.entries.items).toEqual([]);
            expect(wikiSystem.entries.careers).toEqual([]);
            expect(wikiSystem.entries.locations).toEqual([]);
            expect(wikiSystem.entries.mechanics).toEqual([]);
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should handle missing persistence gracefully', async () => {
            wikiSystem = new WikiSystem(null);
            const saveSpy = jest.spyOn(wikiSystem, 'save').mockResolvedValue();

            await wikiSystem.load();

            expect(wikiSystem.entries.pets).toEqual([]);
            expect(saveSpy).toHaveBeenCalled();
        });
    });

    describe('save', () => {
        it('should save data via persistence', async () => {
            wikiSystem.entries = { pets: ["Slime"] };
            await wikiSystem.save();
            expect(mockPersistenceManager._save).toHaveBeenCalledWith('nadagotchi_wiki', { entries: { pets: ["Slime"] } });
        });

        it('should not throw if persistence is missing', async () => {
            wikiSystem = new WikiSystem(null);
            await expect(wikiSystem.save()).resolves.toBeUndefined();
        });

        it('should not throw if persistence._save is missing', async () => {
            wikiSystem = new WikiSystem({});
            await expect(wikiSystem.save()).resolves.toBeUndefined();
        });
    });

    describe('unlockEntry', () => {
        beforeEach(() => {
            wikiSystem.entries = {
                pets: ["Slime"],
                items: []
            };
        });

        it('should return false and warn for invalid category', async () => {
            const result = await wikiSystem.unlockEntry('invalid_category', 'entry1');
            expect(result).toBe(false);
            expect(console.warn).toHaveBeenCalledWith('Invalid wiki category: invalid_category');
        });

        it('should add entry, save, and return true for new entry', async () => {
            const saveSpy = jest.spyOn(wikiSystem, 'save').mockResolvedValue();
            const result = await wikiSystem.unlockEntry('pets', 'Robot');

            expect(result).toBe(true);
            expect(wikiSystem.entries.pets).toContain('Robot');
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should return false for already unlocked entry', async () => {
            const saveSpy = jest.spyOn(wikiSystem, 'save').mockResolvedValue();
            const result = await wikiSystem.unlockEntry('pets', 'Slime');

            expect(result).toBe(false);
            expect(saveSpy).not.toHaveBeenCalled();
            expect(wikiSystem.entries.pets.length).toBe(1); // Still only 1 Slime
        });
    });

    describe('hasEntry', () => {
        beforeEach(() => {
            wikiSystem.entries = {
                pets: ["Slime"],
                items: []
            };
        });

        it('should return true if entry exists in category', () => {
            expect(wikiSystem.hasEntry('pets', 'Slime')).toBe(true);
        });

        it('should return false if entry does not exist in category', () => {
            expect(wikiSystem.hasEntry('pets', 'Robot')).toBe(false);
        });

        it('should return falsy if category does not exist', () => {
            expect(wikiSystem.hasEntry('invalid_category', 'Slime')).toBeFalsy();
        });
    });

    describe('getEntries', () => {
        beforeEach(() => {
            wikiSystem.entries = {
                pets: ["Slime"],
                items: []
            };
        });

        it('should return entries for category', () => {
            expect(wikiSystem.getEntries('pets')).toEqual(["Slime"]);
            expect(wikiSystem.getEntries('items')).toEqual([]);
        });

        it('should return empty array for invalid/missing category', () => {
            expect(wikiSystem.getEntries('invalid_category')).toEqual([]);
        });
    });
});
