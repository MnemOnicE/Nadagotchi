import { GeneticsSystem, Genome } from '../../js/GeneticsSystem.js';

describe('GeneticsSystem Performance', () => {
    test('breed() with large environmental items list', () => {
        const parentGenome = new Genome(); // Random wild genome

        // Construct a large environmental items list
        // Mix of valid items and noise
        const validItems = [
            'Ancient Tome', 'Heart Amulet', 'Muse Flower', 'Nutrient Bar',
            'Espresso', 'Chamomile', 'Metabolism-Slowing Tonic', 'book',
            'Fancy Bookshelf', 'Masterwork Chair', 'Logic-Boosting Snack',
            'Stamina-Up Tea', 'Shiny Stone', 'Frostbloom', 'Berries'
        ];

        const environmentalItems = [];
        // Create 200 items to simulate a full inventory or environment
        for (let i = 0; i < 200; i++) {
            if (i % 3 === 0) {
                environmentalItems.push(validItems[i % validItems.length]);
            } else {
                environmentalItems.push(`JunkItem_${i}`);
            }
        }

        const iterations = 50000; // Increase iterations to make difference more noticeable
        const start = Date.now();

        for (let i = 0; i < iterations; i++) {
            GeneticsSystem.breed(parentGenome, environmentalItems);
        }

        const end = Date.now();
        const duration = end - start;

        console.log(`[Benchmark] GeneticsSystem.breed x ${iterations} with ${environmentalItems.length} items: ${duration}ms`);

        // Assert that it runs within a reasonable time (e.g. < 10000ms) to pass as a test
        // This is a loose bound just to prevent timeout
        expect(duration).toBeLessThan(10000);
    });
});
