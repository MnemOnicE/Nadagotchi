import { jest } from '@jest/globals';
import { Nadagotchi } from '../../js/Nadagotchi.js';
import { DebrisSystem } from '../../js/systems/DebrisSystem.js';
import { setupPhaserMock } from '../helpers/mockPhaser.js';
import { setupLocalStorageMock } from '../helpers/mockLocalStorage.js';

// Consolidate mocks into shared setup to reduce line duplication across perf tests
setupPhaserMock();
setupLocalStorageMock();

describe('Performance: Debris System', () => {
    let pet;
    let system;
    const N_CLEAN = 10000;
    const N_PENALTY = 50000;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        pet.debris = {};
        pet.debrisCount = 0;
        system = new DebrisSystem(pet);
    });

    test('clean (O1)', () => {
        for (let i = 0; i < N_CLEAN; i++) {
            const id = `id-${i}`;
            pet.debris[id] = { id, type: 'weed', location: 'GARDEN', x: 0.5, y: 0.5, created: Date.now() };
        }
        pet.debrisCount = N_CLEAN;

        const start = performance.now();
        for (let i = N_CLEAN - 1; i >= 0; i--) {
            system.clean(`id-${i}`);
        }
        console.log(`Clean ${N_CLEAN}: ${(performance.now() - start).toFixed(2)}ms`);
    });

    test('penalty (Iter)', () => {
        const count = 100;
        for (let i = 0; i < count; i++) {
            const id = `d-${i}`;
            pet.debris[id] = { id, type: i % 2 === 0 ? 'weed' : 'poop', x: 0.5, y: 0.5, created: Date.now() };
        }
        pet.debrisCount = count;
        pet.recalculateCleanlinessPenalty();

        const start = performance.now();
        for (let i = 0; i < N_PENALTY; i++) {
            pet.live(16, { weather: 'Sunny', time: 'Day', activeEvent: null });
        }
        console.log(`Penalty ${N_PENALTY}: ${(performance.now() - start).toFixed(2)}ms`);
    });
});
