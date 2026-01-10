/**
 * @fileoverview Definitions for items and recipes within the game.
 * Separates data from logic, allowing for easy addition of new items.
 */

/**
 * Definitions for all items in the game.
 * Includes type, description, and visual representation.
 * @type {Object.<string, {type: string, description: string, emoji: string, assetKey?: string, consumable?: boolean}>}
 */
export const ItemDefinitions = {
    // Raw Materials
    "Sticks": { type: "Material", description: "Basic building material found in the forest.", emoji: "🪵" },
    "Berries": { type: "Consumable", description: "Sweet and nutritious wild berries.", emoji: "🍒" },
    "Shiny Stone": { type: "Material", description: "A rare stone that glitters in the sunlight.", emoji: "💎" },
    "Frostbloom": { type: "Material", description: "A magical flower that blooms in winter.", emoji: "❄️" },
    "Muse Flower": { type: "Material", description: "A flower that inspires creativity.", emoji: "🌺" },

    // Crafted Items (Consumables)
    "Hot Cocoa": { type: "Consumable", description: "A rich, warm drink perfect for rainy days.", emoji: "☕" },
    "Logic-Boosting Snack": { type: "Consumable", description: "A tasty snack that fuels the mind.", emoji: "🧠" },
    "Stamina-Up Tea": { type: "Consumable", description: "A warm tea that restores energy.", emoji: "🍵" },
    "Metabolism-Slowing Tonic": { type: "Consumable", description: "A tonic that slows metabolism, helping to conserve energy.", emoji: "🧪" },
    "Nutrient Bar": { type: "Consumable", description: "A dense bar packed with vitamins.", emoji: "🍫" },
    "Espresso": { type: "Consumable", description: "A strong coffee to speed you up.", emoji: "☕" },
    "Chamomile": { type: "Consumable", description: "A calming tea to slow you down.", emoji: "🍵" },
    "Clear Water": { type: "Consumable", description: "Fresh, cold water from a frozen pond.", emoji: "💧" },

    // Crafted Items (Furniture)
    "Fancy Bookshelf": { type: "FURNITURE", description: "A beautiful bookshelf that makes studying more effective.", emoji: "📚" },
    "Masterwork Chair": { type: "FURNITURE", description: "A chair of unparalleled craftsmanship.", emoji: "🪑" },

    // Home Decor (Wallpaper)
    "Blue Wallpaper": { type: "WALLPAPER", description: "Calming blue stripes.", emoji: "🟦", assetKey: "wallpaper_blue", consumable: false },
    "Brick Wallpaper": { type: "WALLPAPER", description: "Rustic red brick.", emoji: "🧱", assetKey: "wallpaper_brick", consumable: false },
    "Cozy Wallpaper": { type: "WALLPAPER", description: "Warm, striped wallpaper that makes a room feel like home.", emoji: "🏠", assetKey: "cozy_wallpaper", consumable: false },

    // Home Decor (Flooring)
    "Wood Flooring": { type: "FLOORING", description: "Polished oak planks.", emoji: "🟫", assetKey: "flooring_wood", consumable: false },
    "Tile Flooring": { type: "FLOORING", description: "Cool gray tiles.", emoji: "⬜", assetKey: "flooring_tile", consumable: false },
    "Grass Flooring": { type: "FLOORING", description: "Lush green grass for that outdoor feel.", emoji: "🌿", assetKey: "grass_flooring", consumable: false },

    // Tools & Artifacts
    "Genetic Scanner": { type: "Tool", description: "Allows analysis of pet genetics.", emoji: "🧬" },
    "Ancient Tome": { type: "Tool", description: "A dusty book filled with ancient wisdom.", emoji: "📖" },
    "Heart Amulet": { type: "Tool", description: "A warm amulet that pulses with kindness.", emoji: "❤️" }
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
    "Masterwork Chair": {
        materials: { "Sticks": 10, "Shiny Stone": 2 },
        description: "A chair of unparalleled craftsmanship."
    },
    "Cozy Wallpaper": {
        materials: { "Berries": 5, "Sticks": 2 }, // Dye + Structure
        description: "Warm, striped wallpaper that makes a room feel like home."
    },
    "Blue Wallpaper": {
        materials: { "Berries": 5, "Sticks": 2 }, // Placeholder cost
        description: "Calming blue stripes."
    },
    "Brick Wallpaper": {
        materials: { "Sticks": 5, "Shiny Stone": 1 },
        description: "Rustic red brick."
    },
    "Wood Flooring": {
        materials: { "Sticks": 10 },
        description: "Polished wood planks for a classic look."
    },
    "Tile Flooring": {
         materials: { "Shiny Stone": 2, "Sticks": 2 },
         description: "Cool gray tiles."
    },
    "Grass Flooring": {
         materials: { "Berries": 2, "Sticks": 2 },
         description: "Lush green grass."
    },
    "Logic-Boosting Snack": {
        materials: { "Berries": 3 },
        description: "A tasty snack that fuels the mind."
    },
    "Hot Cocoa": {
        materials: { "Berries": 2, "Sticks": 1 },
        description: "A rich, warm drink perfect for rainy days."
    },
    "Stamina-Up Tea": {
        materials: { "Berries": 1, "Sticks": 1 },
        description: "A warm tea that restores energy."
    },
    "Metabolism-Slowing Tonic": {
        materials: { "Frostbloom": 1, "Sticks": 2 },
        description: "A tonic that slows metabolism, helping to conserve energy."
    }
};
