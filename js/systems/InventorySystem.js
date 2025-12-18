import { Config } from '../Config.js';

/**
 * @fileoverview System for managing items, inventory, crafting, and foraging.
 * Extracted from Nadagotchi.js to improve maintainability.
 */
export class InventorySystem {
    /**
     * @param {import('../Nadagotchi.js').Nadagotchi} pet - The Nadagotchi instance.
     */
    constructor(pet) {
        this.pet = pet;
    }

    /**
     * Attempts to craft a specified item. Checks for required materials, consumes them, and adds the item to inventory.
     * @param {string} itemName - The name of the item to craft from the `this.pet.recipes` object.
     */
    craftItem(itemName) {
        const recipe = this.pet.recipes[itemName];
        // Check if recipe exists and is discovered
        if (!recipe || !this.pet.discoveredRecipes.includes(itemName)) {
            this.pet.addJournalEntry(`I tried to craft '${itemName}', but I don't know the recipe.`);
            return;
        }

        // Check resources (Energy)
        if (this.pet.stats.energy < Config.ACTIONS.CRAFT.ENERGY_COST) {
            this.pet.addJournalEntry("I'm too tired to craft right now.");
            return;
        }

        // Check if pet has all required materials
        for (const material in recipe.materials) {
            const requiredAmount = recipe.materials[material];
            const hasAmount = this.pet.inventory[material] || 0;
            if (hasAmount < requiredAmount) {
                this.pet.addJournalEntry(`I don't have enough ${material} to craft a ${itemName}.`);
                this.pet.stats.happiness -= Config.ACTIONS.CRAFT.HAPPINESS_PENALTY_MISSING_MATS; // Frustration
                return;
            }
        }

        // Consume materials
        for (const material in recipe.materials) {
            this.removeItem(material, recipe.materials[material]);
        }

        // Add crafted item to inventory
        this.addItem(itemName, 1);
        this.pet.stats.energy -= Config.ACTIONS.CRAFT.ENERGY_COST;
        this.pet.stats.happiness += Config.ACTIONS.CRAFT.HAPPINESS_RESTORE;

        // Update Quest Progress
        if (itemName === 'Masterwork Chair') {
            this.pet.questSystem.setQuestFlag('masterwork_crafting', 'hasCraftedChair');
        }

        const moodMultiplier = this.pet.getMoodMultiplier();
        this.pet.skills.crafting += (Config.ACTIONS.CRAFT.SKILL_GAIN * moodMultiplier);
        this.pet.addJournalEntry(`I successfully crafted a ${itemName}!`);
    }

    /**
     * Consumes an item, applying its effects to the Nadagotchi.
     * @param {string} itemName - The name of the item to consume.
     */
    consumeItem(itemName) {
        if (!this.pet.inventory[itemName] || this.pet.inventory[itemName] <= 0) return;

        let consumed = false;

        switch (itemName) {
            case 'Berries':
                // Berries provide a small amount of food and energy
                this.pet.stats.hunger = Math.min(this.pet.maxStats.hunger, this.pet.stats.hunger + 10);
                this.pet.stats.energy = Math.min(this.pet.maxStats.energy, this.pet.stats.energy + 2);
                this.pet.addJournalEntry("I ate some Berries. Yummy!");
                consumed = true;
                break;
            case 'Logic-Boosting Snack':
                this.pet.stats.energy = Math.min(this.pet.maxStats.energy, this.pet.stats.energy + 10);
                this.pet.stats.happiness = Math.min(this.pet.maxStats.happiness, this.pet.stats.happiness + 5);
                this.pet.skills.logic += 0.5;
                this.pet.addJournalEntry("I ate a Logic-Boosting Snack. I feel smarter!");
                consumed = true;
                break;
            case 'Hot Cocoa':
                this.pet.stats.energy = Math.min(this.pet.maxStats.energy, this.pet.stats.energy + 15);
                this.pet.stats.happiness = Math.min(this.pet.maxStats.happiness, this.pet.stats.happiness + 15);
                this.pet.addJournalEntry("I drank some Hot Cocoa. It was warm and cozy!");
                consumed = true;
                break;
            case 'Stamina-Up Tea':
                this.pet.stats.energy = Math.min(this.pet.maxStats.energy, this.pet.stats.energy + 30);
                this.pet.addJournalEntry("I drank some Stamina-Up Tea. I feel refreshed!");
                consumed = true;
                break;
            case 'Metabolism-Slowing Tonic':
                // Gene Therapy: Reduces metabolism gene values permanently (for this life/lineage)
                if (this.pet.genome && this.pet.genome.genotype && this.pet.genome.genotype.metabolism) {
                    const old = this.pet.genome.genotype.metabolism;
                    // Decrease both alleles by 1, min 1
                    this.pet.genome.genotype.metabolism = [Math.max(1, old[0] - 1), Math.max(1, old[1] - 1)];
                    // Recalculate phenotype using existing RNG state
                    this.pet.genome.phenotype = this.pet.genome.calculatePhenotype(this.pet.rng);
                    this.pet.addJournalEntry("I drank the tonic. I feel... slower. My metabolism has decreased.");
                    consumed = true;
                }
                break;
            default:
                // Item is not consumable
                break;
        }

        if (consumed) {
            this.removeItem(itemName, 1);
            // Stats will be updated in UI on next tick/event
        }
    }

    /**
     * Simulates foraging for items, changing location, updating stats, and adding items to inventory.
     */
    forage() {
        if (this.pet.stats.energy < Config.ACTIONS.FORAGE.ENERGY_COST) return;

        this.pet.location = 'Forest';
        this.pet.stats.energy -= Config.ACTIONS.FORAGE.ENERGY_COST;
        const moodMultiplier = this.pet.getMoodMultiplier();
        this.pet.skills.navigation += (Config.ACTIONS.FORAGE.SKILL_GAIN * moodMultiplier);

        const potentialItems = ['Berries', 'Sticks', 'Shiny Stone'];
        if (this.pet.currentSeason === 'Winter') {
            potentialItems.push('Frostbloom');
        } else if (this.pet.currentSeason === 'Autumn') {
            potentialItems.push('Muse Flower');
        }

        // Use RNG to select item
        const foundItem = this.pet.rng.choice(potentialItems);
        this.addItem(foundItem, 1);

        if (foundItem === 'Frostbloom') {
            this.discoverRecipe("Metabolism-Slowing Tonic");
        }

        this.pet.addJournalEntry(`I went foraging in the ${this.pet.location} and found a ${foundItem}.`);
        this.pet.location = 'Home';
    }

    /**
     * Removes an item from the inventory for placement in the world.
     * @param {string} itemName - The name of the item to place.
     * @returns {boolean} True if the item was successfully removed, false otherwise.
     */
    placeItem(itemName) {
        if (this.pet.inventory[itemName] && this.pet.inventory[itemName] > 0) {
            this.removeItem(itemName, 1);
            return true;
        }
        return false;
    }

    /**
     * Adds a specified quantity of an item to the inventory.
     * @param {string} itemName - The name of the item to add.
     * @param {number} quantity - The number of items to add.
     */
    addItem(itemName, quantity) {
        if (!this.pet.inventory[itemName]) {
            this.pet.inventory[itemName] = 0;
        }
        this.pet.inventory[itemName] += quantity;
    }

    /**
     * Removes a specified quantity of an item from the inventory.
     * @param {string} itemName - The name of the item to remove.
     * @param {number} quantity - The number of items to remove.
     */
    removeItem(itemName, quantity) {
        if (this.pet.inventory[itemName]) {
            this.pet.inventory[itemName] -= quantity;
            if (this.pet.inventory[itemName] <= 0) {
                delete this.pet.inventory[itemName];
            }
        }
    }

    /**
     * Adds a new recipe to the list if it's not already discovered and saves it to persistence.
     * @param {string} recipeName - The name of the recipe to add.
     * @returns {boolean} True if the recipe was newly discovered, false if already known.
     */
    discoverRecipe(recipeName) {
        if (!this.pet.discoveredRecipes.includes(recipeName)) {
            this.pet.discoveredRecipes.push(recipeName);
            this.pet.persistence.saveRecipes(this.pet.discoveredRecipes);
            this.pet.addJournalEntry(`I discovered a new recipe: ${recipeName}!`);
            return true;
        }
        return false;
    }
}
