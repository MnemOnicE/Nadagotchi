/**
 * @fileoverview Manages the in-game weather system.
 * Rotates between different weather states on a timer to provide dynamic environmental effects.
 */

/**
 * WeatherSystem: Manages the in-game weather, transitions, and effects.
 * @class WeatherSystem
 */
export class WeatherSystem {
    /**
     * Creates a new WeatherSystem.
     * @param {Phaser.Scene} scene - The Phaser scene this system is attached to.
     */
    constructor(scene) {
        /** @type {Phaser.Scene} Reference to the Phaser scene. */
        this.scene = scene;
        /** @type {string[]} List of possible weather types. */
        this.weatherTypes = ["Sunny", "Cloudy", "Rainy", "Stormy"];
        /** @type {string} The current active weather. */
        this.currentWeather = "Sunny";

        // Timer for changing weather
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(30000, 90000), // Change weather every 30-90 seconds
            callback: this.changeWeather,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Changes the current weather to a new, random type.
     * Ensures the new weather is different from the current one.
     */
    changeWeather() {
        const newWeather = Phaser.Utils.Array.GetRandom(this.weatherTypes);

        // Avoid instantly switching to the same weather
        if (newWeather === this.currentWeather) {
            this.changeWeather();
            return;
        }

        this.currentWeather = newWeather;

        // Optionally, you could emit an event here for other game systems to react to
        this.scene.game.events.emit('weatherChanged', this.currentWeather);

    }

    /**
     * Retrieves the current weather state.
     * @returns {string} The current weather type (e.g., 'Sunny', 'Rainy').
     */
    getCurrentWeather() {
        return this.currentWeather;
    }
}
