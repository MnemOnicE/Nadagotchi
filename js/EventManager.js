/**
 * Manages all dynamic and seasonal events in the game.
 */
class EventManager {
    /**
     * @param {Calendar} calendar - A reference to the game's calendar instance.
     */
    constructor(calendar) {
        this.calendar = calendar;
        this.activeEvent = null;

        // Define all possible events in the game.
        // In a larger game, this could be loaded from a JSON file.
        this.eventDefinitions = {
            // --- SEASONAL FESTIVALS ---
            'SpringBloomFestival': {
                type: 'festival',
                // This festival happens on the 5th day of Spring.
                trigger: (date) => date.season === 'Spring' && date.day === 5,
                // A description to be shown to the player.
                description: 'The Spring Bloom Festival is today! The air is filled with pollen and joy.'
            },
            'SummerSandcastleContest': {
                type: 'festival',
                trigger: (date) => date.season === 'Summer' && date.day === 15,
                description: 'The annual Summer Sandcastle Contest is happening at the beach!'
            },
            'AutumnHarvestFair': {
                type: 'festival',
                trigger: (date) => date.season === 'Autumn' && date.day === 10,
                description: 'Visit the Autumn Harvest Fair for pumpkin carving and delicious treats.'
            },
            'WinterLightParade': {
                type: 'festival',
                trigger: (date) => date.season === 'Winter' && date.day === 20,
                description: 'The magical Winter Light Parade is tonight!'
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
     * This should be called once per day.
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
     * @returns {object|null} The active event object or null if no event is active.
     */
    getActiveEvent() {
        return this.activeEvent;
    }
}
