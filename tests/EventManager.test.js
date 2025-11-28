import { EventManager } from '../js/EventManager';
import { Calendar } from '../js/Calendar';

describe('EventManager', () => {
    let eventManager;
    let calendar;

    beforeEach(() => {
        calendar = new Calendar();
        eventManager = new EventManager(calendar);
    });

    test('should not have an active event on a normal day', () => {
        calendar.day = 1;
        calendar.season = 'Spring';
        eventManager.update();
        expect(eventManager.getActiveEvent()).toBeNull();
    });

    test('should activate a seasonal festival on the correct date', () => {
        calendar.day = 5;
        calendar.season = 'Spring';
        eventManager.update();
        const activeEvent = eventManager.getActiveEvent();
        expect(activeEvent).not.toBeNull();
        expect(activeEvent.name).toBe('SpringBloomFestival');
    });

    test('should deactivate an event on the following day', () => {
        calendar.day = 5;
        calendar.season = 'Spring';
        eventManager.update();
        expect(eventManager.getActiveEvent()).not.toBeNull();

        calendar.advanceDay(); // Move to day 6
        eventManager.update();
        expect(eventManager.getActiveEvent()).toBeNull();
    });

    test('should activate a spontaneous event when its trigger condition is met', () => {
        // Mock Math.random to control the outcome
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.001); // Force the event to trigger

        eventManager.update();
        const activeEvent = eventManager.getActiveEvent();
        expect(activeEvent).not.toBeNull();
        expect(activeEvent.name).toBe('TravelingMerchant');

        Math.random = originalRandom; // Restore original Math.random
    });

    test('should not activate a spontaneous event when its trigger condition is not met', () => {
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.9); // Force the event to not trigger

        eventManager.update();
        expect(eventManager.getActiveEvent()).toBeNull();

        Math.random = originalRandom;
    });

    test('should only activate one event per day', () => {
        calendar.day = 5;
        calendar.season = 'Spring'; // This will trigger the SpringBloomFestival

        // Mock Math.random to also trigger a spontaneous event
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.001);

        eventManager.update();
        const activeEvent = eventManager.getActiveEvent();
        expect(activeEvent.name).toBe('SpringBloomFestival'); // The seasonal event should take precedence

        Math.random = originalRandom;
    });
});
