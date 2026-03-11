import { jest } from '@jest/globals';
import { Nadagotchi } from '../../js/Nadagotchi.js';
import { DebrisSystem } from '../../js/systems/DebrisSystem.js';
import { setupPhaserMock } from '../helpers/mockPhaser.js';
import { setupLocalStorageMock } from '../helpers/mockLocalStorage.js';

// Shared setup for all performance tests in this suite
setupPhaserMock();
setupLocalStorageMock();

describe('Performance Benchmarks', () => {
    let pet;

    describe('Debris System', () => {
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
            console.log(`Debris Clean ${N_CLEAN}: ${(performance.now() - start).toFixed(2)}ms`);
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
            console.log(`Debris Penalty ${N_PENALTY}: ${(performance.now() - start).toFixed(2)}ms`);
        });
    });

    describe('updateDominantArchetype', () => {
        const iterations = 100000;

        beforeEach(() => {
            pet = new Nadagotchi('Intellectual');
        });

        test('Benchmark updateDominantArchetype', () => {
            const scenarios = [
                () => { pet.personalityPoints = { Adventurer: 10, Nurturer: 5, Mischievous: 2, Intellectual: 8, Recluse: 1 }; },
                () => {
                     pet.personalityPoints = { Adventurer: 10, Nurturer: 5, Mischievous: 2, Intellectual: 10, Recluse: 1 };
                     pet.skills.logic = 10;
                     pet.skills.navigation = 10;
                },
                () => {
                     pet.dominantArchetype = 'Mischievous';
                     pet.personalityPoints = { Adventurer: 10, Nurturer: 10, Mischievous: 2, Intellectual: 8, Recluse: 1 };
                     pet.skills.navigation = 10;
                     pet.skills.empathy = 10;
                },
                () => {
                    pet.personalityPoints = { Adventurer: 10, Nurturer: 10, Mischievous: 10, Intellectual: 10, Recluse: 10 };
               }
            ];

            const startTime = performance.now();
            const numScenarios = scenarios.length;

            for (let i = 0; i < iterations; i++) {
                scenarios[i % numScenarios]();
                pet.updateDominantArchetype();
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`Archetype Benchmark: Total ${duration.toFixed(2)}ms for ${iterations} iterations`);
            expect(true).toBe(true);
        });
    });
});
