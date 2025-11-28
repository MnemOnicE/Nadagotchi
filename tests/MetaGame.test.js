import { Nadagotchi } from '../js/Nadagotchi';
import { NarrativeSystem } from '../js/NarrativeSystem';

describe('Meta-Game Features', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('NarrativeSystem', () => {
        test('generates text for known archetype and event', () => {
            const text = NarrativeSystem.generateEntry('Adventurer', 'MOOD_CHANGE', { newMood: 'sad' });
            expect(text).toBe("I haven't been on an adventure in a while... feeling bored.");
        });

        test('falls back to Default for unknown archetype', () => {
            const text = NarrativeSystem.generateEntry('UnknownType', 'MOOD_CHANGE', { newMood: 'happy' });
            expect(text).toBe("I'm feeling good today!");
        });

        test('returns null for unknown event', () => {
            const text = NarrativeSystem.generateEntry('Adventurer', 'UNKNOWN_EVENT', {});
            expect(text).toBeNull();
        });
    });

    describe('Nadagotchi Journal Automation', () => {
        test('logs entry when mood changes', () => {
            const pet = new Nadagotchi('Adventurer');
            // Initial mood is 'neutral' (stats: 100, 100, 70)
            // Wait, constructor sets stats: 100, 100, 70.
            // live() logic:
            // if hunger < 10 -> angry
            // else if hunger < 30 || energy < 20 -> sad
            // else if hunger > 80 && energy > 80 -> happy
            // else -> neutral

            // Initial: 100, 100 -> Happy.
            // Wait, constructor sets mood = 'neutral'.
            // But stats are 100, 100.
            // So first live() call will switch it to 'happy'.

            // We want to verify that this switch logs an entry.
            // But we need to make sure the tracking logic is initialized correctly in constructor
            // so it doesn't log on first frame if we consider "initial state" as the start.
            // However, if the pet *becomes* happy immediately, maybe it should log?
            // "I'm feeling good today!" is a nice start.

            // Let's assume we implement it such that it tracks previous mood.

            pet.live(); // Should detect change from 'neutral' (constructor) to 'happy' (calculated)

            const lastEntry = pet.journal[pet.journal.length - 1];
            expect(lastEntry).toBeDefined();
            // Adventurer happy text
            const expectedTexts = ["I'm pumped! Where should we explore next?", "I feel unstoppable!"];
            expect(expectedTexts).toContain(lastEntry.text);
        });

        test('logs entry when weather changes', () => {
            const pet = new Nadagotchi('Recluse');
            // Establish baseline
            pet.live({ weather: 'Sunny', time: 'Day', activeEvent: null });

            // Initial log might happen due to mood change or first weather.
            const initialLogCount = pet.journal.length;

            // Change weather
            pet.live({ weather: 'Rainy', time: 'Day', activeEvent: null });

            expect(pet.journal.length).toBeGreaterThan(initialLogCount);
            const lastEntry = pet.journal[pet.journal.length - 1];
            expect(lastEntry.text).toBe("I love the rain. It keeps people away.");
        });

        test('logs entry on age milestone', () => {
             const pet = new Nadagotchi('Nurturer');
             // Age starts at 0.
             // Assume we log every 10 days? Or just integer changes?
             // Prompt said "Age milestones".
             // Let's assume we implement integer age change logging (e.g. Age 1, Age 2...)
             // or maybe larger chunks.
             // pet.age is a float.
             // Let's assume the implementation logs when Math.floor(age) increases.

             pet.age = 0.999;
             // next live adds 0.001 -> 1.0
             pet.live();

             const lastEntry = pet.journal[pet.journal.length - 1];
             // Nurturer age text
             expect(lastEntry.text).toBe("I'm growing older. I hope I've made the world kinder.");
        });
    });
});
