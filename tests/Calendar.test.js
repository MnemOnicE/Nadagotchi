// tests/Calendar.test.js
const Calendar = require('../js/Calendar');
const fs = require('fs');
const path = require('path');

// Load the class from the source file
const calendarCode = fs.readFileSync(path.resolve(__dirname, '../js/Calendar.js'), 'utf8');
const Calendar = eval(calendarCode + '; module.exports = Calendar;');

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
});
