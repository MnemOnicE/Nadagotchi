// Mock Dependencies
import { InventorySystem } from './js/systems/InventorySystem.js';
import { Recipes } from './js/ItemData.js';

// Setup Mock Pet
const mockPet = {
    inventory: { 'Sticks': 10, 'Shiny Stone': 5 },
    discoveredRecipes: ['Fancy Bookshelf'],
    recipes: Recipes,
    stats: { energy: 100, happiness: 50 },
    skills: { crafting: 0 },
    getMoodMultiplier: () => 1.0,
    addJournalEntry: () => {},
    questSystem: { setQuestFlag: () => {} },
    persistence: { saveRecipes: () => {}, saveHomeConfig: () => {} }
};

const system = new InventorySystem(mockPet);

console.log("Verifying Grid Crafting...");

// 1. Valid Pattern (Fancy Bookshelf: Sticks x3, Sticks-Stone-Sticks, Sticks x3)
const validGrid = [
    "Sticks", "Sticks", "Sticks",
    "Sticks", "Shiny Stone", "Sticks",
    "Sticks", "Sticks", "Sticks"
];

const result1 = system.craftFromGrid(validGrid);
if (result1.success && result1.item === 'Fancy Bookshelf') {
    console.log("SUCCESS: Valid grid crafted successfully.");
} else {
    console.error("FAILURE: Valid grid failed.", result1);
    process.exit(1);
}

// 2. Invalid Pattern
const invalidGrid = [
    "Sticks", "Sticks", "Sticks",
    "Sticks", "Sticks", "Sticks",
    "Sticks", "Sticks", "Sticks" // Missing Stone center
];

const result2 = system.craftFromGrid(invalidGrid);
if (!result2.success) {
    console.log("SUCCESS: Invalid grid rejected.");
} else {
    console.error("FAILURE: Invalid grid accepted.");
    process.exit(1);
}

// 3. Insufficient Mats
mockPet.inventory['Shiny Stone'] = 0;
const result3 = system.craftFromGrid(validGrid);
if (!result3.success && result3.message.includes("Not enough")) {
    console.log("SUCCESS: Material check passed.");
} else {
    console.error("FAILURE: Material check failed.", result3);
    process.exit(1);
}
