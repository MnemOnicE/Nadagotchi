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
     * @returns {string|null} The dialogue text to display, or null if interaction failed.
     */
    interact(npcName, interactionType = 'CHAT') {
        if (!this.pet.relationships.hasOwnProperty(npcName)) {
            return null;
        }

        // Check for energy cost
        if (this.pet.stats.energy < Config.ACTIONS.INTERACT_NPC.ENERGY_COST) {
            this.pet.addJournalEntry("I'm too tired to interact right now.");
            return null;
        }

        this.pet.stats.energy -= Config.ACTIONS.INTERACT_NPC.ENERGY_COST;

        if (interactionType === 'GIFT' && this.pet.inventory['Berries'] > 0) {
            this.pet.inventorySystem.removeItem('Berries', 1);
            this.pet.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.GIFT_RELATIONSHIP;
            this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.GIFT_HAPPINESS;
            this.pet.skills.empathy += Config.ACTIONS.INTERACT_NPC.GIFT_SKILL_GAIN;
            const text = "Thanks for the gift!";
            this.pet.addJournalEntry(`I gave Berries to ${npcName}. They seemed to like it!`);
            return text;
        }

        const moodMultiplier = this.pet.getMoodMultiplier();

        this.pet.relationships[npcName].level += Config.ACTIONS.INTERACT_NPC.CHAT_RELATIONSHIP;
        this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.CHAT_HAPPINESS;
        this.pet.skills.communication += Config.ACTIONS.INTERACT_NPC.CHAT_SKILL_GAIN;

        switch (npcName) {
            case 'Grizzled Scout':
                this.pet.skills.navigation += Config.ACTIONS.INTERACT_NPC.SCOUT_SKILL_GAIN * moodMultiplier;
                break;
            case 'Master Artisan':
                if (this.pet.relationships['Master Artisan'].level >= 5) {
                    const questId = 'masterwork_crafting';
                    const qs = this.pet.questSystem;
                    const q = qs.getQuest(questId);

                    if (!q) {
                        qs.startQuest(questId);
                    } else {
                        const stageDef = qs.getStageDefinition(questId);
                        if (stageDef && stageDef.isComplete) {
                            // Recurring Interaction for Completed Quest
                            if (stageDef.recurringInteraction) {
                                const recurring = stageDef.recurringInteraction;
                                if (recurring.rewards && recurring.rewards.skills && recurring.rewards.skills.crafting) {
                                    this.pet.skills.crafting += recurring.rewards.skills.crafting * moodMultiplier;
                                }
                                if (recurring.journalEntry) {
                                    this.pet.addJournalEntry(recurring.journalEntry);
                                }
                            }
                        } else {
                            // Try to advance quest
                            if (!qs.advanceQuest(questId)) {
                                // Failed to advance (requirements not met)
                                if (stageDef && stageDef.description) {
                                    this.pet.addJournalEntry(stageDef.description);
                                }
                            }
                        }
                    }
                } else {
                    this.pet.skills.crafting += Config.ACTIONS.INTERACT_NPC.ARTISAN_SKILL_GAIN * moodMultiplier;
                }
                break;
            case 'Sickly Villager':
                this.pet.skills.empathy += Config.ACTIONS.INTERACT_NPC.VILLAGER_SKILL_GAIN * moodMultiplier;
                break;
        }

        const relLevel = this.pet.relationships[npcName].level;
        // Check quest active state via QuestSystem
        const quest = this.pet.questSystem.getQuest('masterwork_crafting');
        // Legacy: check if stage < 3. Definitions say stage 3 is isComplete=true.
        // NarrativeSystem expects 'hasQuest' to mean "Quest is In Progress"
        // So we check if quest exists AND is not complete.
        let hasQuest = false;
        if (npcName === 'Master Artisan' && quest) {
            const stageDef = this.pet.questSystem.getStageDefinition('masterwork_crafting');
            if (stageDef && !stageDef.isComplete) {
                hasQuest = true;
            }
        }

        const dialogueText = NarrativeSystem.getNPCDialogue(npcName, relLevel, hasQuest);
        this.pet.addJournalEntry(`Chatted with ${npcName}: "${dialogueText}"`);

        return dialogueText;
    }
}
