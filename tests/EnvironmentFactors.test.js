
import { Nadagotchi } from '../js/Nadagotchi.js';

// Mock Phaser since it's not available in the Node.js test environment
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Nadagotchi Environmental Factors', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        pet.inventory = {};
        pet.environmentalFactors = [];
    });

    test('applyEnvironment should filter out items not in inventory', () => {
        // Setup factors
        pet.environmentalFactors = [
            { id: 'Heater', type: 'item', effect: 'warm' },
            { id: 'AC', type: 'item', effect: 'cold' },
            { id: 'RoomTemp', type: 'ambient', effect: 'warm' }
        ];

        // Give only 'Heater' to inventory
        pet.inventory['Heater'] = 1;

        // Apply environment
        // Heater (Owned, +5) + AC (Not Owned, 0) + RoomTemp (Ambient, +5) = 10
        const adjustment = pet.applyEnvironment({});

        expect(adjustment).toBe(10);
    });

    test('applyEnvironment should handle empty inventory', () => {
        pet.environmentalFactors = [
            { id: 'Heater', type: 'item', effect: 'warm' }
        ];

        const adjustment = pet.applyEnvironment({});
        expect(adjustment).toBe(0);
    });

    test('applyEnvironment should handle non-item factors always', () => {
        pet.environmentalFactors = [
            { id: 'SunnyDay', type: 'weather', effect: 'warm' }
        ];

        const adjustment = pet.applyEnvironment({});
        expect(adjustment).toBe(5);
    });
});
