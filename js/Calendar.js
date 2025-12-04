/**
 * @fileoverview Manages the in-game calendar system, tracking days and seasons.
 * Provides functionality for time progression and season switching.
 */

/**
 * Manages the in-game date, seasons, and time.
 * @class Calendar
 */
export class Calendar {
    /**
     * Initializes the calendar.
     * @param {object} [loadedData=null] - Optional saved data to load from (restoring state).
     * @param {number} [loadedData.day] - The current day number.
     * @param {string} [loadedData.season] - The current season name.
     */
    constructor(loadedData = null) {
        if (loadedData) {
            /** @type {number} The current day of the season. */
            this.day = loadedData.day;
            /** @type {string} The current season (Spring, Summer, Autumn, Winter). */
            this.season = loadedData.season;
        } else {
            this.day = 1;
            this.season = 'Spring';
        }
        /** @type {number} The number of days per season. */
        this.daysPerSeason = 28; // For example, 4 weeks
    }

    /**
     * Advances the in-game day by one.
     * Automatically handles the transition to the next season if the last day is reached.
     */
    advanceDay() {
        this.day++;
        if (this.day > this.daysPerSeason) {
            this.day = 1;
            this.advanceSeason();
        }
    }

    /**
     * Advances to the next season in the cycle.
     * Order: Spring -> Summer -> Autumn -> Winter -> Spring.
     * @private
     */
    advanceSeason() {
        const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
        const currentSeasonIndex = seasons.indexOf(this.season);
        const nextSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
        this.season = seasons[nextSeasonIndex];
    }

    /**
     * Retrieves the current date.
     * @returns {{day: number, season: string}} An object containing the current day and season.
     */
    getDate() {
        return { day: this.day, season: this.season };
    }
}
