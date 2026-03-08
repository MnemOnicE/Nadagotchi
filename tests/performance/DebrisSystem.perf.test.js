import { jest } from '@jest/globals';
import { Nadagotchi } from '../../js/Nadagotchi.js';
import { DebrisSystem } from '../../js/systems/DebrisSystem.js';
import { setupPhaserMock } from '../helpers/mockPhaser.js';
import { setupLocalStorageMock } from '../helpers/mockLocalStorage.js';

// Setup Mocks
setupPhaserMock();
setupLocalStorageMock();

describe('Performance: Debris System', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        pet.debris = {};
        pet.debrisCount = 0;
    });

    test('clean (O1)', () => {
        const N = 10000;
        for (let i = 0; i < N; i++) {
            pet.debris[`id-${i}`] = { id: `id-${i}`, type: 'weed', location: 'GARDEN', x: 0.5, y: 0.5, created: Date.now() };
        }
        pet.debrisCount = N;
        const system = new DebrisSystem(pet);
        const start = performance.now();
        for (let i = N - 1; i >= 0; i--) system.clean(`id-${i}`);
        console.log(`Clean ${N}: ${(performance.now() - start).toFixed(2)}ms`);
    });

    test('penalty (Iter)', () => {
        const iter = 50000;
        const count = 100;
        for (let i = 0; i < count; i++) {
            pet.debris[`d-${i}`] = { id: `d-${i}`, type: i % 2 === 0 ? 'weed' : 'poop', x: 0.5, y: 0.5, created: Date.now() };
        }
        pet.debrisCount = count;
        pet.recalculateCleanlinessPenalty();
        const start = performance.now();
        for (let i = 0; i < iter; i++) pet.live(16, { weather: 'Sunny', time: 'Day', activeEvent: null });
        console.log(`Penalty ${iter}: ${(performance.now() - start).toFixed(2)}ms`);
    });
});
