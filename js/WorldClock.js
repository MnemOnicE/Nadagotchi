/**
 * WorldClock: Manages the in-game 24-hour clock and time-of-day transitions.
 * This class provides a more granular and controllable time system than a simple timer.
 */
class WorldClock {
    /**
     * @param {Phaser.Scene} scene - The Phaser scene this clock is attached to.
     * @param {number} dayDurationInSeconds - The total duration of a 24-hour in-game day in real-world seconds.
     */
    constructor(scene, dayDurationInSeconds = 240) { // 4 minutes for a full day
        this.scene = scene;
        this.dayDurationInMs = dayDurationInSeconds * 1000;

        // The current time of day, from 0 (midnight) to 1 (next midnight)
        this.time = 0.25; // Start at 6 AM (sunrise)

        // Define the periods of the day as fractions of the 24-hour cycle
        this.periods = {
            NIGHT: { start: 0, end: 0.2, name: "Night" },      // 00:00 - 04:48
            DAWN: { start: 0.2, end: 0.3, name: "Dawn" },      // 04:48 - 07:12
            DAY: { start: 0.3, end: 0.8, name: "Day" },        // 07:12 - 19:12
            DUSK: { start: 0.8, end: 0.9, name: "Dusk" },      // 19:12 - 21:36
            NIGHT_CONT: { start: 0.9, end: 1, name: "Night" } // 21:36 - 24:00
        };

    }

    /**
     * Updates the in-game time.
     * This should be called from the main scene's update loop.
     * @param {number} delta - The time elapsed since the last frame in milliseconds.
     */
    update(delta) {
        // Increment the time based on the real-world time that has passed
        this.time += delta / this.dayDurationInMs;

        // Wrap around at the end of the day
        if (this.time >= 1) {
            this.time -= 1;
        }
    }

    /**
     * Gets the current period of the day (e.g., "Day", "Night").
     * @returns {string} The name of the current period.
     */
    getCurrentPeriod() {
        for (const key in this.periods) {
            const period = this.periods[key];
            if (this.time >= period.start && this.time < period.end) {
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
