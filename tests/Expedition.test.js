// Manual Override: Patch Applied.
const { ExpeditionSystem } = require('../js/systems/ExpeditionSystem.js');
const { SeededRandom } = require('../js/utils/SeededRandom.js');

describe('ExpeditionSystem', () => {
    let system;
    let mockRng;

    beforeEach(() => {
        // Use a consistent seed for reproducibility in tests
        mockRng = new SeededRandom(12345);
        system = new ExpeditionSystem(mockRng);
    });

    test('should generate a path of specified length', () => {
        // Updated signature: season, weather, biome, length
        const path = system.generatePath('Spring', 'Sunny', 'Forest', 3);
        expect(path).toHaveLength(3);
        expect(path[0]).toHaveProperty('description');
        expect(path[0]).toHaveProperty('choices');
    });

    test('should filter nodes by season', () => {
        // FROZEN_POND is Winter only
        const pathSpring = system.generatePath('Spring', 'Sunny', 'Forest', 20);
        const hasWinterNodeInSpring = pathSpring.some(n => n.id === 'FROZEN_POND');
        expect(hasWinterNodeInSpring).toBe(false);
    });

    test('should filter nodes by biome', () => {
        // BERRY_BUSH: ['Forest', 'Plains']
        // Generate path in 'Desert'
        const pathDesert = system.generatePath('Summer', 'Sunny', 'Desert', 20);

        // Berry Bush should NOT appear in Desert
        const hasBerryBush = pathDesert.some(n => n.id === 'BERRY_BUSH');
        expect(hasBerryBush).toBe(false);

        // Generate path in 'Forest'
        const pathForest = system.generatePath('Summer', 'Sunny', 'Forest', 20);
        // It's possible to get Berry Bush here (though random, 20 is a good sample size for small pool)
        // We can't guarantee it without mocking RNG perfectly, but we can verify generic behavior
    });

    test('generic nodes should appear in any biome', () => {
        // RIVER_CROSSING: ['Forest', 'Plains', 'Mountain']
        // ANCIENT_RUINS has NO biome defined? Checking definitions...
        // Let's check a node with NO biome defined or explicitly generic.
        // Wait, definitions:
        // ANCIENT_RUINS: no biome property -> Generic (All biomes)

        const pathVolcano = system.generatePath('Summer', 'Sunny', 'Volcano', 50);
        // Should only contain generic nodes (ANCIENT_RUINS) or nodes with 'Volcano' (none)

        const validIds = pathVolcano.map(n => n.id);
        // We expect mostly ANCIENT_RUINS if that's the only valid one
        const hasForestItems = pathVolcano.some(n => n.id === 'BERRY_BUSH');
        expect(hasForestItems).toBe(false);

        const hasGeneric = pathVolcano.some(n => n.id === 'ANCIENT_RUINS');
        // Since ANCIENT_RUINS is weight 0.2 and it's the ONLY valid one, it must be selected
        expect(hasGeneric).toBe(true);
    });

    test('weighted selection should respect weights', () => {
        // Mock RNG to return specific values if possible, or just run statistical test.
        // ANCIENT_RUINS (0.2) vs MUDDY_SLOPE (weather filtered out usually)
        // Let's construct a scenario with known weights.

        // Use a mock node set if we could inject it, but we can't easily.
        // Let's use existing nodes.
        // Biome: Forest.
        // BERRY_BUSH (Default 1.0)
        // OLD_OAK (Default 1.0)
        // ANCIENT_RUINS (0.2)

        // Run 1000 trials
        const counts = { 'BERRY_BUSH': 0, 'ANCIENT_RUINS': 0 };
        const trials = 1000;

        for(let i=0; i<trials; i++) {
            // length 1
            const path = system.generatePath('Summer', 'Sunny', 'Forest', 1);
            if (path.length > 0) {
                const id = path[0].id;
                if (counts[id] !== undefined) counts[id]++;
            }
        }

        // Expect Berry Bush to be much more frequent than Ancient Ruins
        // Ratio roughly 1.0 vs 0.2 (5x difference)
        expect(counts['BERRY_BUSH']).toBeGreaterThan(counts['ANCIENT_RUINS'] * 2);
    });

    test('should resolve choice success based on skill', () => {
        const pet = {
            skills: { navigation: 10 },
        };
        const choice = {
            skill: 'navigation',
            difficulty: 5,
            success: { text: "Win" },
            failure: { text: "Lose" }
        };

        const result = system.resolveChoice(choice, pet);
        expect(result.outcome).toBe('success');
    });

    test('should resolve choice failure based on skill', () => {
        const pet = {
            skills: { navigation: 0 },
        };
        const choice = {
            skill: 'navigation',
            difficulty: 20,
            success: { text: "Win" },
            failure: { text: "Lose" }
        };

        const result = system.resolveChoice(choice, pet);
        expect(result.outcome).toBe('failure');
    });
});
