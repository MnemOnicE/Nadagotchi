/**
 * @fileoverview Manages dynamic and seasonal events within the game world.
 * Checks triggers daily to activate festivals or spontaneous events.
 */

/**
 * Manages all dynamic and seasonal events in the game.
 * @class EventManager
 */
export class EventManager {
    /**
     * Creates a new EventManager.
     * @param {import('./Calendar.js').Calendar} calendar - A reference to the game's calendar instance.
     */
    constructor(calendar) {
        /** @type {import('./Calendar.js').Calendar} Reference to the calendar system. */
        this.calendar = calendar;
        /** @type {?object} The currently active event, or null if none. */
        this.activeEvent = null;

        /**
         * @type {Object.<string, {type: string, trigger: function(object): boolean, description: string}>}
         * Definitions of all possible events.
         */
        this.eventDefinitions = {
            // --- SEASONAL FESTIVALS ---
            'SpringEquinoxFestival': {
                type: 'festival',
                // This festival happens on the 14th day of Spring.
                trigger: (date) => date.season === 'Spring' && date.day === 14,
                // A description to be shown to the player.
                description: 'The Spring Equinox Festival is today! The day and night are in perfect balance.'
            },
            'SummerSolsticeCelebration': {
                type: 'festival',
                trigger: (date) => date.season === 'Summer' && date.day === 14,
                description: 'The Summer Solstice Celebration! The longest day of the year brings endless fun.'
            },
            'AutumnEquinoxFeast': {
                type: 'festival',
                trigger: (date) => date.season === 'Autumn' && date.day === 14,
                description: 'The Autumn Equinox Feast. A time to reflect as the nights grow longer.'
            },
            'WinterSolsticeFestival': {
                type: 'festival',
                trigger: (date) => date.season === 'Winter' && date.day === 14,
                description: 'The Winter Solstice Festival. Celebrating the return of the light on the darkest day.'
            },

            // --- RARE, SPONTANEOUS EVENTS ---
            'TravelingMerchant': {
                type: 'spontaneous',
                // This event has a 1% chance of triggering each day.
                trigger: () => Math.random() < 0.01,
                description: 'A mysterious Traveling Merchant has arrived in town, offering rare goods.'
            },
            'MeteorShower': {
                type: 'spontaneous',
                 // This event has a 0.5% chance of triggering each day.
                trigger: () => Math.random() < 0.005,
                description: 'A beautiful meteor shower is expected tonight! A perfect night for stargazing.'
            }
        };
    }

    /**
     * Checks if any events should be active based on the current date or random chance.
     * This should be called once per in-game day (e.g., when the calendar advances).
     */
    update() {
        this.activeEvent = null; // Reset the active event each day.
        const currentDate = this.calendar.getDate();

        for (const eventName in this.eventDefinitions) {
            const event = this.eventDefinitions[eventName];
            // Check if the event's trigger condition is met.
            if (event.trigger(currentDate)) {
                this.activeEvent = {
                    name: eventName,
                    description: event.description
                };
                // Stop after finding the first active event for the day.
                // This prevents multiple events from clashing.
                break;
            }
        }
    }

    /**
     * Returns the currently active event, if any.
     * @returns {?object} The active event object containing name and description, or null if no event is active.
     */
    getActiveEvent() {
        return this.activeEvent;
    }
}
