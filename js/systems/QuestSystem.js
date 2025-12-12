import { QuestDefinitions } from '../QuestDefinitions.js';

/**
 * @fileoverview System for managing quest progression, requirements, and rewards.
 */
export class QuestSystem {
    /**
     * @param {import('../Nadagotchi.js').Nadagotchi} pet - The Nadagotchi instance.
     */
    constructor(pet) {
        this.pet = pet;
    }

    /**
     * Starts a new quest if it hasn't been started yet.
     * @param {string} questId - The ID of the quest to start.
     * @returns {boolean} True if the quest was successfully started.
     */
    startQuest(questId) {
        if (this.pet.quests[questId]) return false;
        const def = QuestDefinitions[questId];
        if (!def) return false;

        this.pet.quests[questId] = {
            stage: 1,
            name: def.name
        };
        this.pet.addJournalEntry(def.startDescription);
        return true;
    }

    /**
     * Gets the current state of a quest.
     * @param {string} questId
     * @returns {object|null}
     */
    getQuest(questId) {
        return this.pet.quests[questId];
    }

    /**
     * Gets the definition for the current stage of a quest.
     * @param {string} questId
     * @returns {object|null}
     */
    getStageDefinition(questId) {
        const quest = this.pet.quests[questId];
        if (!quest) return null;
        const def = QuestDefinitions[questId];
        if (!def) return null;
        return def.stages[quest.stage];
    }

    /**
     * Checks if the requirements for advancing the current stage are met.
     * @param {string} questId
     * @returns {boolean}
     */
    checkRequirements(questId) {
        const quest = this.pet.quests[questId];
        if (!quest) return false;
        const stageDef = this.getStageDefinition(questId);
        if (!stageDef) return false;
        if (stageDef.isComplete) return true;

        if (stageDef.requirements) {
            // Check Items
            if (stageDef.requirements.items) {
                for (const [item, qty] of Object.entries(stageDef.requirements.items)) {
                    if ((this.pet.inventory[item] || 0) < qty) return false;
                }
            }
            // Check Flags
            if (stageDef.requirements.flags) {
                for (const flag of stageDef.requirements.flags) {
                    if (!quest[flag]) return false;
                }
            }
        }
        return true;
    }

    /**
     * Advances the quest to the next stage if requirements are met.
     * Consumes items and grants rewards.
     * @param {string} questId
     * @returns {boolean} True if advanced.
     */
    advanceQuest(questId) {
        if (!this.checkRequirements(questId)) return false;

        const quest = this.pet.quests[questId];
        const stageDef = this.getStageDefinition(questId);

        // Consume Items if configured
        if (stageDef.consumeRequirements && stageDef.requirements && stageDef.requirements.items) {
            for (const [item, qty] of Object.entries(stageDef.requirements.items)) {
                this.pet.inventorySystem.removeItem(item, qty);
            }
        }

        // Apply Rewards
        if (stageDef.rewards) {
            this._applyRewards(stageDef.rewards);
        }

        // Update Journal
        if (stageDef.completionJournalEntry) {
            this.pet.addJournalEntry(stageDef.completionJournalEntry);
        }

        // Advance Stage
        if (stageDef.nextStage) {
            quest.stage = stageDef.nextStage;
        }

        return true;
    }

    /**
     * Applies rewards to the pet.
     * @param {object} rewards
     * @private
     */
    _applyRewards(rewards) {
        const moodMultiplier = this.pet.getMoodMultiplier();

        if (rewards.recipes) {
            rewards.recipes.forEach(r => this.pet.inventorySystem.discoverRecipe(r));
        }
        if (rewards.skills) {
            for (const [skill, val] of Object.entries(rewards.skills)) {
                if (this.pet.skills[skill] !== undefined) {
                    this.pet.skills[skill] += (val * moodMultiplier);
                }
            }
        }
        if (rewards.happiness) {
            this.pet.stats.happiness += rewards.happiness;
        }
    }

    /**
     * Sets a flag on a specific quest.
     * @param {string} questId
     * @param {string} flag
     * @param {boolean} value
     */
    setQuestFlag(questId, flag, value = true) {
        if (this.pet.quests[questId]) {
            this.pet.quests[questId][flag] = value;
        }
    }
}
