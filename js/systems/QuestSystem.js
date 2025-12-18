import { QuestDefinitions, DailyQuestTemplates } from '../QuestDefinitions.js';
import { Config } from '../Config.js';

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

    /**
     * Generates a new daily quest based on the season.
     * @param {string} season - Current season.
     * @returns {object|null} The new quest object.
     */
    generateDailyQuest(season) {
        const templates = DailyQuestTemplates[season];
        if (!templates || templates.length === 0) return null;

        const template = this.pet.rng.choice(templates);

        this.pet.dailyQuest = {
            id: template.id,
            npc: template.npc,
            type: template.type,
            item: template.item,
            qty: template.qty,
            text: template.text,
            completed: false
        };

        this.pet.addJournalEntry(`New Daily Quest: ${template.text}`);
        return this.pet.dailyQuest;
    }

    /**
     * Attempts to complete the active daily quest.
     * @returns {boolean} True if completed.
     */
    completeDailyQuest() {
        const quest = this.pet.dailyQuest;
        if (!quest || quest.completed) return false;

        if (quest.type === 'FETCH' || quest.type === 'CRAFT') {
            const count = this.pet.inventory[quest.item] || 0;
            if (count >= quest.qty) {
                this.pet.inventorySystem.removeItem(quest.item, quest.qty);
                quest.completed = true;

                // Rewards
                this.pet.gainCareerXP(20);
                this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.QUEST_HAPPINESS_GAIN;

                // NPC Relationship
                if (this.pet.relationships[quest.npc]) {
                    this.pet.relationships[quest.npc].level += 1;
                }

                this.pet.addJournalEntry(`I completed a request for ${quest.npc}!`);
                return true;
            }
        }
        return false;
    }
}
