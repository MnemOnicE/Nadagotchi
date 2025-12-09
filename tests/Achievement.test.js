import { AchievementManager } from '../js/AchievementManager.js';
import { EventKeys } from '../js/EventKeys.js';

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
});
