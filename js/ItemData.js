/**
 * Definitions for all items in the game.
 * Includes type, description, and visual representation.
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
    "Genetic Scanner": { type: "Tool", description: "Allows analysis of pet genetics.", emoji: "🧬" }
};

/**
 * Recipes for crafting items.
 * Keys match ItemDefinitions.
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
    }
};
