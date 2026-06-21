const fs = require('fs');
const path = 'js/systems/InventorySystem.js';
let code = fs.readFileSync(path, 'utf8');

// The tests fail because they mock recipe.materials = undefined or recipe is something without materials
// but craftItem uses Object.keys(recipe.materials).
// Let's add a safe guard to fallback if recipe.materials is undefined
const oldCode = `        // Cache the keys to avoid repeated iterations and object property lookups
        const materialKeys = Object.keys(recipe.materials);
        const numMaterials = materialKeys.length;`;

const newCode = `        // Cache the keys to avoid repeated iterations and object property lookups
        const materials = recipe.materials || {};
        const materialKeys = Object.keys(materials);
        const numMaterials = materialKeys.length;`;

let oldCode2 = `        // Check if pet has all required materials
        for (let i = 0; i < numMaterials; i++) {
            const material = materialKeys[i];
            const requiredAmount = recipe.materials[material];`;

let newCode2 = `        // Check if pet has all required materials
        for (let i = 0; i < numMaterials; i++) {
            const material = materialKeys[i];
            const requiredAmount = materials[material];`;

let oldCode3 = `        // Consume materials
        for (let i = 0; i < numMaterials; i++) {
            const material = materialKeys[i];
            this.removeItem(material, recipe.materials[material]);
        }`;

let newCode3 = `        // Consume materials
        for (let i = 0; i < numMaterials; i++) {
            const material = materialKeys[i];
            this.removeItem(material, materials[material]);
        }`;

if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    code = code.replace(oldCode2, newCode2);
    code = code.replace(oldCode3, newCode3);
    fs.writeFileSync(path, code);
    console.log("Updated js/systems/InventorySystem.js with safe guards");
} else {
    console.log("Could not find the target code to replace");
}
