/**
 * @fileoverview Manages the in-game day-night cycle.
 * Calculates time progression, periods (Day, Night, Dawn, Dusk), and daylight factors for rendering.
 */

/**
 * WorldClock: Manages the in-game 24-hour clock and time-of-day transitions.
 * This class provides a more granular and controllable time system than a simple timer.
 * @class WorldClock
 */
export class WorldClock {
    /**
     * Creates a new WorldClock.
     * @param {Phaser.Scene} scene - The Phaser scene this clock is attached to.
     * @param {number} dayDurationInSeconds - The total duration of a 24-hour in-game day in real-world seconds.
     */
    constructor(scene, dayDurationInSeconds = 420) { // 7 minutes for a full day
        /** @type {Phaser.Scene} Reference to the Phaser scene. */
        this.scene = scene;
        /** @type {number} Duration of a game day in milliseconds. */
        this.dayDurationInMs = dayDurationInSeconds * 1000;

        // The current time of day, from 0 (midnight) to 1 (next midnight)
        /** @type {number} Current normalized time (0.0 to 1.0). */
        this.time = 0.25; // Start at 6 AM (sunrise)

        // Define the periods of the day as fractions of the 24-hour cycle
        /** @type {Object.<string, {start: number, end: number, name: string}>} Time period definitions. */
        this.periods = {
            NIGHT: { start: 0, end: 0.2, name: "Night" },      // 00:00 - 04:48
            DAWN: { start: 0.2, end: 0.3, name: "Dawn" },      // 04:48 - 07:12
            DAY: { start: 0.3, end: 0.8, name: "Day" },        // 07:12 - 19:12
            DUSK: { start: 0.8, end: 0.9, name: "Dusk" },      // 19:12 - 21:36
            NIGHT_CONT: { start: 0.9, end: 1, name: "Night" } // 21:36 - 24:00
        };

        /** @type {?{start: number, end: number, name: string}} Cached reference to the current period object. */
        /** @type {?{start: number, end: number, name: string}} Cache for the current period to avoid redundant lookups. */
        this._cachedPeriod = null;
    }

    /**
     * Updates the in-game time.
     * This should be called from the main scene's update loop.
     * @param {number} delta - The time elapsed since the last frame in milliseconds.
     * @returns {boolean} True if a new day has started (midnight crossed), false otherwise.
     */
    update(delta) {
        // Increment the time based on the real-world time that has passed
        this.time += delta / this.dayDurationInMs;

        // Wrap around at the end of the day
        if (this.time >= 1) {
            this.time -= 1;
            return true;
        }
        return false;
    }

    /**
     * Gets the current period of the day (e.g., "Day", "Night").
     * @returns {string} The name of the current period.
     */
    getCurrentPeriod() {
        // Optimization: Check if the time is still within the cached period
        if (this._cachedPeriod && this.time >= this._cachedPeriod.start && this.time < this._cachedPeriod.end) {
            return this._cachedPeriod.name;
        }

        for (const key in this.periods) {
            const period = this.periods[key];
            if (this.time >= period.start && this.time < period.end) {
                this._cachedPeriod = period;
                return period.name;
            }
        }
        return "Night"; // Default case
    }

    /**
     * Calculates a value between 0 and 1 representing the transition from night to day and back.
     * 0 = full night, 1 = full day. This is useful for interpolating colors.
     * @returns {number} The day/night interpolation factor.
     */
    getDaylightFactor() {
        const time = this.time;
        if (time >= this.periods.DAWN.start && time < this.periods.DAY.start) {
            // Transition from night (0) to day (1) during Dawn
            return (time - this.periods.DAWN.start) / (this.periods.DAY.start - this.periods.DAWN.start);
        } else if (time >= this.periods.DAY.start && time < this.periods.DUSK.start) {
            // Full daylight
            return 1;
        } else if (time >= this.periods.DUSK.start && time < this.periods.NIGHT_CONT.start) {
            // Transition from day (1) to night (0) during Dusk
            return 1 - ((time - this.periods.DUSK.start) / (this.periods.NIGHT_CONT.start - this.periods.DUSK.start));
        }
        // Full night
        return 0;
    }
}
