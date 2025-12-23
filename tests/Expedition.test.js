// Manual Override: Patch Applied.
const { ExpeditionSystem } = require('../js/systems/ExpeditionSystem.js');
const { SeededRandom } = require('../js/utils/SeededRandom.js');

describe('ExpeditionSystem', () => {
    let system;
    let mockRng;

    beforeEach(() => {
        mockRng = new SeededRandom(12345);
        system = new ExpeditionSystem(mockRng);
    });

    test('should generate a path of specified length', () => {
        const path = system.generatePath('Spring', 'Sunny', 3);
        expect(path).toHaveLength(3);
        expect(path[0]).toHaveProperty('description');
        expect(path[0]).toHaveProperty('choices');
    });

    test('should filter nodes by season', () => {
        // FROZEN_POND is Winter only
        const pathSpring = system.generatePath('Spring', 'Sunny', 20);
        const hasWinterNodeInSpring = pathSpring.some(n => n.id === 'FROZEN_POND');
        expect(hasWinterNodeInSpring).toBe(false);
    });

    test('should resolve choice success based on skill', () => {
        // Mock pet
        const pet = {
            skills: { navigation: 10 }, // High skill
        };
        const choice = {
            skill: 'navigation',
            difficulty: 5,
            success: { text: "Win" },
            failure: { text: "Lose" }
        };

        // RNG range(0, 10) -> let's say it returns 0. 0 + 10 >= 5. Success.
        const result = system.resolveChoice(choice, pet);
        expect(result.outcome).toBe('success');
    });

    test('should resolve choice failure based on skill', () => {
        const pet = {
            skills: { navigation: 0 },
        };
        const choice = {
            skill: 'navigation',
            difficulty: 20, // Impossible
            success: { text: "Win" },
            failure: { text: "Lose" }
        };

        const result = system.resolveChoice(choice, pet);
        expect(result.outcome).toBe('failure');
    });
});
