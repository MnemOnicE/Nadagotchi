// tests/EventManager.test.js
const fs = require('fs');
const path = require('path');

// Load the classes from the source files
const eventManagerCode = fs.readFileSync(path.resolve(__dirname, '../js/EventManager.js'), 'utf8');
const EventManager = eval(eventManagerCode + '; module.exports = EventManager;');

const calendarCode = fs.readFileSync(path.resolve(__dirname, '../js/Calendar.js'), 'utf8');
const Calendar = eval(calendarCode + '; module.exports = Calendar;');

describe('EventManager', () => {
    let eventManager;
    let mockCalendar;

    beforeEach(() => {
        // Mock the Calendar dependency
        mockCalendar = {
            getDate: jest.fn(),
        };
        eventManager = new EventManager(mockCalendar);
    });

    test('should have no active event on a normal day', () => {
        mockCalendar.getDate.mockReturnValue({ season: 'Spring', day: 1 });
        eventManager.update();
        expect(eventManager.getActiveEvent()).toBeNull();
    });

    test('should trigger the Spring Bloom Festival on the correct date', () => {
        mockCalendar.getDate.mockReturnValue({ season: 'Spring', day: 5 });
        eventManager.update();
        const activeEvent = eventManager.getActiveEvent();
        expect(activeEvent).not.toBeNull();
        expect(activeEvent.name).toBe('SpringBloomFestival');
    });

    test('should trigger the Traveling Merchant when Math.random is less than 0.01', () => {
        mockCalendar.getDate.mockReturnValue({ season: 'Summer', day: 10 });
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.009);
        eventManager.update();
        const activeEvent = eventManager.getActiveEvent();
        expect(activeEvent).not.toBeNull();
        expect(activeEvent.name).toBe('TravelingMerchant');
        spy.mockRestore();
    });

    test('should also trigger the Traveling Merchant when Math.random is less than 0.005', () => {
        mockCalendar.getDate.mockReturnValue({ season: 'Summer', day: 10 });
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.004);
        eventManager.update();
        const activeEvent = eventManager.getActiveEvent();
        expect(activeEvent).not.toBeNull();
        // This is due to the order of events in the EventManager.
        // The TravelingMerchant is checked before the MeteorShower.
        expect(activeEvent.name).toBe('TravelingMerchant');
        spy.mockRestore();
    });

    test('should not trigger a spontaneous event when Math.random is high', () => {
        mockCalendar.getDate.mockReturnValue({ season: 'Summer', day: 10 });
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        eventManager.update();
        expect(eventManager.getActiveEvent()).toBeNull();
        spy.mockRestore();
    });
});
