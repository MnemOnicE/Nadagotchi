import { jest } from '@jest/globals';
import { DebrisSystem } from '../js/systems/DebrisSystem';
import { Config } from '../js/Config';

describe('DebrisSystem', () => {
    let petMock;
    let debrisSystem;

    beforeEach(() => {
        petMock = {
            debris: [],
            rng: {
                random: jest.fn(),
                choice: jest.fn(arr => arr[0]), // Default pick first
                range: jest.fn(() => 50)
            },
            generateUUID: jest.fn(() => 'test-uuid'),
            addJournalEntry: jest.fn(),
            stats: {
                energy: 100,
                happiness: 50
            },
            skills: {
                resilience: 0
            },
            inventorySystem: {
                addItem: jest.fn()
            },
            recalculateCleanlinessPenalty: jest.fn(),
            location: 'GARDEN'
        };
        debrisSystem = new DebrisSystem(petMock);
    });

    test('spawnDaily adds debris when successful', () => {
        petMock.rng.random.mockReturnValue(0.1); // < 0.8
        petMock.rng.choice.mockReturnValue('weed');

        debrisSystem.spawnDaily('Summer', 'Sunny');

        expect(petMock.debris.length).toBe(1);
        expect(petMock.debris[0].type).toBe('weed');
        expect(petMock.recalculateCleanlinessPenalty).toHaveBeenCalled();
    });

    describe('Seasonal Spawning', () => {
        test('spawnDaily adds Spring in Berries', () => {
            petMock.rng.random.mockReturnValueOnce(0.1) // Base chance
                              .mockReturnValueOnce(0.1); // Berry chance < 0.3
            petMock.rng.choice.mockImplementation(arr => arr.includes('Berries') ? 'Berries' : arr[0]);

            debrisSystem.spawnDaily('Spring', 'Sunny');

            expect(petMock.debris[0].type).toBe('Berries');
        });

        test('spawnDaily adds Autumn in Sticks', () => {
            petMock.rng.random.mockReturnValueOnce(0.1) // Base chance
                              .mockReturnValueOnce(0.1); // Stick chance < 0.3
            petMock.rng.choice.mockImplementation(arr => arr.includes('Sticks') ? 'Sticks' : arr[0]);

            debrisSystem.spawnDaily('Autumn', 'Sunny');

            expect(petMock.debris[0].type).toBe('Sticks');
        });

        test('spawnDaily does not add Spring in Berries if random check fails', () => {
             petMock.rng.random.mockReturnValueOnce(0.1) // Base chance
                               .mockReturnValueOnce(0.9); // Berry fail

             debrisSystem.spawnDaily('Spring', 'Sunny');
             // choice will be called with default types
             expect(petMock.rng.choice).toHaveBeenCalledWith(expect.not.arrayContaining(['Berries']));
        });

        test('spawnDaily does not add Autumn in Sticks if random check fails', () => {
             petMock.rng.random.mockReturnValueOnce(0.1) // Base chance
                               .mockReturnValueOnce(0.9); // Stick fail

             debrisSystem.spawnDaily('Autumn', 'Sunny');
             expect(petMock.rng.choice).toHaveBeenCalledWith(expect.not.arrayContaining(['Sticks']));
        });
    });

    describe('Cleaning', () => {
        beforeEach(() => {
            petMock.debris = [{ id: 'test-uuid', type: 'weed', x:0, y:0 }];
        });

        test('clean removes item and applies rewards (Weed)', () => {
            const result = debrisSystem.clean('test-uuid');
            expect(result.success).toBe(true);
            expect(petMock.debris.length).toBe(0);
            expect(petMock.skills.resilience).toBeGreaterThan(0);
            expect(petMock.recalculateCleanlinessPenalty).toHaveBeenCalled();
        });

        test('clean (Poop) increases happiness', () => {
            petMock.debris = [{ id: 'poop-id', type: 'poop', x:0, y:0 }];
            debrisSystem.clean('poop-id');
            expect(petMock.stats.happiness).toBe(55); // 50 + 5
        });

        test('clean (rock_small) adds Shiny Stone to inventory', () => {
            petMock.debris = [{ id: 'rock-id', type: 'rock_small', x:0, y:0 }];
            debrisSystem.clean('rock-id');
            expect(petMock.inventorySystem.addItem).toHaveBeenCalledWith('Shiny Stone', 1);
        });

        test('clean (Berries) adds Berries to inventory', () => {
            petMock.debris = [{ id: 'berry-id', type: 'Berries', x:0, y:0 }];
            debrisSystem.clean('berry-id');
            expect(petMock.inventorySystem.addItem).toHaveBeenCalledWith('Berries', 1);
        });

        test('clean (Sticks) adds Sticks to inventory', () => {
            petMock.debris = [{ id: 'stick-id', type: 'Sticks', x:0, y:0 }];
            debrisSystem.clean('stick-id');
            expect(petMock.inventorySystem.addItem).toHaveBeenCalledWith('Sticks', 1);
        });
    });

    describe('spawnPoop', () => {
        test('spawnPoop adds poop item and journal entry', () => {
            petMock.rng.random.mockReturnValue(0.5); // Placement success, no funny entry
            debrisSystem.spawnPoop();
            expect(petMock.debris.length).toBe(1);
            expect(petMock.debris[0].type).toBe('poop');
            expect(petMock.addJournalEntry).toHaveBeenCalled();
            expect(petMock.recalculateCleanlinessPenalty).toHaveBeenCalled();
        });

        test('spawnPoop retries on overlap and finds valid spot', () => {
            // Mock existing debris at 0.5, 0.5
            petMock.debris = [{ x: 0.5, y: 0.5 }];

            // First attempt 0.5, 0.5 (fail), Second 0.1, 0.1 (success)
            petMock.rng.range
                .mockReturnValueOnce(50).mockReturnValueOnce(50) // 0.5, 0.5
                .mockReturnValueOnce(10).mockReturnValueOnce(10); // 0.1, 0.1

            debrisSystem.spawnPoop();
            expect(petMock.debris.length).toBe(2);
        });

        test('spawnPoop adds funny journal entry on chance', () => {
            petMock.rng.random.mockReturnValue(0.05); // < 0.1
            debrisSystem.spawnPoop();
            expect(petMock.addJournalEntry).toHaveBeenCalledWith(expect.stringContaining("natural gift"));
        });
    });
});
