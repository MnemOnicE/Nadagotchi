/**
 * PersistenceManager is a utility class for handling game state saving and loading via localStorage.
 * This allows the game to remember the pet's state, retired pets, and other meta-game data across browser sessions.
 */
class PersistenceManager {
    /**
     * Saves the active Nadagotchi's data to localStorage.
     * @param {object} nadagotchiData - The Nadagotchi object to save.
     */
    savePet(nadagotchiData) {
        localStorage.setItem("nadagotchi_save", JSON.stringify(nadagotchiData));
    }

    /**
     * Loads the active Nadagotchi's data from localStorage.
     * @returns {object|null} The parsed Nadagotchi data, or null if no save exists.
     */
    loadPet() {
        const data = localStorage.getItem("nadagotchi_save");
        return data ? JSON.parse(data) : null;
    }

    /**
     * Adds a retired Nadagotchi to the "Hall of Fame" in localStorage.
     * @param {object} nadagotchiData - The data of the pet to retire.
     */
    saveToHallOfFame(nadagotchiData) {
        const fameList = this.loadHallOfFame();
        fameList.push(nadagotchiData);
        localStorage.setItem("hall_of_fame", JSON.stringify(fameList));
    }

    /**
     * Retrieves the list of all retired pets from the Hall of Fame.
     * @returns {Array<object>} An array of retired Nadagotchi data objects.
     */
    loadHallOfFame() {
        const fameList = localStorage.getItem("hall_of_fame");
        return fameList ? JSON.parse(fameList) : [];
    }

    /**
     * Clears the save data for the active pet. This is used when a pet is retired
     * to make way for the next generation.
     */
    clearActivePet() {
        localStorage.removeItem("nadagotchi_save");
    }

    /**
     * Saves the player's journal entries to localStorage.
     * @param {Array<object>} journalEntries - The array of journal entries to save.
     */
    saveJournal(journalEntries) {
        localStorage.setItem("nadagotchi_journal", JSON.stringify(journalEntries));
    }

    /**
     * Loads the player's journal entries from localStorage.
     * @returns {Array<object>} The array of journal entries.
     */
    loadJournal() {
        const journal = localStorage.getItem("nadagotchi_journal");
        return journal ? JSON.parse(journal) : [];
    }

    /**
     * Saves the list of discovered recipes to localStorage.
     * @param {Array<string>} recipeList - The array of discovered recipe names.
     */
    saveRecipes(recipeList) {
        localStorage.setItem("nadagotchi_recipes", JSON.stringify(recipeList));
    }

    /**
     * Loads the list of discovered recipes from localStorage.
     * @returns {Array<string>} The array of discovered recipe names.
     */
    loadRecipes() {
        const recipes = localStorage.getItem("nadagotchi_recipes");
        return recipes ? JSON.parse(recipes) : [];
    }
}
