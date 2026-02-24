
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
            range: jest.fn((min, max) => min)
        };
        this.stats = { energy: 100, happiness: 100 };
        this.skills = { resilience: 0 };
        this.inventorySystem = {
            addItem: jest.fn()
        };
        this.addJournalEntry = jest.fn();
        this._generateUUID = () => 'test-id';
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

    test('clean (Resource) adds to inventory', () => {
        pet.debris.push({ id: 'test-rock', type: 'rock_small' });

        system.clean('test-rock');

        expect(pet.inventorySystem.addItem).toHaveBeenCalledWith('Shiny Stone', 1);
    });
});
