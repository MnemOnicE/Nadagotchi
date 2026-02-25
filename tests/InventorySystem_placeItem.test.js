import { Nadagotchi } from '../js/Nadagotchi.js';

// Mock dependencies to prevent side effects during Nadagotchi initialization
jest.mock('../js/ItemData.js', () => ({
    ItemDefinitions: {},
    Recipes: {}
}));

jest.mock('../js/RoomDefinitions.js', () => ({
    RoomDefinitions: {}
}));

jest.mock('../js/PersistenceManager.js', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => ({
            loadJournal: jest.fn().mockReturnValue([]),
            saveJournal: jest.fn(),
            loadRecipes: jest.fn().mockReturnValue([]),
            saveRecipes: jest.fn(),
            loadHallOfFame: jest.fn().mockReturnValue([]),
            savePet: jest.fn(),
            saveHomeConfig: jest.fn(),
            loadHomeConfig: jest.fn().mockReturnValue({})
        }))
    };
});

jest.mock('../js/NarrativeSystem.js', () => ({
    NarrativeSystem: {
        generateEntry: jest.fn().mockReturnValue('Journal Entry'),
        getAdvice: jest.fn().mockReturnValue('Be kind.')
    }
}));

describe('InventorySystem.placeItem', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        // Inventory is initialized to {} by default in constructor
    });

    test('should return true and decrement count when item exists and count > 0', () => {
        pet.inventory['Chair'] = 5;
        const result = pet.inventorySystem.placeItem('Chair');
        expect(result).toBe(true);
        expect(pet.inventory['Chair']).toBe(4);
    });

    test('should return false when item does not exist', () => {
        const result = pet.inventorySystem.placeItem('NonExistentItem');
        expect(result).toBe(false);
        expect(pet.inventory['NonExistentItem']).toBeUndefined();
    });

    test('should return false when item count is 0', () => {
        pet.inventory['GhostItem'] = 0;
        const result = pet.inventorySystem.placeItem('GhostItem');
        expect(result).toBe(false);
        expect(pet.inventory['GhostItem']).toBe(0);
    });

    test('should remove the item key from inventory when the last instance is placed', () => {
        pet.inventory['LastChair'] = 1;
        const result = pet.inventorySystem.placeItem('LastChair');
        expect(result).toBe(true);
        expect(pet.inventory['LastChair']).toBeUndefined();
    });
});
