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
                    this._handleArtisanQuest();
                } else {
                    this.pet.skills.crafting += Config.ACTIONS.INTERACT_NPC.ARTISAN_SKILL_GAIN * moodMultiplier;
                }
                break;
            case 'Sickly Villager':
                this.pet.skills.empathy += Config.ACTIONS.INTERACT_NPC.VILLAGER_SKILL_GAIN * moodMultiplier;
                break;
        }

        const relLevel = this.pet.relationships[npcName].level;
        // Check quest active state: Exists AND is not completed (Stage 3 is complete)
        const quest = this.pet.quests['masterwork_crafting'];
        const hasQuest = (quest && quest.stage < 3 && npcName === 'Master Artisan');

        const dialogueText = NarrativeSystem.getNPCDialogue(npcName, relLevel, hasQuest);
        this.pet.addJournalEntry(`Chatted with ${npcName}: "${dialogueText}"`);

        return dialogueText;
    }

    /**
     * Handles the logic for the Master Artisan's quest line.
     * @private
     */
    _handleArtisanQuest() {
        if (!this.pet.quests['masterwork_crafting']) {
            this.pet.quests['masterwork_crafting'] = { stage: 1, name: 'Masterwork Crafting' };
            this.pet.addJournalEntry("The Master Artisan sees potential in me. He asked for 5 Sticks to prove my dedication.");
            return;
        }

        const quest = this.pet.quests['masterwork_crafting'];

        if (quest.stage === 1) {
            if ((this.pet.inventory['Sticks'] || 0) >= 5) {
                // Check if we already know the recipe (unlikely if in stage 1, but safe)
                // Accessing InventorySystem directly
                if (this.pet.inventorySystem.discoverRecipe("Masterwork Chair")) {
                    this.pet.inventorySystem.removeItem('Sticks', 5);
                    quest.stage = 2;
                    this.pet.addJournalEntry("I gave the Sticks to the Artisan. He taught me how to make a Masterwork Chair! I need to craft one to show him.");
                } else {
                     // Should not happen unless they learned it elsewhere
                     // Advance quest anyway if they already know it
                    this.pet.inventorySystem.removeItem('Sticks', 5);
                    quest.stage = 2;
                }
            } else {
                this.pet.addJournalEntry("The Master Artisan is waiting for 5 Sticks.");
            }
        } else if (quest.stage === 2) {
            if (quest.hasCraftedChair && this.pet.inventory['Masterwork Chair'] && this.pet.inventory['Masterwork Chair'] > 0) {
                this.pet.inventorySystem.removeItem('Masterwork Chair', 1);
                quest.stage = 3;
                this.pet.skills.crafting += Config.ACTIONS.INTERACT_NPC.QUEST_CRAFTING_GAIN;
                this.pet.stats.happiness += Config.ACTIONS.INTERACT_NPC.QUEST_HAPPINESS_GAIN;
                this.pet.addJournalEntry("The Master Artisan was impressed by my chair! He declared me a true craftsman.");
            } else {
                this.pet.addJournalEntry("I need to craft a Masterwork Chair to show the Artisan.");
            }
        } else {
            // Completed
            const moodMultiplier = this.pet.getMoodMultiplier();
            this.pet.skills.crafting += 0.2 * moodMultiplier;
            this.pet.addJournalEntry("The Master Artisan greeted me warmly as a fellow master. We discussed advanced crafting theory.");
        }
    }
}
