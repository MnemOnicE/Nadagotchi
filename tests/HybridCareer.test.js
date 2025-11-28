
import { Nadagotchi } from '../js/Nadagotchi';

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

describe('Hybrid Career System', () => {
    let pet;

    beforeEach(() => {
        pet = new Nadagotchi('Intellectual');
        // Reset skills to ensure clean state
        pet.skills = {
            communication: 1, resilience: 1, navigation: 0,
            empathy: 0, logic: 0, focus: 0, crafting: 0,
            research: 0 // Will be added by my changes
        };
    });

    test('should initialize research skill in constructor', () => {
        const newPet = new Nadagotchi('Adventurer');
        expect(newPet.skills.research).toBeDefined();
        expect(newPet.skills.research).toBe(0);
    });

    test('STUDY should increase research skill', () => {
        const initialResearch = pet.skills.research || 0;
        pet.handleAction('STUDY');
        expect(pet.skills.research).toBeGreaterThan(initialResearch);
    });

    test('INTERACT_BOOKSHELF should increase research skill', () => {
        const initialResearch = pet.skills.research || 0;
        pet.handleAction('INTERACT_BOOKSHELF');
        expect(pet.skills.research).toBeGreaterThan(initialResearch);
    });

    test('should unlock Archaeologist hybrid career when requirements are met', () => {
        // Requirements: High Adventurer, High Intellectual, Research, Navigation
        pet.personalityPoints.Adventurer = 15;
        pet.personalityPoints.Intellectual = 15;
        pet.skills.navigation = 11;
        pet.skills.research = 11;

        // Ensure standard career requirements are NOT met to test hybrid priority or exclusivity
        // Innovator needs Intellectual dominant + Logic > 10.
        // Let's keep logic low.
        pet.skills.logic = 5;

        pet.updateCareer();
        expect(pet.currentCareer).toBe('Archaeologist');
    });

    test('should prioritize Hybrid Career over Standard Career if requirements for both are met', () => {
        // Set up for Innovator (Standard)
        pet.dominantArchetype = 'Intellectual';
        pet.skills.logic = 11;

        // Set up for Archaeologist (Hybrid)
        pet.personalityPoints.Adventurer = 15;
        pet.personalityPoints.Intellectual = 15; // Tie or dominant
        pet.skills.navigation = 11;
        pet.skills.research = 11;

        // Force update dominant archetype logic might mess things up,
        // so let's just set points such that requirements are met.
        // updateCareer checks dominantArchetype for standard careers.
        // If I implement hybrid check *before* standard check, it should win.

        pet.updateCareer();
        expect(pet.currentCareer).toBe('Archaeologist');
    });
});
