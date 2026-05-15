import { Config } from '../Config.js';
import { NarrativeSystem } from '../NarrativeSystem.js';
import { EventKeys } from '../EventKeys.js';

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

        // --- Interaction Logic ---
        let resultText = "";
        let options = [];

        // 1. Daily Quests
        if (this.pet.dailyQuest && this.pet.dailyQuest.npc === npcName && !this.pet.dailyQuest.completed) {
            // Check if can complete
            const q = this.pet.dailyQuest;
            const hasItems = (this.pet.inventory[q.item] || 0) >= q.qty;

            if (hasItems) {
                // Offer completion
                resultText = `${npcName}: "${q.text}"\n(You have the ${q.item}!)`;
                options.push({
                    label: "Complete Quest",
                    action: () => {
                         this.pet.questSystem.completeDailyQuest();
                         // UI will refresh on next interaction or we can trigger update
                         // For now, simpler to just let the action happen.
                         // Ideally we'd return a new state, but callback logic in UIScene handles closing/refreshing usually.
                    }
                });
            } else {
                resultText = `${npcName}: "${q.text}"\n(Requires: ${q.qty} ${q.item})`;
            }
            options.push({ label: "Leave", action: null });
            return { text: resultText, options: options };
        }

        // 2. Main Quests (Master Artisan)
        if (npcName === 'Master Artisan') {
             // Start Quest Check
             if (!this.pet.quests['masterwork_crafting'] && this.pet.relationships['Master Artisan'].level >= 5) {
                 const qDef = this.pet.questSystem.getStageDefinition('masterwork_crafting'); // N/A yet
                 resultText = "Master Artisan: 'You show promise. Prove your dedication.'";
                 options.push({
                     label: "Accept Quest",
                     action: () => {
                         this.pet.questSystem.startQuest('masterwork_crafting');
                     }
                 });
                 options.push({ label: "Maybe Later", action: null });
                 return { text: resultText, options: options };
             }

             // Continue Quest Check
             if (this.pet.quests['masterwork_crafting']) {
                 const q = this.pet.quests['masterwork_crafting'];
                 const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');

                 if (!stageDef.isComplete) {
                      const canAdvance = this.pet.questSystem.checkRequirements('masterwork_crafting');
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

        // 3. Standard Interactions (Chat/Gift)
        if (interactionType === 'GIFT' && this.pet.inventory['Berries'] > 0) {
            this.pet.inventorySystem.removeItem('Berries', 1);
            this.pet.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.GIFT_RELATIONSHIP;
            this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.GIFT_HAPPINESS;
            this.pet.skills.empathy += Config.ACTIONS.INTERACT_NPC.GIFT_SKILL_GAIN;
            resultText = "Thanks for the gift!";
            this.pet.addJournalEntry(`I gave Berries to ${npcName}. They seemed to like it!`);
            options.push({ label: "Chat", action: () => { /* Trigger Chat Logic? Re-interact? */ }});
        } else {
            // CHAT
            const moodMultiplier = this.pet.getMoodMultiplier();
            this.pet.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.CHAT_RELATIONSHIP;
            this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.CHAT_HAPPINESS;
            this.pet.skills.communication += Config.ACTIONS.INTERACT_NPC.CHAT_SKILL_GAIN;

            // Apply Skill Bonuses
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
            // Check for Recurring Interaction (Completed Quest)
            let recurringText = null;
            if (npcName === 'Master Artisan' && this.pet.quests['masterwork_crafting']) {
                 const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');
                 if (stageDef) {
                     if (stageDef.isComplete && stageDef.recurringInteraction) {
                         recurringText = stageDef.recurringInteraction.journalEntry;
                         // Apply specific recurring rewards if defined
                         if (stageDef.recurringInteraction.rewards) {
                             // Note: _applyRewards is in QuestSystem, maybe we should duplicate simple logic or expose it?
                             // For now, simpler to just apply skill manually as per definition (crafting: 0.2)
                             // Or leave standard chat skill gain?
                             // The definition says: rewards: { skills: { crafting: 0.2 } }
                             // Standard chat gives ARTISAN_SKILL_GAIN (0.15).
                             // Let's add the bonus.
                             if (stageDef.recurringInteraction.rewards.skills) {
                                 for (const [skill, val] of Object.entries(stageDef.recurringInteraction.rewards.skills)) {
                                     this.pet.skills[skill] += (val * moodMultiplier);
                                 }
                             }
                         }
                     } else if (!stageDef.isComplete) {
                         // Active quest flag for NarrativeSystem
                         // hasQuest = true; // Use variable below
                     }
                 }
            }

            if (recurringText) {
                this.pet.addJournalEntry(recurringText);
                resultText = recurringText;
            } else {
                // Legacy/Standard Fallback
                let hasQuest = false;
                if (npcName === 'Master Artisan' && this.pet.quests['masterwork_crafting']) {
                     const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');
                     if (stageDef && !stageDef.isComplete) hasQuest = true;
                }

                const dialogueText = NarrativeSystem.getNPCDialogue(npcName, relLevel, hasQuest);
                this.pet.addJournalEntry(`Chatted with ${npcName}: "${dialogueText}"`);
                resultText = dialogueText;
            }
        }

        // Default Buttons
        options.push({ label: "Gift (Berries)", action: 'GIFT_CALLBACK' }); // Special flag for UI to callback with GIFT type
        options.push({ label: "Goodbye", action: null });

        return { text: resultText, options: options };
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
