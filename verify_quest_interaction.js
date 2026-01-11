import { RelationshipSystem } from './js/systems/RelationshipSystem.js';

// Mocks
const mockPet = {
    relationships: { 'Grizzled Scout': { level: 0, interactedToday: false } },
    stats: { energy: 100, happiness: 50 },
    skills: { communication: 0, navigation: 0 },
    inventory: { 'Berries': 0 },
    dailyQuest: null,
    quests: {},
    questSystem: {
        getStageDefinition: () => ({ isComplete: false }),
        startQuest: () => {},
        checkRequirements: () => false
    },
    addJournalEntry: () => {},
    getMoodMultiplier: () => 1.0,
    inventorySystem: { removeItem: () => {} }
};

const system = new RelationshipSystem(mockPet);

console.log("Testing Interaction Structure...");
const result = system.interact('Grizzled Scout');

if (typeof result === 'object' && result.text && Array.isArray(result.options)) {
    console.log("SUCCESS: Interaction returned object with text and options.");
    console.log("Text:", result.text);
    console.log("Options:", result.options.map(o => o.label));
} else {
    console.error("FAILURE: Unexpected return format.", result);
    process.exit(1);
}

// Test Daily Quest Logic
console.log("\nTesting Daily Quest Interaction...");
mockPet.dailyQuest = { npc: 'Grizzled Scout', completed: false, item: 'Sticks', qty: 1, text: "Bring me a stick." };
mockPet.inventory['Sticks'] = 5;

const dqResult = system.interact('Grizzled Scout');
const completeOption = dqResult.options.find(o => o.label === "Complete Quest");

if (completeOption) {
    console.log("SUCCESS: 'Complete Quest' option present.");
} else {
    console.error("FAILURE: Missing 'Complete Quest' option for completable quest.");
    process.exit(1);
}
