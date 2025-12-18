import { Nadagotchi } from '../js/Nadagotchi';
import { Config } from '../js/Config';

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// Mock Phaser
const Phaser = {
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0]
        }
    }
};
global.Phaser = Phaser;

describe('Career System', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Setup initial career
        pet.currentCareer = 'Innovator';
        pet.unlockedCareers = ['Innovator'];
        pet.careerLevels = { 'Innovator': 1 };
        pet.careerXP = { 'Innovator': 0 };
        // Reset stats
        pet.stats.happiness = 70;
    });

    test('gainCareerXP should add XP and not promote if threshold not met', () => {
        const promoted = pet.gainCareerXP(50);
        expect(promoted).toBe(false);
        expect(pet.careerXP['Innovator']).toBe(50);
        expect(pet.careerLevels['Innovator']).toBe(1);
    });

    test('gainCareerXP should promote if threshold met', () => {
        // Threshold for Lv2 is 100
        pet.gainCareerXP(90);
        const promoted = pet.gainCareerXP(10);
        expect(promoted).toBe(true);
        expect(pet.careerXP['Innovator']).toBe(100);
        expect(pet.careerLevels['Innovator']).toBe(2);
        // Bonus
        expect(pet.stats.happiness).toBeGreaterThan(70);
    });

    test('switchCareer should change current career if unlocked', () => {
        pet.unlockedCareers.push('Scout');
        const success = pet.switchCareer('Scout');
        expect(success).toBe(true);
        expect(pet.currentCareer).toBe('Scout');
    });

    test('switchCareer should fail if locked', () => {
        const success = pet.switchCareer('Artisan');
        expect(success).toBe(false);
        expect(pet.currentCareer).toBe('Innovator');
    });
});
