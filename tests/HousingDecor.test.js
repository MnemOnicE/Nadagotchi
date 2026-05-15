
import { Nadagotchi } from '../js/Nadagotchi.js';
import { InventorySystem } from '../js/systems/InventorySystem.js';
import { ItemDefinitions } from '../js/ItemData.js';
import { PersistenceManager } from '../js/PersistenceManager.js';
import { Config } from '../js/Config.js'; // Import actual Config to spy/mock specific parts

// Mock Config PARTIALLY - preserve structure but allow override
jest.mock('../js/Config.js', () => {
    // We need to return a proper structure matching the real Config
    // especially INITIAL_STATE
    return {
        Config: {
            INITIAL_STATE: {
                STATS: { hunger: 100, energy: 100, happiness: 70 },
                SKILLS: {
                    communication: 1, resilience: 1, navigation: 0,
                    empathy: 0, logic: 0, focus: 0, crafting: 0,
                    research: 0
                },
                PERSONALITY_POINTS_STARTER: 10,
                MOOD_SENSITIVITY_DEFAULT: 5,
                GENOME_STARTER_VAL: 40
            },
            GENETICS: {
                METABOLISM_NORMALIZER: 5,
                HOMOZYGOUS_ENERGY_BONUS: 5
            },
            ACTIONS: {
                CRAFT: { ENERGY_COST: 10, HAPPINESS_PENALTY_MISSING_MATS: 5, HAPPINESS_RESTORE: 5, SKILL_GAIN: 1 },
                FORAGE: { ENERGY_COST: 10, SKILL_GAIN: 1 }
            },
            SECURITY: { DNA_SALT: '' },
            LIMITS: { MAX_STATS: 100, MAX_STATS_BONUS: 105 }
        }
    }
});

// Mock PersistenceManager
jest.mock('../js/PersistenceManager.js', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => ({
            saveHomeConfig: jest.fn(),
            loadJournal: jest.fn().mockReturnValue([]),
            loadRecipes: jest.fn().mockReturnValue([]),
            loadPet: jest.fn().mockReturnValue(null),
            loadSettings: jest.fn().mockReturnValue({}),
            saveRecipes: jest.fn(),
            savePet: jest.fn(),
            saveJournal: jest.fn(), // Added missing mock
        }))
    };
});

// Mock SeededRandom for Nadagotchi constructor
jest.mock('../js/utils/SeededRandom.js', () => {
    return {
        SeededRandom: jest.fn().mockImplementation(() => ({
            random: () => 0.5,
            choice: (arr) => arr[0],
            range: () => 1
        }))
    };
});

describe('Housing Decor System', () => {
    let pet;
    let inventorySystem;

    beforeEach(() => {
        // Need to ensure Config is ready before Nadagotchi uses it.
        // With the mock above, it should be fine.
        pet = new Nadagotchi('Adventurer');

        // Manually inject persistence mock since Nadagotchi creates its own
        pet.persistence = new PersistenceManager();

        // Mock the genome/traits to prevent errors if Nadagotchi constructor tries to access them
        if (!pet.genome) pet.genome = { genotype: {}, phenotype: {} };

        // Mock the NEW room-based homeConfig structure
        pet.homeConfig = {
            rooms: {
                "Entryway": {
                    wallpaper: 'default_key',
                    flooring: 'default_key',
                    wallpaperItem: 'Default',
                    flooringItem: 'Default'
                }
            }
        };
        inventorySystem = new InventorySystem(pet);
        pet.inventorySystem = inventorySystem; // Circular ref for testing
    });

    it('should fail to apply decor if item is not owned', () => {
        pet.inventory = {};
        const result = inventorySystem.applyHomeDecor('Blue Wallpaper');
        expect(result.success).toBe(false);
        expect(result.message).toContain("don't own");
    });

    it('should fail if item is not valid decor', () => {
        pet.inventory = { 'Berries': 1 };
        const result = inventorySystem.applyHomeDecor('Berries');
        expect(result.success).toBe(false);
        expect(result.message).toContain("cannot be used as decor");
    });

    it('should apply wallpaper and remove from inventory', () => {
        pet.inventory = { 'Blue Wallpaper': 1 };

        const result = inventorySystem.applyHomeDecor('Blue Wallpaper');

        expect(result.success).toBe(true);
        expect(result.assetKey).toBe(ItemDefinitions['Blue Wallpaper'].assetKey);
        expect(pet.inventory['Blue Wallpaper']).toBeUndefined(); // Should be removed (0 -> delete)
        expect(pet.homeConfig.rooms.Entryway.wallpaperItem).toBe('Blue Wallpaper');
        expect(pet.persistence.saveHomeConfig).toHaveBeenCalled();
    });

    it('should swap wallpapers correctly', () => {
        // Setup: Current is Blue, Inventory has Cozy
        pet.homeConfig.rooms.Entryway.wallpaperItem = 'Blue Wallpaper';
        pet.homeConfig.rooms.Entryway.wallpaper = ItemDefinitions['Blue Wallpaper'].assetKey;
        pet.inventory = { 'Cozy Wallpaper': 1 };

        // Act: Apply Cozy
        const result = inventorySystem.applyHomeDecor('Cozy Wallpaper');

        // Assert
        expect(result.success).toBe(true);
        expect(pet.homeConfig.rooms.Entryway.wallpaperItem).toBe('Cozy Wallpaper');

        // Cozy removed
        expect(pet.inventory['Cozy Wallpaper']).toBeUndefined();

        // Blue returned
        expect(pet.inventory['Blue Wallpaper']).toBe(1);
    });

    it('should apply flooring correctly', () => {
        pet.inventory = { 'Wood Flooring': 1 };

        const result = inventorySystem.applyHomeDecor('Wood Flooring');

        expect(result.success).toBe(true);
        expect(result.type).toBe('FLOORING');
        expect(pet.homeConfig.rooms.Entryway.flooringItem).toBe('Wood Flooring');
        expect(pet.inventory['Wood Flooring']).toBeUndefined();
    });

    it('should not return "Default" item to inventory', () => {
        // Setup: Current is Default
        pet.homeConfig.rooms.Entryway.wallpaperItem = 'Default';
        pet.inventory = { 'Blue Wallpaper': 1 };

        // Act
        inventorySystem.applyHomeDecor('Blue Wallpaper');

        // Assert
        expect(pet.inventory['Default']).toBeUndefined();
    });
});
