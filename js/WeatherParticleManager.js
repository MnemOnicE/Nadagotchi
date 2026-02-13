/**
 * @fileoverview Manages visual weather effects using Phaser particles.
 */
export class WeatherParticleManager {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.emitters = {};
        this.currentWeather = null;
        this.currentSeason = null;

        this.createEmitters();
    }

    createEmitters() {
        const width = this.scene.scale.width;
        // Rain
        const rainManager = this.scene.add.particles('rain_drop');
        rainManager.setDepth(50); // In front of pet
        this.emitters.rain = rainManager.createEmitter({
            x: { min: 0, max: width },
            y: -10,
            lifespan: 1000,
            speedY: { min: 300, max: 500 },
            speedX: { min: -10, max: 10 },
            quantity: 2,
            on: false
        });

        // Snow
        const snowManager = this.scene.add.particles('snow_flake');
        snowManager.setDepth(50);
        this.emitters.snow = snowManager.createEmitter({
            x: { min: 0, max: width },
            y: -10,
            lifespan: 3000,
            speedY: { min: 50, max: 100 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.5, end: 1.0 },
            quantity: 1,
            on: false
        });

        // Leaves (Autumn)
        const leafManager = this.scene.add.particles('leaf');
        leafManager.setDepth(50);
        this.emitters.leaf = leafManager.createEmitter({
            x: { min: 0, max: width },
            y: -10,
            lifespan: 4000,
            speedY: { min: 30, max: 60 },
            speedX: { min: -50, max: 50 },
            rotate: { min: 0, max: 360 },
            quantity: 0, // Very sparse
            on: false
        });
    }

    /**
     * Updates active emitters based on weather and season.
     * @param {string} weather
     * @param {string} season
     */
    update(weather, season) {
        // Optimization: Only change if state changed
        if (this.currentWeather === weather && this.currentSeason === season) return;
        this.currentWeather = weather;
        this.currentSeason = season;

        // Reset all
        Object.values(this.emitters).forEach(e => e.stop());

        // Weather Overrides
        if (weather === 'Rainy') {
            this.emitters.rain.setQuantity(2);
            this.emitters.rain.start();
        } else if (weather === 'Stormy') {
            this.emitters.rain.setQuantity(5);
            this.emitters.rain.speedY = { min: 500, max: 800 }; // Faster
            this.emitters.rain.start();
        } else if (weather === 'Snowy' || (season === 'Winter' && weather !== 'Sunny')) {
             // Treat cold days as chance of snow if not sunny
             this.emitters.snow.start();
        }

        // Seasonal Ambient
        if (season === 'Autumn' && weather !== 'Rainy' && weather !== 'Stormy') {
            this.emitters.leaf.setFrequency(2000); // 1 every 2s
            this.emitters.leaf.start();
        }
    }

    resize(width, height) {
        // Update emitter bounds
        Object.values(this.emitters).forEach(e => {
            e.setPosition(0, -10); // Reset origin
            // Correct way to reset width using Phaser 3 API
            e.setEmitZone({
                source: new Phaser.Geom.Rectangle(0, -10, width, 1),
                type: 'random'
            });
        });

        // Update bounds for killing particles when they leave the screen
        if (this.emitters.rain) this.emitters.rain.setBounds(0, 0, width, height);
    }
}
