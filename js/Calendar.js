/**
 * Manages the in-game date, seasons, and time.
 */
export class Calendar {
    /**
     * Initializes the calendar.
     * @param {object} [loadedData=null] - Optional saved data to load from.
     */
    constructor(loadedData = null) {
        if (loadedData) {
            this.day = loadedData.day;
            this.season = loadedData.season;
        } else {
            this.day = 1;
            this.season = 'Spring';
        }
        this.daysPerSeason = 28; // For example, 4 weeks
    }

    /**
     * Advances the in-game day by one.
     * Handles the transition between seasons.
     */
    advanceDay() {
        this.day++;
        if (this.day > this.daysPerSeason) {
            this.day = 1;
            this.advanceSeason();
        }
    }

    /**
     * Advances the season.
     * @private
     */
    advanceSeason() {
        const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
        const currentSeasonIndex = seasons.indexOf(this.season);
        const nextSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
        this.season = seasons[nextSeasonIndex];
    }

    /**
     * Gets the current date.
     * @returns {{day: number, season: string}} The current date.
     */
    getDate() {
        return { day: this.day, season: this.season };
    }
}
