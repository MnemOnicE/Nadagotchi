
import { Nadagotchi } from '../js/Nadagotchi.js';
import { Config } from '../js/Config.js';

// Mock ItemData.js
jest.mock('../js/ItemData.js', () => ({
    ItemDefinitions: {
        'Berries': { type: 'Consumable' },
        'Logic-Boosting Snack': { type: 'Consumable' },
        'Metabolism-Slowing Tonic': { type: 'Consumable' },
        'Living Room Deed': { type: 'DEED', targetRoom: 'LivingRoom' },
        'Kitchen Deed': { type: 'DEED', targetRoom: 'Kitchen' }
    },
    Recipes: {
        'Logic-Boosting Snack': { materials: { 'Berries': 3 }, description: 'Tasty' }
    }
}));

// Mock RoomDefinitions.js
jest.mock('../js/RoomDefinitions.js', () => ({
    RoomDefinitions: {
        "Entryway": {
            id: "Entryway",
            connections: ["LivingRoom"],
            unlocked: true
        },
        "LivingRoom": {
            id: "LivingRoom",
            connections: ["Entryway", "Kitchen"],
            unlocked: false
        },
        "Kitchen": {
            id: "Kitchen",
            connections: ["LivingRoom"],
            unlocked: false
        }
    }
}));

// Mock PersistenceManager to avoid filesystem/localStorage issues
jest.mock('../js/PersistenceManager.js', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => ({
            loadJournal: jest.fn().mockReturnValue([]),
            saveJournal: jest.fn(),
            loadRecipes: jest.fn().mockReturnValue([]),
            saveRecipes: jest.fn(),
            loadHallOfFame: jest.fn().mockReturnValue([]),
            savePet: jest.fn(),
        }))
    };
});

// Mock NarrativeSystem
jest.mock('../js/NarrativeSystem.js', () => ({
    NarrativeSystem: {
        generateEntry: jest.fn().mockReturnValue('Journal Entry'),
        getAdvice: jest.fn().mockReturnValue('Be kind.')
    }
}));

describe('Inventory System', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        // Reset stats for clean testing
        pet.stats = { ...Config.INITIAL_STATE.STATS }; // 50/50/50
        pet.inventory = {};
    });

    test('should consume Berries and restore hunger/energy', () => {
        pet.inventory['Berries'] = 2;
        pet.stats.hunger = 20;
        pet.stats.energy = 20;

        pet.consumeItem('Berries');

        expect(pet.inventory['Berries']).toBe(1);
        expect(pet.stats.hunger).toBeGreaterThan(20);
        expect(pet.stats.energy).toBeGreaterThan(20);
    });

    test('should consume Logic-Boosting Snack and boost logic/happiness', () => {
        pet.inventory['Logic-Boosting Snack'] = 1;
        pet.stats.happiness = 20;
        const initialLogic = pet.skills.logic;

        pet.consumeItem('Logic-Boosting Snack');

        expect(pet.inventory['Logic-Boosting Snack']).toBeUndefined(); // Deleted if 0
        expect(pet.stats.happiness).toBeGreaterThan(20);
        expect(pet.skills.logic).toBeGreaterThan(initialLogic);
    });

    test('should consume Metabolism-Slowing Tonic and modify genome', () => {
        pet.inventory['Metabolism-Slowing Tonic'] = 1;
        // Mock genome
        pet.genome = {
            genotype: { metabolism: [5, 5] },
            phenotype: { metabolism: 5 },
            calculatePhenotype: jest.fn().mockReturnValue({ metabolism: 4 })
        };

        pet.consumeItem('Metabolism-Slowing Tonic');

        expect(pet.inventory['Metabolism-Slowing Tonic']).toBeUndefined();
        expect(pet.genome.genotype.metabolism).toEqual([4, 4]);
        expect(pet.genome.calculatePhenotype).toHaveBeenCalled();
    });

    test('should not consume item if not in inventory', () => {
        pet.consumeItem('Berries');
        // No error, but no effect
        expect(pet.stats.hunger).toBe(Config.INITIAL_STATE.STATS.hunger);
    });

    test('handleAction should trigger consumeItem', () => {
        pet.inventory['Berries'] = 1;
        const spy = jest.spyOn(pet, 'consumeItem');

        pet.handleAction('CONSUME_ITEM', 'Berries');

        expect(spy).toHaveBeenCalledWith('Berries');
        expect(pet.inventory['Berries']).toBeUndefined();
    });

    test('should unlock Living Room via Deed if Entryway is unlocked', () => {
        pet.homeConfig = {
            rooms: {
                "Entryway": { unlocked: true }
            }
        };
        pet.inventory['Living Room Deed'] = 1;

        // Mock unlockRoom to update config or rely on system?
        // InventorySystem calls pet.unlockRoom. We can spy on it or trust implementation.
        // Let's rely on implementation but we need to ensure pet.unlockRoom updates the mock config correctly
        // OR we mock pet.unlockRoom.
        // Since Nadagotchi.js is real here, unlockRoom should work if RoomDefinitions mock is aligned.

        const result = pet.consumeItem('Living Room Deed');

        expect(result.success).toBe(true);
        // Check side effect: Room unlocked
        expect(pet.homeConfig.rooms['LivingRoom']).toBeDefined();
        expect(pet.homeConfig.rooms['LivingRoom'].unlocked).toBe(true);
        expect(pet.inventory['Living Room Deed']).toBeUndefined();
    });

    test('should fail to unlock Kitchen if Living Room is locked', () => {
        pet.homeConfig = {
            rooms: {
                "Entryway": { unlocked: true }
            }
        };
        // LivingRoom is locked by default in mock and homeConfig init
        pet.inventory['Kitchen Deed'] = 1;

        const result = pet.consumeItem('Kitchen Deed');

        expect(result.success).toBe(false);
        expect(result.message).toBe("You must unlock a connecting room first!");
        expect(pet.inventory['Kitchen Deed']).toBe(1);
    });
});
