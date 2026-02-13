/**
 * @fileoverview Manages the visual rendering of the sky.
 * Handles the day/night cycle gradients and star rendering.
 */

/**
 * @class SkyManager
 * @classdesc
 * Responsible for drawing the dynamic sky background based on the time of day.
 * It manages the sky texture and star field.
 */
export class SkyManager {
    /**
     * Creates an instance of SkyManager.
     * @param {Phaser.Scene} scene - The scene this manager belongs to (MainScene).
     */
    constructor(scene) {
        /** @type {Phaser.Scene} */
        this.scene = scene;

        // Initialize texture with full size; resize will adjust it
        this.skyTexture = this.scene.textures.createCanvas('sky', this.scene.scale.width, this.scene.scale.height);
        this.skyImage = this.scene.add.image(0, 0, 'sky').setOrigin(0).setDepth(-10); // Ensure it's at the back

        /** @type {Array<{x: number, y: number}>} Star positions (normalized 0-1) */
        this.stars = Array.from({ length: 100 }, () => ({ x: Math.random(), y: Math.random() }));

        /** @type {number} Cache to avoid redundant drawing */
        this.lastDaylightFactor = -1;
    }

    /**
     * Updates the sky texture based on the current time of day.
     * Should be called in the scene's update loop.
     */
    update() {
        if (!this.skyTexture || !this.skyTexture.context) return;
        const daylightFactor = this.scene.worldClock.getDaylightFactor();

        // OPTIMIZATION: Skip expensive gradient and star drawing if the sky state hasn't changed.
        // We use a small threshold (0.002) to avoid redrawing for imperceptible changes during transitions.
        if (Math.abs(this.lastDaylightFactor - daylightFactor) < 0.002) return;
        this.lastDaylightFactor = daylightFactor;

        const nightTop = new Phaser.Display.Color(0, 0, 51);
        const nightBottom = new Phaser.Display.Color(0, 0, 0);
        const dawnTop = new Phaser.Display.Color(255, 153, 102);
        const dawnBottom = new Phaser.Display.Color(255, 204, 153);
        const dayTop = new Phaser.Display.Color(135, 206, 235);
        const dayBottom = new Phaser.Display.Color(173, 216, 230);

        let topColor, bottomColor;
        const period = this.scene.worldClock.getCurrentPeriod();
        if (period === 'Dawn') {
            topColor = Phaser.Display.Color.Interpolate.ColorWithColor(nightTop, dawnTop, 1, daylightFactor);
            bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(nightBottom, dawnBottom, 1, daylightFactor);
        } else if (period === 'Dusk') {
            topColor = Phaser.Display.Color.Interpolate.ColorWithColor(dawnTop, nightTop, 1, 1 - daylightFactor);
            bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(dawnBottom, nightBottom, 1, 1 - daylightFactor);
        } else {
            topColor = (daylightFactor === 1) ? dayTop : nightTop;
            bottomColor = (daylightFactor === 1) ? dayBottom : nightBottom;
        }

        // Use the current size of the texture
        const width = this.skyTexture.width;
        const height = this.skyTexture.height;

        this.skyTexture.clear();
        const gradient = this.skyTexture.context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgba(${topColor.r}, ${topColor.g}, ${topColor.b}, 1)`);
        gradient.addColorStop(1, `rgba(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b}, 1)`);
        this.skyTexture.context.fillStyle = gradient;
        this.skyTexture.context.fillRect(0, 0, width, height);

        if (daylightFactor < 0.5) {
            this.skyTexture.context.fillStyle = `rgba(255, 255, 255, ${1 - (daylightFactor * 2)})`;
            this.stars.forEach(star => this.skyTexture.context.fillRect(star.x * width, star.y * height * 0.7, 1, 1));
        }

        this.skyTexture.refresh();
    }

    /**
     * Handles resizing of the sky texture.
     * @param {number} width - The new width of the game/view.
     * @param {number} height - The new height of the game/view.
     */
    resize(width, height) {
        if (this.skyTexture) {
            this.skyTexture.setSize(width, height);
            // Force redraw
            this.lastDaylightFactor = -1;
            this.update();
        }
    }

    /**
     * Sets the visibility of the sky.
     * @param {boolean} visible - Whether the sky should be visible.
     */
    setVisible(visible) {
        if (this.skyImage) {
            this.skyImage.setVisible(visible);
        }
    }
}
