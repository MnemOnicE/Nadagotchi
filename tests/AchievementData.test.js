import { Achievements } from '../js/AchievementData.js';

describe('AchievementData', () => {
    it('should be an array', () => {
        expect(Array.isArray(Achievements)).toBe(true);
    });

    it('each achievement should have a valid structure', () => {
        Achievements.forEach(achievement => {
            expect(achievement).toHaveProperty('id');
            expect(typeof achievement.id).toBe('string');
            expect(achievement).toHaveProperty('name');
            expect(typeof achievement.name).toBe('string');
            expect(achievement).toHaveProperty('description');
            expect(typeof achievement.description).toBe('string');
            expect(achievement).toHaveProperty('icon');
            expect(typeof achievement.icon).toBe('string');
            expect(achievement).toHaveProperty('condition');
            expect(typeof achievement.condition).toBe('function');
        });
    });

    it('each achievement should have a valid condition function', () => {
        // Mock a progress object that would satisfy the condition
        const mockProgress = {
            craftCount: 10,
            exploreCount: 10,
            chatCount: 10,
            studyCount: 10,
        };

        // Another mock that should fail all conditions
        const failProgress = {
            craftCount: 0,
            exploreCount: 0,
            chatCount: 0,
            studyCount: 0,
        };

        Achievements.forEach(achievement => {
             // The condition should be evaluated properly
            expect(typeof achievement.condition(mockProgress)).toBe('boolean');

            // The conditions should pass with the mock progress
            expect(achievement.condition(mockProgress)).toBe(true);

            // The conditions should fail with the fail progress
            expect(achievement.condition(failProgress)).toBe(false);
        });
    });

    it('should evaluate individual conditions correctly', () => {
        const firstCraft = Achievements.find(a => a.id === 'first_craft');
        expect(firstCraft.condition({ craftCount: 0 })).toBe(false);
        expect(firstCraft.condition({ craftCount: 1 })).toBe(true);

        const noviceExplorer = Achievements.find(a => a.id === 'novice_explorer');
        expect(noviceExplorer.condition({ exploreCount: 4 })).toBe(false);
        expect(noviceExplorer.condition({ exploreCount: 5 })).toBe(true);

        const socialite = Achievements.find(a => a.id === 'socialite');
        expect(socialite.condition({ chatCount: 9 })).toBe(false);
        expect(socialite.condition({ chatCount: 10 })).toBe(true);

        const scholar = Achievements.find(a => a.id === 'scholar');
        expect(scholar.condition({ studyCount: 4 })).toBe(false);
        expect(scholar.condition({ studyCount: 5 })).toBe(true);
    });
});
