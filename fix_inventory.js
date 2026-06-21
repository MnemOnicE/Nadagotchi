const fs = require('fs');

const path = 'js/systems/InventorySystem.js';
let code = fs.readFileSync(path, 'utf-8');

const oldLoops = `        // Consume materials
        for (let i = 0; i < numMaterials; i++) {
            const material = materialKeys[i];
            this.removeItem(material, recipe.materials[material]);
        }`;

const newLoops = `        // Consume materials
        for (let i = 0; i < numMaterials; i++) {
            const material = materialKeys[i];
            this.removeItem(material, recipe.materials[material]);
        }`;

if (code.includes(oldLoops)) {
    code = code.replace(oldLoops, newLoops);
    fs.writeFileSync(path, code);
    console.log("Successfully updated loops in js/systems/InventorySystem.js");
} else {
    console.log("Error: Could not find target loops in js/systems/InventorySystem.js");
}
