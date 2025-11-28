/**
 * WeatherSystem: Manages the in-game weather, transitions, and effects.
 */
export class WeatherSystem {
    /**
     * @param {Phaser.Scene} scene - The Phaser scene this system is attached to.
     */
    constructor(scene) {
        this.scene = scene;
        this.weatherTypes = ["Sunny", "Cloudy", "Rainy", "Stormy"];
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
     * Gets the current weather.
     * @returns {string} The current weather type.
     */
    getCurrentWeather() {
        return this.currentWeather;
    }
}
