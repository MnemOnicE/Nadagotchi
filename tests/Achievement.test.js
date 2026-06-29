import { AchievementManager } from '../js/AchievementManager.js';
import { EventKeys } from '../js/EventKeys.js';
import { PersistenceManager } from '../js/PersistenceManager.js';

// Mock PersistenceManager
jest.mock('../js/PersistenceManager.js', () => {
    return {
        PersistenceManager: jest.fn().mockImplementation(() => {
            return {
                loadAchievements: () => ({ unlocked: [], progress: {} }),
                saveAchievements: jest.fn(),
                loadJournal: () => [],
                loadRecipes: () => [],
                loadSettings: () => ({})
            };
        })
    };
});

describe('AchievementManager', () => {
    let gameMock;
    let manager;

    beforeEach(() => {
        gameMock = {
            events: {
                on: jest.fn(),
                emit: jest.fn()
            }
        };
        // Reset mocks
        jest.clearAllMocks();
        manager = new AchievementManager(gameMock);
    });

    it('should subscribe to events', () => {
        expect(gameMock.events.on).toHaveBeenCalledWith(EventKeys.UI_ACTION, expect.any(Function), manager);
        expect(gameMock.events.on).toHaveBeenCalledWith(EventKeys.WORK_RESULT, expect.any(Function), manager);
    });

    it('should unlock First Craft achievement', () => {
        // Find handler
        const handler = manager.handleUIAction.bind(manager);

        // Trigger craft
        handler(EventKeys.CRAFT_ITEM, {});

        expect(manager.state.progress.craftCount).toBe(1);
        expect(manager.state.unlocked).toContain('first_craft');
        expect(gameMock.events.emit).toHaveBeenCalledWith(EventKeys.ACHIEVEMENT_UNLOCKED, expect.objectContaining({ id: 'first_craft' }));
        expect(manager.persistence.saveAchievements).toHaveBeenCalled();
    });

    it('should not unlock achievement twice', () => {
        const handler = manager.handleUIAction.bind(manager);

        handler(EventKeys.CRAFT_ITEM, {});
        expect(gameMock.events.emit).toHaveBeenCalledTimes(1);

        // Craft again
        handler(EventKeys.CRAFT_ITEM, {});
        expect(manager.state.progress.craftCount).toBe(2);
        // Should not emit unlock again
        expect(gameMock.events.emit).toHaveBeenCalledTimes(1);
    });

    describe('NPC Interactions', () => {
        it('should increment chat count for generic NPC interactions', () => {
            const handler = manager.handleUIAction.bind(manager);

            // Test with a generic interaction string
            handler(EventKeys.INTERACT_NPC, {});
            expect(manager.state.progress.chatCount).toBe(1);

            // Test with another valid interaction
            handler(EventKeys.INTERACT_VILLAGER, {});
            expect(manager.state.progress.chatCount).toBe(2);
        });

        it('should NOT increment chat count for excluded interactions', () => {
            const handler = manager.handleUIAction.bind(manager);
            const excludedEvents = [
                EventKeys.INTERACT_BOOKSHELF,
                EventKeys.INTERACT_PLANT,
                EventKeys.INTERACT_FANCY_BOOKSHELF,
            ];

            excludedEvents.forEach((eventKey) => {
                handler(eventKey, {});
                expect(manager.state.progress.chatCount).toBe(0);
            });
        });

        it('should unlock Socialite achievement after 10 chats', () => {
            const handler = manager.handleUIAction.bind(manager);

            // Simulate 9 chats
            for (let i = 0; i < 9; i++) {
                handler(EventKeys.INTERACT_NPC, {});
            }
            expect(manager.state.progress.chatCount).toBe(9);
            expect(manager.state.unlocked).not.toContain('socialite');

            // 10th chat
            handler(EventKeys.INTERACT_NPC, {});
            expect(manager.state.progress.chatCount).toBe(10);

            // Verify unlock
            expect(manager.state.unlocked).toContain('socialite');
            expect(gameMock.events.emit).toHaveBeenCalledWith(
                EventKeys.ACHIEVEMENT_UNLOCKED,
                expect.objectContaining({ id: 'socialite' })
            );
        });
    });

    describe('Action Events', () => {
        it('should increment explore count and unlock Novice Explorer', () => {
            const handler = manager.handleUIAction.bind(manager);

            for (let i = 0; i < 4; i++) {
                handler(EventKeys.EXPLORE, {});
            }
            expect(manager.state.progress.exploreCount).toBe(4);
            expect(manager.state.unlocked).not.toContain('novice_explorer');

            handler(EventKeys.EXPLORE, {});
            expect(manager.state.progress.exploreCount).toBe(5);
            expect(manager.state.unlocked).toContain('novice_explorer');
            expect(gameMock.events.emit).toHaveBeenCalledWith(
                EventKeys.ACHIEVEMENT_UNLOCKED,
                expect.objectContaining({ id: 'novice_explorer' })
            );
        });

        it('should increment study count and unlock Scholar', () => {
            const handler = manager.handleUIAction.bind(manager);

            for (let i = 0; i < 4; i++) {
                handler(EventKeys.STUDY, {});
            }
            expect(manager.state.progress.studyCount).toBe(4);
            expect(manager.state.unlocked).not.toContain('scholar');

            handler(EventKeys.STUDY, {});
            expect(manager.state.progress.studyCount).toBe(5);
            expect(manager.state.unlocked).toContain('scholar');
            expect(gameMock.events.emit).toHaveBeenCalledWith(
                EventKeys.ACHIEVEMENT_UNLOCKED,
                expect.objectContaining({ id: 'scholar' })
            );
        });

        it('should do nothing on unknown string action type', () => {
            const handler = manager.handleUIAction.bind(manager);
            handler('SOME_RANDOM_ACTION', {});
            expect(manager.persistence.saveAchievements).not.toHaveBeenCalled();
        });

        it('should not throw error or change when actionType is not a string', () => {
            const handler = manager.handleUIAction.bind(manager);

            handler(123, {});
            expect(manager.persistence.saveAchievements).not.toHaveBeenCalled();
        });
    });

    describe('Work Results', () => {
        it('should increment craft count on successful crafting work result', () => {
            manager.handleWorkResult({ success: true, craftedItem: 'Sword' });
            expect(manager.state.progress.craftCount).toBe(1);
            expect(manager.state.unlocked).toContain('first_craft');
            expect(manager.persistence.saveAchievements).toHaveBeenCalled();
        });

        it('should not increment craft count on unsuccessful crafting work result', () => {
            manager.handleWorkResult({ success: false, craftedItem: 'Sword' });
            expect(manager.state.progress.craftCount).toBeUndefined();
        });

        it('should not increment craft count on work result missing craftedItem', () => {
            manager.handleWorkResult({ success: true });
            expect(manager.state.progress.craftCount).toBeUndefined();
        });
    });

    describe('Initialization Edge Cases', () => {
        /**
         * Sets the PersistenceManager mock implementation to return a specific state.
         * @param {object} state - The state object to return from loadAchievements.
         * @returns {void}
         */
        const mockLoadResponse = (state) => {
            PersistenceManager.mockImplementationOnce(() => ({
                loadAchievements: () => state,
                saveAchievements: jest.fn()
            }));
        };

        it('should initialize missing state.unlocked property when undefined', () => {
            mockLoadResponse({ unlocked: undefined, progress: {} });
            const newManager = new AchievementManager(gameMock);
            expect(newManager.state.unlocked).toEqual([]);
            expect(newManager.state.progress).toEqual({});
        });

        it('should initialize missing state.progress property when undefined', () => {
            mockLoadResponse({ unlocked: [], progress: undefined });
            const newManager = new AchievementManager(gameMock);
            expect(newManager.state.unlocked).toEqual([]);
            expect(newManager.state.progress).toEqual({});
        });

        it('should handle false properties', () => {
            mockLoadResponse({ unlocked: false, progress: false });
            const newManager = new AchievementManager(gameMock);
            expect(newManager.state.unlocked).toEqual([]);
            expect(newManager.state.progress).toEqual({});
        });

        it('should initialize completely null state properties explicitly', () => {
            mockLoadResponse({ unlocked: null, progress: null });
            const newManager = new AchievementManager(gameMock);
            expect(newManager.state.unlocked).toEqual([]);
            expect(newManager.state.progress).toEqual({});
        });

        it('should initialize missing state properties (empty object)', () => {
            mockLoadResponse({});
            const newManager = new AchievementManager(gameMock);
            expect(newManager.state.unlocked).toEqual([]);
            expect(newManager.state.progress).toEqual({});
        });
    });

    describe('checkAchievements', () => {
        it('should skip already unlocked achievements', () => {
            // Force craftCount to 1 so the condition would be met
            manager.state.progress.craftCount = 1;

            // Add to unlockedSet directly
            manager.unlockedSet.add('first_craft');
            manager.state.unlocked.push('first_craft');

            // Should not emit or save again
            manager.checkAchievements();

            expect(gameMock.events.emit).not.toHaveBeenCalled();
            expect(manager.persistence.saveAchievements).not.toHaveBeenCalled();
        });
    });
});
