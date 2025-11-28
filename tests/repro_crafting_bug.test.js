const PersistenceManager = require('../js/PersistenceManager');
global.PersistenceManager = PersistenceManager;

const Nadagotchi = require('../js/Nadagotchi');

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

describe('Nadagotchi Crafting Logic', () => {
    let pet;

    beforeEach(() => {
        global.localStorage.clear();

        // Initialize pet
        pet = new Nadagotchi('Adventurer');

        // Give the pet materials to craft a Fancy Bookshelf
        // Recipe: { "Sticks": 5, "Shiny Stone": 1 }
        pet.inventory = {
            "Sticks": 10,
            "Shiny Stone": 5
        };

        // Explicitly clear discovered recipes to test the check
        // The constructor might add default recipes, so we force it empty here
        pet.discoveredRecipes = [];
    });

    it('should NOT allow crafting an item that has not been discovered', () => {
        // Attempt to craft "Fancy Bookshelf"
        pet.craftItem("Fancy Bookshelf");

        // Expectation:
        // 1. Item should NOT be in inventory
        // 2. Materials should NOT be consumed
        // 3. Journal should contain failure message

        // In the buggy version, this will fail because it WILL craft the item.
        expect(pet.inventory["Fancy Bookshelf"]).toBeUndefined();
        expect(pet.inventory["Sticks"]).toBe(10);
        expect(pet.inventory["Shiny Stone"]).toBe(5);

        // Check journal for specific failure message
        const journalEntries = pet.journal.map(e => e.text);
        expect(journalEntries).toContain("I tried to craft 'Fancy Bookshelf', but I don't know the recipe.");
    });
});
