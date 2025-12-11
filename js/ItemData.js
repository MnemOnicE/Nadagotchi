/**
 * @fileoverview Definitions for items and recipes within the game.
 * Separates data from logic, allowing for easy addition of new items.
 */

/**
 * Definitions for all items in the game.
 * Includes type, description, and visual representation.
 * @type {Object.<string, {type: string, description: string, emoji: string}>}
 */
export const ItemDefinitions = {
    // Raw Materials
    "Sticks": { type: "Material", description: "Basic building material found in the forest.", emoji: "🪵" },
    "Berries": { type: "Consumable", description: "Sweet and nutritious wild berries.", emoji: "🍒" },
    "Shiny Stone": { type: "Material", description: "A rare stone that glitters in the sunlight.", emoji: "💎" },
    "Frostbloom": { type: "Material", description: "A magical flower that blooms in winter.", emoji: "❄️" },

    // Crafted Items (Consumables)
    "Logic-Boosting Snack": { type: "Consumable", description: "A tasty snack that fuels the mind.", emoji: "🧠" },
    "Stamina-Up Tea": { type: "Consumable", description: "A warm tea that restores energy.", emoji: "🍵" },
    "Metabolism-Slowing Tonic": { type: "Consumable", description: "A tonic that slows metabolism, helping to conserve energy.", emoji: "🧪" },

    // Crafted Items (Furniture)
    "Fancy Bookshelf": { type: "Furniture", description: "A beautiful bookshelf that makes studying more effective.", emoji: "📚" },
    "Masterwork Chair": { type: "Furniture", description: "A chair of unparalleled craftsmanship.", emoji: "🪑" },

    // Tools
    "Genetic Scanner": { type: "Tool", description: "Allows analysis of pet genetics.", emoji: "🧬" },

    // Special Breeding Items
    "Ancient Tome": { type: "Tool", description: "A dusty book containing forgotten knowledge. Boosts Intellectual genes.", emoji: "📖" },
    "Heart Amulet": { type: "Tool", description: "An amulet that pulses with warmth. Boosts Nurturer genes.", emoji: "🧿" },
    "Muse Flower": { type: "Material", description: "A rare flower that inspires creativity. Boosts Mischievous genes.", emoji: "🌺" },
    "Nutrient Bar": { type: "Consumable", description: "A scientifically formulated bar for perfect health. Boosts Metabolism genes.", emoji: "🍫" },
    "Espresso": { type: "Consumable", description: "Highly concentrated caffeine. Increases Metabolism speed.", emoji: "☕" },
    "Chamomile": { type: "Consumable", description: "A calming herb. Decreases Metabolism speed.", emoji: "🌼" }
};

/**
 * Recipes for crafting items.
 * Keys match ItemDefinitions.
 * @type {Object.<string, {materials: Object.<string, number>, description: string}>}
 */
export const Recipes = {
    "Fancy Bookshelf": {
        materials: { "Sticks": 5, "Shiny Stone": 1 },
        description: "A beautiful bookshelf that makes studying more effective."
    },
    "Logic-Boosting Snack": {
        materials: { "Berries": 3 },
        description: "A tasty snack that fuels the mind."
    },
    "Stamina-Up Tea": {
        materials: { "Berries": 1, "Sticks": 1 },
        description: "A warm tea that restores energy."
    },
    "Masterwork Chair": {
        materials: { "Sticks": 10, "Shiny Stone": 2 },
        description: "A chair of unparalleled craftsmanship."
    },
    "Metabolism-Slowing Tonic": {
        materials: { "Frostbloom": 1, "Sticks": 2 },
        description: "A tonic that slows metabolism, helping to conserve energy."
    },
    "Ancient Tome": {
        materials: { "Sticks": 10, "Shiny Stone": 2 },
        description: "A dusty book containing forgotten knowledge."
    },
    "Heart Amulet": {
        materials: { "Shiny Stone": 3, "Sticks": 1 },
        description: "An amulet that pulses with warmth."
    },
    "Nutrient Bar": {
        materials: { "Berries": 5, "Sticks": 1 },
        description: "A scientifically formulated bar for perfect health."
    },
    "Espresso": {
        materials: { "Berries": 10 },
        description: "Highly concentrated caffeine."
    }
};
