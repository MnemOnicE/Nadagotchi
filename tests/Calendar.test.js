// tests/Calendar.test.js
const Calendar = require('../js/Calendar');

describe('Calendar', () => {
    let calendar;

    beforeEach(() => {
        calendar = new Calendar();
    });

    test('should initialize with day 1 and Spring', () => {
        expect(calendar.getDate()).toEqual({ day: 1, season: 'Spring' });
    });

    test('advanceDay should increment the day', () => {
        calendar.advanceDay();
        expect(calendar.getDate().day).toBe(2);
    });

    test('advanceDay should advance the season after the last day', () => {
        calendar.day = 28;
        calendar.advanceDay();
        expect(calendar.getDate()).toEqual({ day: 1, season: 'Summer' });
    });

    test('should cycle through all seasons', () => {
        calendar.season = 'Winter';
        calendar.day = 28;
        calendar.advanceDay();
        expect(calendar.getDate()).toEqual({ day: 1, season: 'Spring' });
    });
});
