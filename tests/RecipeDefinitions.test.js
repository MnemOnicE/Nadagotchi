
import { Nadagotchi } from '../js/Nadagotchi.js';

describe('Nadagotchi Broken Recipes Bug', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
    });

    it('should have a definition for "Logic-Boosting Snack" in recipes', () => {
        // This should be defined so players can craft it after discovery
        expect(pet.recipes["Logic-Boosting Snack"]).toBeDefined();
    });

    it('should have a definition for "Stamina-Up Tea" in recipes', () => {
        expect(pet.recipes["Stamina-Up Tea"]).toBeDefined();
    });

    it('should be able to craft "Logic-Boosting Snack" if materials are present', () => {
        // Manually define it here if it was missing to show what happens if we fix it?
        // No, this test is to verify the fix in the codebase.

        // 1. Force discovery
        pet.discoveredRecipes.push("Logic-Boosting Snack");

        // 2. We don't know materials yet, but let's assume what they might be for the fix.
        // For now, if the recipe is undefined, craftItem returns early.
        // If defined, it checks materials.

        pet.craftItem("Logic-Boosting Snack");

        const lastEntry = pet.journal[pet.journal.length - 1];
        // If the bug exists (recipe undefined), it says "I tried to craft ..., but I don't know the recipe."
        // If fixed, but no materials, it says "I don't have enough ..."

        expect(lastEntry.text).not.toBe("I tried to craft 'Logic-Boosting Snack', but I don't know the recipe.");
    });
});
