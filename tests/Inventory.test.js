
import { Nadagotchi } from '../js/Nadagotchi.js';
import { Config } from '../js/Config.js';

// Mock ItemData.js
jest.mock('../js/ItemData.js', () => ({
    ItemDefinitions: {
        'Berries': { type: 'Consumable' },
        'Logic-Boosting Snack': { type: 'Consumable' },
        'Metabolism-Slowing Tonic': { type: 'Consumable' }
    },
    Recipes: {
        'Logic-Boosting Snack': { materials: { 'Berries': 3 }, description: 'Tasty' }
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
});
