/**
 * @fileoverview Manages the visual rendering of dynamic lighting.
 * Handles the spotlight effect used during night and dusk.
 */

/**
 * @class LightingManager
 * @classdesc
 * Responsible for rendering the spotlight/vignette effect around the player
 * during darker times of day.
 */
export class LightingManager {
    /**
     * Creates an instance of LightingManager.
     * @param {Phaser.Scene} scene - The scene this manager belongs to (MainScene).
     */
    constructor(scene) {
        /** @type {Phaser.Scene} */
        this.scene = scene;

        this.lightTexture = this.scene.textures.createCanvas('light', this.scene.scale.width, this.scene.scale.height);
        this.lightImage = this.scene.add.image(0, 0, 'light').setOrigin(0).setBlendMode('MULTIPLY').setVisible(false).setDepth(100); // High depth to cover everything except UI

        /** @type {number} Cache to avoid redundant drawing */
        this.lastLightX = -9999;
        /** @type {number} Cache to avoid redundant drawing */
        this.lastLightY = -9999;
    }

    /**
     * Updates the lighting effect.
     * Should be called in the scene's update loop.
     */
    update() {
        // Only render if needed (Night or Dusk) - Logic controlled by MainScene, but we handle the drawing here.
        // Or better, MainScene controls visibility, we just draw if visible?
        // The original code in MainScene.update checks time and sets visible.
        // "if (this.worldState.time === "Night" || this.worldState.time === "Dusk") { this.drawLight(); this.lightImage.setVisible(true); }"

        // We will expose the draw/update logic. MainScene will call it.

        const worldState = this.scene.worldState;
        if (worldState && (worldState.time === "Night" || worldState.time === "Dusk")) {
             this.lightImage.setVisible(true);
             this.drawLight();
        } else {
             this.lightImage.setVisible(false);
        }
    }

    /**
     * Internal method to draw the spotlight gradient.
     */
    drawLight() {
        if (!this.lightTexture) return;

        // OPTIMIZATION: Skip expensive radial gradient creation if the light source (sprite) hasn't moved.
        if (this.lastLightX === this.scene.sprite.x && this.lastLightY === this.scene.sprite.y) return;
        this.lastLightX = this.scene.sprite.x;
        this.lastLightY = this.scene.sprite.y;

        this.lightTexture.clear();
        // Use the current size
        const width = this.lightTexture.width;
        const height = this.lightTexture.height;

        const gradient = this.lightTexture.context.createRadialGradient(this.scene.sprite.x, this.scene.sprite.y, 50, this.scene.sprite.x, this.scene.sprite.y, 150);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        this.lightTexture.context.fillStyle = gradient;
        this.lightTexture.context.fillRect(0, 0, width, height);
        this.lightTexture.refresh();
    }

    /**
     * Handles resizing of the lighting texture.
     * @param {number} width - The new width of the game/view.
     * @param {number} height - The new height of the game/view.
     */
    resize(width, height) {
        if (this.lightTexture) {
            this.lightTexture.setSize(width, height);
            // Force redraw
            this.lastLightX = -9999;
            this.lastLightY = -9999;
            this.drawLight();
        }
    }
}
