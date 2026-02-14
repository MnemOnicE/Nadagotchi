
import { RelationshipSystem } from '../js/systems/RelationshipSystem.js';
import { Config } from '../js/Config.js';

// Mock Config to ensure stable values for testing
jest.mock('../js/Config.js', () => ({
    Config: {
        SECURITY: { DNA_SALT: '' },
        ACTIONS: {
            INTERACT_NPC: {
                ENERGY_COST: 5,
                CHAT_RELATIONSHIP: 1,
                CHAT_HAPPINESS: 1,
                CHAT_SKILL_GAIN: 1,
                FRIENDSHIP_DECAY: 1,
                GIFT_HAPPINESS: 10,
                GIFT_SKILL_GAIN: 0.2,
                GIFT_RELATIONSHIP: 5,
                SCOUT_SKILL_GAIN: 0.15,
                ARTISAN_SKILL_GAIN: 0.15,
                VILLAGER_SKILL_GAIN: 0.15
            }
        }
    }
}));

// Mock NarrativeSystem to avoid dependency on dialogue files
jest.mock('../js/NarrativeSystem.js', () => ({
    NarrativeSystem: {
        getNPCDialogue: jest.fn(() => "Hello there!")
    }
}));

describe('RelationshipSystem', () => {
    let petMock;
    let relationshipSystem;

    beforeEach(() => {
        petMock = {
            relationships: {
                'Friend': { level: 10 },
                'Stranger': { level: 0 },
                'Master Artisan': { level: 5 },
                'Grizzled Scout': { level: 3 },
                'Sickly Villager': { level: 3 }
            },
            stats: {
                energy: 100,
                happiness: 100
            },
            skills: {
                communication: 0,
                empathy: 0,
                navigation: 0,
                crafting: 0
            },
            getMoodMultiplier: jest.fn(() => 1),
            addJournalEntry: jest.fn(),
            inventory: {},
            inventorySystem: {
                removeItem: jest.fn()
            },
            questSystem: {
                getQuest: jest.fn(),
                completeDailyQuest: jest.fn(),
                startQuest: jest.fn(),
                checkRequirements: jest.fn(),
                advanceQuest: jest.fn(),
                getStageDefinition: jest.fn()
            },
            quests: {},
            dailyQuest: null
        };
        // Circular reference simulation if needed, but here we pass pet to system
        relationshipSystem = new RelationshipSystem(petMock);
        // Attach system to pet if code expects it (not needed for these unit tests but good practice)
        petMock.relationshipSystem = relationshipSystem;
    });

    describe('interact', () => {
        test('should return null if NPC is not known', () => {
            const result = relationshipSystem.interact('UnknownNPC');
            expect(result).toBeNull();
        });

        test('should set interactedToday to true upon successful interaction', () => {
            relationshipSystem.interact('Friend');
            expect(petMock.relationships['Friend'].interactedToday).toBe(true);
        });

        test('should not set interactedToday if interaction fails (low energy)', () => {
            petMock.stats.energy = 0; // Below cost
            relationshipSystem.interact('Friend');
            expect(petMock.relationships['Friend'].interactedToday).toBeUndefined();
        });

        test('should return error message if energy is too low', () => {
            petMock.stats.energy = 0;
            const result = relationshipSystem.interact('Friend');
            expect(result).toEqual({
                text: "I'm too tired to interact right now.",
                options: [{ label: "Close", action: null }]
            });
            expect(petMock.addJournalEntry).toHaveBeenCalledWith("I'm too tired to interact right now.");
        });

        describe('Daily Quests', () => {
            test('should show completion option if player has required items', () => {
                const q = { npc: 'Friend', item: 'Berries', qty: 5, text: "I need berries!", completed: false };
                petMock.dailyQuest = q;
                petMock.inventory['Berries'] = 10;

                const result = relationshipSystem.interact('Friend');

                expect(result.text).toContain("I need berries!");
                expect(result.text).toContain("(You have the Berries!)");

                const completeOption = result.options.find(o => o.label === "Complete Quest");
                expect(completeOption).toBeDefined();

                // Execute action
                completeOption.action();
                expect(petMock.questSystem.completeDailyQuest).toHaveBeenCalled();
            });

            test('should show requirement text if player is missing items', () => {
                const q = { npc: 'Friend', item: 'Berries', qty: 5, text: "I need berries!", completed: false };
                petMock.dailyQuest = q;
                petMock.inventory['Berries'] = 2; // Insufficient

                const result = relationshipSystem.interact('Friend');

                expect(result.text).toContain("I need berries!");
                expect(result.text).toContain("(Requires: 5 Berries)");

                const completeOption = result.options.find(o => o.label === "Complete Quest");
                expect(completeOption).toBeUndefined();
            });
        });

        describe('Master Artisan Quest', () => {
            test('should offer to start quest if relationship high enough and not started', () => {
                // Not started: quests empty
                // Relationship: 5 (set in beforeEach)

                const result = relationshipSystem.interact('Master Artisan');

                expect(result.text).toContain("Prove your dedication");
                const acceptOption = result.options.find(o => o.label === "Accept Quest");
                expect(acceptOption).toBeDefined();

                acceptOption.action();
                expect(petMock.questSystem.startQuest).toHaveBeenCalledWith('masterwork_crafting');
            });

            test('should show stage completion if requirements met', () => {
                petMock.quests['masterwork_crafting'] = { stage: 0 };
                petMock.questSystem.getStageDefinition.mockReturnValue({
                    description: "Craft a thing",
                    isComplete: false
                });
                petMock.questSystem.checkRequirements.mockReturnValue(true);

                const result = relationshipSystem.interact('Master Artisan');

                expect(result.text).toContain("Requirements Met!");
                const completeOption = result.options.find(o => o.label === "Complete Stage");
                expect(completeOption).toBeDefined();

                completeOption.action();
                expect(petMock.questSystem.advanceQuest).toHaveBeenCalledWith('masterwork_crafting');
            });

            test('should show progress text if requirements NOT met', () => {
                petMock.quests['masterwork_crafting'] = { stage: 0 };
                petMock.questSystem.getStageDefinition.mockReturnValue({
                    description: "Craft a thing",
                    isComplete: false
                });
                petMock.questSystem.checkRequirements.mockReturnValue(false);

                const result = relationshipSystem.interact('Master Artisan');

                expect(result.text).toContain("Craft a thing");
                expect(result.text).not.toContain("Requirements Met!");
                const completeOption = result.options.find(o => o.label === "Complete Stage");
                expect(completeOption).toBeUndefined();
            });
        });

        describe('Standard Interactions', () => {
            test('should handle GIFT interaction successfully', () => {
                petMock.inventory['Berries'] = 1;
                const result = relationshipSystem.interact('Friend', 'GIFT');

                expect(result.text).toContain("Thanks for the gift!");
                expect(petMock.inventorySystem.removeItem).toHaveBeenCalledWith('Berries', 1);
                // Check stats updates
                expect(petMock.relationships['Friend'].level).toBe(10 + Config.ACTIONS.INTERACT_NPC.GIFT_RELATIONSHIP);
                expect(petMock.stats.happiness).toBe(100 + Config.ACTIONS.INTERACT_NPC.GIFT_HAPPINESS);
                expect(petMock.skills.empathy).toBe(0 + Config.ACTIONS.INTERACT_NPC.GIFT_SKILL_GAIN);
            });

            test('should fallback to CHAT if GIFT interaction fails (no berries)', () => {
                petMock.inventory['Berries'] = 0;
                const result = relationshipSystem.interact('Friend', 'GIFT');

                // NarrativeSystem mock returns "Hello there!"
                expect(result.text).toBe("Hello there!");
                expect(petMock.inventorySystem.removeItem).not.toHaveBeenCalled();
                // Should apply CHAT stats instead
                expect(petMock.relationships['Friend'].level).toBe(10 + Config.ACTIONS.INTERACT_NPC.CHAT_RELATIONSHIP);
            });

            test('should apply skill bonuses for specific NPCs during CHAT', () => {
                // Grizzled Scout -> Navigation
                relationshipSystem.interact('Grizzled Scout');
                expect(petMock.skills.navigation).toBeCloseTo(Config.ACTIONS.INTERACT_NPC.SCOUT_SKILL_GAIN, 5);

                // Master Artisan -> Crafting
                // Set level < 5 to bypass "Start Quest" check so we hit the standard chat logic
                petMock.relationships['Master Artisan'].level = 4;
                relationshipSystem.interact('Master Artisan');
                expect(petMock.skills.crafting).toBeCloseTo(Config.ACTIONS.INTERACT_NPC.ARTISAN_SKILL_GAIN, 5);

                // Sickly Villager -> Empathy
                // Reset empathy first
                petMock.skills.empathy = 0;
                relationshipSystem.interact('Sickly Villager');
                expect(petMock.skills.empathy).toBeCloseTo(Config.ACTIONS.INTERACT_NPC.VILLAGER_SKILL_GAIN, 5);
            });

            test('should handle recurring interaction with rewards', () => {
                petMock.quests['masterwork_crafting'] = { stage: 99 }; // Completed
                petMock.questSystem.getStageDefinition.mockReturnValue({
                    isComplete: true,
                    recurringInteraction: {
                        journalEntry: "Good to see you again.",
                        rewards: {
                            skills: { crafting: 0.2 }
                        }
                    }
                });

                const result = relationshipSystem.interact('Master Artisan');

                expect(result.text).toBe("Good to see you again.");
                // CHAT bonus (0.15) + Recurring bonus (0.2) = 0.35
                expect(petMock.skills.crafting).toBeCloseTo(0.15 + 0.2, 5);
                expect(petMock.addJournalEntry).toHaveBeenCalledWith("Good to see you again.");
            });
        });
    });

    describe('dailyUpdate', () => {
        test('should decay relationship if not interacted today', () => {
            petMock.relationships['Friend'].interactedToday = false;
            relationshipSystem.dailyUpdate();
            // Start 10, Decay 1 -> 9
            expect(petMock.relationships['Friend'].level).toBe(9);
        });

        test('should NOT decay relationship if interacted today', () => {
            petMock.relationships['Friend'].interactedToday = true;
            relationshipSystem.dailyUpdate();
            // Start 10, No Decay -> 10
            expect(petMock.relationships['Friend'].level).toBe(10);
        });

        test('should reset interactedToday flag after update', () => {
            petMock.relationships['Friend'].interactedToday = true;
            relationshipSystem.dailyUpdate();
            expect(petMock.relationships['Friend'].interactedToday).toBe(false);
        });

        test('should clamp relationship level at 0', () => {
            petMock.relationships['Stranger'].level = 0.5;
            petMock.relationships['Stranger'].interactedToday = false;
            relationshipSystem.dailyUpdate();
            // 0.5 - 1 = -0.5 -> Clamped to 0
            expect(petMock.relationships['Stranger'].level).toBe(0);
        });

        test('should handle undefined interactedToday (legacy/default) as false', () => {
            // interactedToday is undefined
            relationshipSystem.dailyUpdate();
            expect(petMock.relationships['Friend'].level).toBe(9);
            expect(petMock.relationships['Friend'].interactedToday).toBe(false);
        });
    });
});
