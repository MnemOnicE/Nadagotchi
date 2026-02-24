
import { DebrisSystem } from '../js/systems/DebrisSystem.js';
import { Config } from '../js/Config.js';

// Mock Config if necessary, but we are importing the real one which is just data.
// Mock Pet
class MockPet {
    constructor() {
        this.debris = [];
        this.rng = {
            random: jest.fn(),
            choice: jest.fn(arr => arr[0]),
            range: jest.fn((min, max) => min) // Default returns min
        };
        this.stats = { energy: 100, happiness: 100 };
        this.skills = { resilience: 0 };
        this.inventorySystem = {
            addItem: jest.fn()
        };
        this.addJournalEntry = jest.fn();
        this.generateUUID = () => 'test-id';
    }
}

describe('DebrisSystem', () => {
    let pet;
    let system;

    beforeEach(() => {
        pet = new MockPet();
        system = new DebrisSystem(pet);
        jest.clearAllMocks();
    });

    test('spawnDaily adds debris when successful', () => {
        // Force random to pass check (> CHANCE, so we need low number for success? No, spawnDaily logic is:
        // if (random() > CHANCE) return;
        // Config.DEBRIS.SPAWN_CHANCE_DAILY is 0.8
        // So 0.1 passes.
        pet.rng.random.mockReturnValue(0.1);
        pet.rng.choice.mockReturnValue('weed');

        system.spawnDaily('Spring', 'Sunny');

        expect(pet.debris.length).toBe(1);
        expect(pet.debris[0].type).toBe('weed');
        expect(pet.addJournalEntry).toHaveBeenCalled();
    });

    test('spawnDaily respects max count', () => {
        // Fill debris
        for (let i = 0; i < Config.DEBRIS.MAX_COUNT; i++) {
            pet.debris.push({});
        }
        pet.rng.random.mockReturnValue(0.1);

        system.spawnDaily('Spring', 'Sunny');
        expect(pet.debris.length).toBe(Config.DEBRIS.MAX_COUNT); // Should not increase
    });

    describe('Seasonal Spawning', () => {
        test.each([
            ['Spring', 'Berries'],
            ['Autumn', 'Sticks']
        ])('spawnDaily adds %s in %s', (season, expectedItem) => {
            // 1st random: 0.1 (<= 0.8) -> Continue
            // 2nd random: 0.2 (< 0.3) -> Add seasonal item
            pet.rng.random.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);

            // Mock choice to return the last element (which should be the seasonal item)
            pet.rng.choice.mockImplementation(arr => arr[arr.length - 1]);

            system.spawnDaily(season, 'Sunny');

            expect(pet.debris.length).toBe(1);
            expect(pet.debris[0].type).toBe(expectedItem);
            expect(pet.rng.choice).toHaveBeenCalledWith(expect.arrayContaining([expectedItem]));
        });

        test.each([
            ['Spring', 'Berries'],
            ['Autumn', 'Sticks']
        ])('spawnDaily does not add %s in %s if random check fails', (season, item) => {
            // 1st random: 0.1 (<= 0.8) -> Continue
            // 2nd random: 0.4 (>= 0.3) -> Do NOT add seasonal item
            pet.rng.random.mockReturnValueOnce(0.1).mockReturnValueOnce(0.4);
            pet.rng.choice.mockImplementation(arr => arr[0]);

            system.spawnDaily(season, 'Sunny');

            expect(pet.rng.choice).toHaveBeenCalledWith(['weed', 'rock_small']);
        });
    });

    describe('Cleaning', () => {
        test('clean removes item and applies rewards (Weed)', () => {
            pet.debris.push({ id: 'test-weed', type: 'weed' });

            const result = system.clean('test-weed');

            expect(result.success).toBe(true);
            expect(pet.debris.length).toBe(0);
            expect(pet.stats.energy).toBe(100 - Config.DEBRIS.CLEAN_ENERGY_COST);
            expect(pet.skills.resilience).toBe(Config.DEBRIS.CLEAN_SKILL_GAIN);
        });

        test('clean fails if not enough energy', () => {
            pet.debris.push({ id: 'test-weed', type: 'weed' });
            pet.stats.energy = 0;

            const result = system.clean('test-weed');
            expect(result.success).toBe(false);
            expect(pet.debris.length).toBe(1);
        });

        test('clean (Poop) increases happiness', () => {
            pet.debris.push({ id: 'test-poop', type: 'poop' });
            pet.stats.happiness = 50;

            system.clean('test-poop');

            expect(pet.stats.happiness).toBe(55);
            expect(pet.skills.resilience).toBeGreaterThan(Config.DEBRIS.CLEAN_SKILL_GAIN);
        });

        test.each([
            ['rock_small', 'Shiny Stone'],
            ['Berries', 'Berries'],
            ['Sticks', 'Sticks']
        ])('clean (%s) adds %s to inventory', (type, expectedInventoryItem) => {
            pet.debris.push({ id: 'test-item', type: type });

            system.clean('test-item');

            expect(pet.inventorySystem.addItem).toHaveBeenCalledWith(expectedInventoryItem, 1);
        });
    });

    describe('spawnPoop', () => {
        test('spawnPoop adds poop item and journal entry', () => {
            pet.rng.random.mockReturnValue(0.2); // Not funny (>= 0.1)

            // Mock rng.range to return valid coordinates (e.g. 50 -> 0.5)
            pet.rng.range.mockReturnValue(50);

            system.spawnPoop();

            expect(pet.debris.length).toBe(1);
            expect(pet.debris[0].type).toBe('poop');
            expect(pet.debris[0].x).toBe(0.5);
            expect(pet.debris[0].y).toBe(0.5);
            expect(pet.addJournalEntry).toHaveBeenCalledWith(expect.stringMatching(/Something smells/));
        });

        test('spawnPoop respects max count', () => {
            // Fill debris
            for (let i = 0; i < Config.DEBRIS.MAX_COUNT; i++) {
                pet.debris.push({ x: 0.1 * i, y: 0.1 * i });
            }

            system.spawnPoop();
            expect(pet.debris.length).toBe(Config.DEBRIS.MAX_COUNT);
        });

        test('spawnPoop retries on overlap and finds valid spot', () => {
            // Pre-fill item at (0.5, 0.5)
            pet.debris.push({ id: 'existing', x: 0.5, y: 0.5 });

            // rng.range calls come in pairs: (x, y).
            // First call pair: Return (50, 50) -> (0.5, 0.5) -> COLLISION
            // Second call pair: Return (80, 80) -> (0.8, 0.8) -> VALID
            pet.rng.range
                .mockReturnValueOnce(50).mockReturnValueOnce(50) // 1st attempt (Fail)
                .mockReturnValueOnce(80).mockReturnValueOnce(80); // 2nd attempt (Success)

            system.spawnPoop();

            expect(pet.debris.length).toBe(2);
            const newItem = pet.debris[1];
            expect(newItem.type).toBe('poop');
            expect(newItem.x).toBe(0.8);
            expect(newItem.y).toBe(0.8);
        });

        test('spawnPoop aborts if no valid spot found', () => {
             // Pre-fill item at (0.5, 0.5)
             pet.debris.push({ id: 'existing', x: 0.5, y: 0.5 });

             // Force rng to always return (50, 50) -> Collision
             pet.rng.range.mockReturnValue(50);

             system.spawnPoop();

             // Should not add item
             expect(pet.debris.length).toBe(1);
        });

        test('spawnPoop adds funny journal entry on chance', () => {
            pet.rng.random.mockReturnValue(0.05); // < 0.1 -> Funny
            pet.rng.range.mockReturnValue(50);

            system.spawnPoop();

            expect(pet.addJournalEntry).toHaveBeenCalledWith(expect.stringMatching(/natural gift/));
        });
    });
});
