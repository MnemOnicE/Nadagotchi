import { jest } from '@jest/globals';
import { Nadagotchi } from '../js/Nadagotchi.js';
import { setupPhaserMock } from './helpers/mockPhaser';
import { setupLocalStorageMock } from './helpers/mockLocalStorage';
import { Config } from '../js/Config';

setupPhaserMock();
setupLocalStorageMock();

describe('Debris System Functional Tests', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        pet.debris = {};
        pet.recalculateCleanlinessPenalty();
    });

    test('Spawn Daily Debris puts items in GARDEN', () => {
        // Use spy to control random chance for spawn logic
        jest.spyOn(pet.rng, 'random').mockReturnValue(0.0); // Ensures spawn condition pass

        pet.debrisSystem.spawnDaily('Spring', 'Sunny');

        const debrisValues = Object.values(pet.debris);
        expect(debrisValues.length).toBeGreaterThan(0);
        expect(debrisValues[0].location).toBe('GARDEN');
    });

    test('Spawn Poop puts items in current location', () => {
        pet.location = 'Kitchen';

        // Use spy to ensure valid placement search succeeds
        jest.spyOn(pet.rng, 'random').mockReturnValue(0.1);
        jest.spyOn(pet.rng, 'range').mockReturnValue(50); // Mock range for coords if needed

        pet.debrisSystem.spawnPoop();
        const debrisValues = Object.values(pet.debris);
        expect(debrisValues.length).toBeGreaterThan(0);
        const poop = debrisValues.find(d => d.type === 'poop');
        expect(poop.location).toBe('Kitchen');
    });

    test('Penalty calculation includes Global + Local', () => {
        // 1. Add debris manually with location
        pet.debris['id-1'] = { type: 'weed', location: 'GARDEN' };
        pet.debris['id-2'] = { type: 'poop', location: 'Kitchen' };
        pet.recalculateCleanlinessPenalty();

        const weedPenalty = Config.DEBRIS.HAPPINESS_PENALTY_PER_WEED;
        const poopPenalty = Config.DEBRIS.HAPPINESS_PENALTY_PER_POOP;

        expect(pet._cachedGlobalPenalty).toBeCloseTo(weedPenalty + poopPenalty);
        expect(pet._cachedLocalPenalties['GARDEN']).toBeCloseTo(weedPenalty);
        expect(pet._cachedLocalPenalties['Kitchen']).toBeCloseTo(poopPenalty);
    });
});
