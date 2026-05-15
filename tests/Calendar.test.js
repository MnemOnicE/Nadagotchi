import { Calendar } from '../js/Calendar';

describe('Calendar', () => {
    let calendar;

    beforeEach(() => {
        calendar = new Calendar();
    });

    test('constructor should initialize a new calendar', () => {
        expect(calendar.day).toBe(1);
        expect(calendar.season).toBe('Spring');
    });

    test('constructor should load data from a save file', () => {
        const loadedData = { day: 15, season: 'Autumn' };
        const loadedCalendar = new Calendar(loadedData);
        expect(loadedCalendar.day).toBe(15);
        expect(loadedCalendar.season).toBe('Autumn');
    });

    test('advanceDay() should increment the day', () => {
        calendar.advanceDay();
        expect(calendar.day).toBe(2);
    });

    test('advanceDay() should transition to the next season', () => {
        calendar.day = 28;
        calendar.advanceDay();
        expect(calendar.day).toBe(1);
        expect(calendar.season).toBe('Summer');
    });

    test('advanceDay() should wrap around from Winter to Spring', () => {
        calendar.season = 'Winter';
        calendar.day = 28;
        calendar.advanceDay();
        expect(calendar.day).toBe(1);
        expect(calendar.season).toBe('Spring');
    });

    describe('advanceSeason()', () => {
        test('should transition from Spring to Summer', () => {
            calendar.advanceSeason();
            expect(calendar.season).toBe('Summer');
        });

        test('should transition from Summer to Autumn', () => {
            calendar.season = 'Summer';
            calendar.advanceSeason();
            expect(calendar.season).toBe('Autumn');
        });

        test('should transition from Autumn to Winter', () => {
            calendar.season = 'Autumn';
            calendar.advanceSeason();
            expect(calendar.season).toBe('Winter');
        });

        test('should wrap around from Winter to Spring', () => {
            calendar.season = 'Winter';
                        calendar.advanceSeason();
            expect(calendar.season).toBe('Spring');
        });

        test('should recover gracefully to Spring from an invalid season', () => {
            calendar.season = 'InvalidSeason';
                        calendar.advanceSeason();
            // indexOf('InvalidSeason') is -1. (-1 + 1) % 4 === 0, which corresponds to 'Spring'.
            expect(calendar.season).toBe('Spring');
                    });
    });
});
