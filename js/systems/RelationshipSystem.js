import { Config } from '../Config.js';
import { NarrativeSystem } from '../NarrativeSystem.js';

/**
 * @fileoverview System for managing NPC relationships and interactions.
 * Extracted from Nadagotchi.js to improve maintainability.
 */

export class RelationshipSystem {
    /**
     * @param {import('../Nadagotchi.js').Nadagotchi} pet - The Nadagotchi instance.
     */
    constructor(pet) {
        this.pet = pet;
    }

    /**
     * Manages interaction with an NPC, updating relationship status and stats.
     * @param {string} npcName - The name of the NPC being interacted with.
     * @param {string} [interactionType='CHAT'] - The type of interaction (e.g., 'CHAT', 'GIFT').
     * @returns {object|null} The dialogue object { text, options } or null if interaction failed.
     */
    interact(npcName, interactionType = 'CHAT') {
        if (!this.pet.relationships.hasOwnProperty(npcName)) {
            return null;
        }

        // Check for energy cost
        if (this.pet.stats.energy < Config.ACTIONS.INTERACT_NPC.ENERGY_COST) {
            this.pet.addJournalEntry("I'm too tired to interact right now.");
            return { text: "I'm too tired to interact right now.", options: [{ label: "Close", action: null }] };
        }

        this.pet.stats.energy -= Config.ACTIONS.INTERACT_NPC.ENERGY_COST;

        // Mark interaction for the day to prevent friendship decay
        this.pet.relationships[npcName].interactedToday = true;

        let options = [];

        // 1. Daily Quests
        const dailyQuestResult = this._handleDailyQuest(npcName, options);
        if (dailyQuestResult) return dailyQuestResult;

        // 2. Main Quests (Master Artisan)
        const masterQuestResult = this._handleMasterworkQuest(npcName, options);
        if (masterQuestResult) return masterQuestResult;

        // 3. Standard Interactions (Chat/Gift)
        let resultText = "";
        if (interactionType === 'GIFT' && this.pet.inventory['Berries'] > 0) {
            resultText = this._handleGiftInteraction(npcName, options);
        } else {
            resultText = this._handleChatInteraction(npcName);
        }

        // Default Buttons
        options.push({ label: "Gift (Berries)", action: 'GIFT_CALLBACK' }); // Special flag for UI to callback with GIFT type
        options.push({ label: "Goodbye", action: null });

        return { text: resultText, options: options };
    }

    /**
     * Handles logic for daily quests during interaction.
     * @private
     * @param {string} npcName - The NPC name.
     * @param {Array} options - The options array to populate.
     * @returns {object|null} The dialogue object if handled, otherwise null.
     */
    _handleDailyQuest(npcName, options) {
        if (this.pet.dailyQuest && this.pet.dailyQuest.npc === npcName && !this.pet.dailyQuest.completed) {
            const q = this.pet.dailyQuest;
            const hasItems = (this.pet.inventory[q.item] || 0) >= q.qty;
            let resultText = "";

            if (hasItems) {
                resultText = `${npcName}: "${q.text}"\n(You have the ${q.item}!)`;
                options.push({
                    label: "Complete Quest",
                    action: () => {
                         this.pet.questSystem.completeDailyQuest();
                    }
                });
            } else {
                resultText = `${npcName}: "${q.text}"\n(Requires: ${q.qty} ${q.item})`;
            }
            options.push({ label: "Leave", action: null });
            return { text: resultText, options: options };
        }
        return null;
    }

    /**
     * Handles logic for masterwork crafting quest.
     * @private
     * @param {string} npcName - The NPC name.
     * @param {Array} options - The options array to populate.
     * @returns {object|null} The dialogue object if handled, otherwise null.
     */
    _handleMasterworkQuest(npcName, options) {
        if (npcName === 'Master Artisan') {
             if (!this.pet.quests['masterwork_crafting'] && this.pet.relationships['Master Artisan'].level >= 5) {
                 const resultText = "Master Artisan: 'You show promise. Prove your dedication.'";
                 options.push({
                     label: "Accept Quest",
                     action: () => {
                         this.pet.questSystem.startQuest('masterwork_crafting');
                     }
                 });
                 options.push({ label: "Maybe Later", action: null });
                 return { text: resultText, options: options };
             }

             if (this.pet.quests['masterwork_crafting']) {
                 const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');
                 if (!stageDef.isComplete) {
                      const canAdvance = this.pet.questSystem.checkRequirements('masterwork_crafting');
                      let resultText = "";
                      if (canAdvance) {
                           resultText = `Master Artisan: "${stageDef.description}"\n(Requirements Met!)`;
                           options.push({
                               label: "Complete Stage",
                               action: () => {
                                   this.pet.questSystem.advanceQuest('masterwork_crafting');
                               }
                           });
                      } else {
                           resultText = `Master Artisan: "${stageDef.description}"`;
                      }
                      options.push({ label: "Leave", action: null });
                      return { text: resultText, options: options };
                 }
             }
        }
        return null;
    }

    /**
     * Handles gifting interactions.
     * @private
     * @param {string} npcName - The NPC name.
     * @param {Array} options - The options array to populate.
     * @returns {string} The result dialogue text.
     */
    _handleGiftInteraction(npcName, options) {
        this.pet.inventorySystem.removeItem('Berries', 1);
        this.pet.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.GIFT_RELATIONSHIP;
        this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.GIFT_HAPPINESS;
        this.pet.skills.empathy += Config.ACTIONS.INTERACT_NPC.GIFT_SKILL_GAIN;
        this.pet.addJournalEntry(`I gave Berries to ${npcName}. They seemed to like it!`);
        options.push({ label: "Chat", action: () => { /* Trigger Chat Logic? Re-interact? */ }});
        return "Thanks for the gift!";
    }

    /**
     * Handles standard chat interactions.
     * @private
     * @param {string} npcName - The NPC name.
     * @returns {string} The result dialogue text.
     */
    _handleChatInteraction(npcName) {
        const moodMultiplier = this.pet.getMoodMultiplier();
        this.pet.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.CHAT_RELATIONSHIP;
        this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.CHAT_HAPPINESS;
        this.pet.skills.communication += Config.ACTIONS.INTERACT_NPC.CHAT_SKILL_GAIN;

        switch (npcName) {
            case 'Grizzled Scout':
                this.pet.skills.navigation += Config.ACTIONS.INTERACT_NPC.SCOUT_SKILL_GAIN * moodMultiplier;
                break;
            case 'Master Artisan':
                this.pet.skills.crafting += Config.ACTIONS.INTERACT_NPC.ARTISAN_SKILL_GAIN * moodMultiplier;
                break;
            case 'Sickly Villager':
                this.pet.skills.empathy += Config.ACTIONS.INTERACT_NPC.VILLAGER_SKILL_GAIN * moodMultiplier;
                break;
        }

        const relLevel = this.pet.relationships[npcName].level;
        let recurringText = null;
        if (npcName === 'Master Artisan' && this.pet.quests['masterwork_crafting']) {
             const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');
             if (stageDef && stageDef.isComplete && stageDef.recurringInteraction) {
                 recurringText = stageDef.recurringInteraction.journalEntry;
                 if (stageDef.recurringInteraction.rewards && stageDef.recurringInteraction.rewards.skills) {
                     for (const [skill, val] of Object.entries(stageDef.recurringInteraction.rewards.skills)) {
                         this.pet.skills[skill] += (val * moodMultiplier);
                     }
                 }
             }
        }

        if (recurringText) {
            this.pet.addJournalEntry(recurringText);
            return recurringText;
        } else {
            let hasQuest = false;
            if (npcName === 'Master Artisan' && this.pet.quests['masterwork_crafting']) {
                 const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');
                 if (stageDef && !stageDef.isComplete) hasQuest = true;
            }

            const dialogueText = NarrativeSystem.getNPCDialogue(npcName, relLevel, hasQuest);
            this.pet.addJournalEntry(`Chatted with ${npcName}: "${dialogueText}"`);
            return dialogueText;
        }
    }

    /**
     * Updates relationship status daily.
     * Applies decay to relationships that were not interacted with today.
     * Resets the `interactedToday` flag for the next day.
     */
    dailyUpdate() {
        const decayRate = Config.ACTIONS.INTERACT_NPC.FRIENDSHIP_DECAY || 0.5;

        for (const npcName in this.pet.relationships) {
            const rel = this.pet.relationships[npcName];

            if (!rel.interactedToday) {
                if (rel.level > 0) {
                    rel.level = Math.max(0, rel.level - decayRate);
                }
            }

            // Reset flag for the new day
            rel.interactedToday = false;
        }
    }
}
