import { Nadagotchi } from '../js/Nadagotchi';
import { QuestSystem } from '../js/systems/QuestSystem';

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

describe('Daily Quest System', () => {
    let pet;
    let questSystem;

    beforeEach(() => {
        pet = new Nadagotchi('Adventurer');
        questSystem = pet.questSystem;
        pet.inventory = {};
    });

    test('generateDailyQuest should create a quest', () => {
        const quest = questSystem.generateDailyQuest('Spring');
        expect(quest).not.toBeNull();
        expect(pet.dailyQuest).toBe(quest);
        expect(quest.id).toMatch(/dq_spring_/);
    });

    test('completeDailyQuest should fail if requirements not met', () => {
        pet.dailyQuest = {
             id: 'test_quest',
             type: 'FETCH',
             item: 'Berries',
             qty: 3,
             completed: false,
             npc: 'Friend'
        };

        pet.inventory['Berries'] = 2;
        const result = questSystem.completeDailyQuest();
        expect(result).toBe(false);
        expect(pet.dailyQuest.completed).toBe(false);
    });

    test('completeDailyQuest should succeed if requirements met', () => {
        pet.dailyQuest = {
             id: 'test_quest',
             type: 'FETCH',
             item: 'Berries',
             qty: 3,
             completed: false,
             npc: 'Friend'
        };
        pet.relationships['Friend'] = { level: 0 };
        pet.inventory['Berries'] = 3;

        // Ensure career exists for XP gain
        pet.currentCareer = 'Scout';
        pet.careerLevels['Scout'] = 1;
        pet.careerXP['Scout'] = 0;

        const result = questSystem.completeDailyQuest();
        expect(result).toBe(true);
        expect(pet.inventory['Berries'] || 0).toBe(0);
        expect(pet.dailyQuest.completed).toBe(true);
        expect(pet.relationships['Friend'].level).toBe(1);
        expect(pet.careerXP['Scout']).toBeGreaterThan(0);
    });
});
