// tests/Journal.test.js
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
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

describe('Journal Capping and Batching', () => {
    let pet;

    beforeEach(() => {
        global.localStorage.clear();
        pet = new Nadagotchi('Adventurer');
    });

    test('should cap journal entries at MAX_JOURNAL_ENTRIES', () => {
        const limit = Config.LIMITS.MAX_JOURNAL_ENTRIES;
        for (let i = 0; i < limit + 50; i++) {
            pet.addJournalEntry(`Entry ${i}`);
        }
        expect(pet.journal.length).toBe(limit);
        expect(pet.journal[0].text).toBe('Entry 50');
        expect(pet.journal[limit - 1].text).toBe(`Entry ${limit + 49}`);
    });

    test('should batch saves using queueMicrotask', (done) => {
        const saveSpy = jest.spyOn(pet.persistence, 'saveJournal');

        pet.addJournalEntry('Entry 1');
        pet.addJournalEntry('Entry 2');
        pet.addJournalEntry('Entry 3');

        // Immediately after calls, it shouldn't have been called yet because it's batched in a microtask
        expect(saveSpy).not.toHaveBeenCalled();

        // Wait for microtasks to flush
        queueMicrotask(() => {
            try {
                expect(saveSpy).toHaveBeenCalledTimes(1);
                expect(saveSpy).toHaveBeenCalledWith(pet.journal);
                saveSpy.mockRestore();
                done();
            } catch (error) {
                saveSpy.mockRestore();
                done(error);
            }
        });
    });
});
