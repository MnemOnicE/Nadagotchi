
import { InventorySystem } from '../js/systems/InventorySystem.js';
import { ItemDefinitions } from '../js/ItemData.js';

// Mock Config to avoid runtime errors
jest.mock('../js/Config.js', () => ({
    Config: {
        SECURITY: { DNA_SALT: 'test_salt' },
        ACTIONS: {
            CRAFT: { ENERGY_COST: 10, HAPPINESS_PENALTY_MISSING_MATS: 5, HAPPINESS_RESTORE: 5, SKILL_GAIN: 1 },
            FORAGE: { ENERGY_COST: 10, SKILL_GAIN: 1 }
        }
    }
}));

describe('Clear Water Item Verification', () => {
    let petMock;
    let inventorySystem;

    beforeEach(() => {
        petMock = {
            inventory: {},
            stats: {
                energy: 50,
                happiness: 50,
                hunger: 50
            },
            maxStats: {
                energy: 100,
                happiness: 100,
                hunger: 100
            },
            addJournalEntry: jest.fn(),
            recipes: {},
            discoveredRecipes: []
        };
        inventorySystem = new InventorySystem(petMock);
    });

    test('Clear Water should be defined in ItemDefinitions', () => {
        expect(ItemDefinitions['Clear Water']).toBeDefined();
        expect(ItemDefinitions['Clear Water'].type).toBe('Consumable');
        expect(ItemDefinitions['Clear Water'].emoji).toBe('💧');
    });

    test('Consuming Clear Water should restore energy and happiness', () => {
        // Give the pet some Clear Water
        petMock.inventory['Clear Water'] = 1;

        // Set initial stats to allow for restoration
        petMock.stats.energy = 50;
        petMock.stats.happiness = 50;

        // Consume the item
        inventorySystem.consumeItem('Clear Water');

        // Verify stats update: Energy +5, Happiness +2
        expect(petMock.stats.energy).toBe(55);
        expect(petMock.stats.happiness).toBe(52);

        // Verify journal entry
        expect(petMock.addJournalEntry).toHaveBeenCalledWith(expect.stringContaining("Clear Water"));

        // Verify item removed
        expect(petMock.inventory['Clear Water']).toBeUndefined();
    });

    test('Consuming Clear Water should not exceed max stats', () => {
        petMock.inventory['Clear Water'] = 1;

        // Set stats near max
        petMock.stats.energy = 98;
        petMock.stats.happiness = 99;

        inventorySystem.consumeItem('Clear Water');

        expect(petMock.stats.energy).toBe(100);
        expect(petMock.stats.happiness).toBe(100);
    });
});
