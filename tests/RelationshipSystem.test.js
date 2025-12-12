
import { RelationshipSystem } from '../js/systems/RelationshipSystem.js';
import { Config } from '../js/Config.js';

// Mock Config to ensure stable values for testing
jest.mock('../js/Config.js', () => ({
    Config: {
        ACTIONS: {
            INTERACT_NPC: {
                ENERGY_COST: 5,
                CHAT_RELATIONSHIP: 1,
                CHAT_HAPPINESS: 1,
                CHAT_SKILL_GAIN: 1,
                FRIENDSHIP_DECAY: 1 // Value we will use for testing
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
                'Stranger': { level: 0 }
            },
            stats: {
                energy: 100,
                happiness: 100
            },
            skills: {
                communication: 0
            },
            getMoodMultiplier: () => 1,
            addJournalEntry: jest.fn(),
            inventory: {},
            inventorySystem: {
                removeItem: jest.fn()
            },
            quests: {}
        };
        // Circular reference simulation if needed, but here we pass pet to system
        relationshipSystem = new RelationshipSystem(petMock);
        // Attach system to pet if code expects it (not needed for these unit tests but good practice)
        petMock.relationshipSystem = relationshipSystem;
    });

    describe('interact', () => {
        test('should set interactedToday to true upon successful interaction', () => {
            relationshipSystem.interact('Friend');
            expect(petMock.relationships['Friend'].interactedToday).toBe(true);
        });

        test('should not set interactedToday if interaction fails (low energy)', () => {
            petMock.stats.energy = 0; // Below cost
            relationshipSystem.interact('Friend');
            expect(petMock.relationships['Friend'].interactedToday).toBeUndefined();
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
