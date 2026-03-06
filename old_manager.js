/**
 * @fileoverview Manages the visual rendering of dynamic lighting.
 * Handles the spotlight effect used during night and dusk.
 */

/**
 * @class LightingManager
 * @classdesc
 * Responsible for rendering the spotlight/vignette effect around the player
 * during darker times of day.
 *
 * Optimization: Uses a GPU-based RenderTexture with resolution scaling and
 * micro-movement hysteresis to minimize performance cost.
 */
export class LightingManager {
    /**
     * Creates an instance of LightingManager.
     * @param {Phaser.Scene} scene - The scene this manager belongs to (MainScene).
     */
    constructor(scene) {
        /** @type {Phaser.Scene} */
        this.scene = scene;

        // Configuration
        this.scaleRatio = 0.5; // Render at 50% resolution
        this.movementThreshold = 0.1; // Ignore movements smaller than 0.1px

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Ensure we have the "Light Cookie" texture
        if (!this.scene.textures.exists('light_soft')) {
            this._createLightCookie();
        }

        // Create the RenderTexture
        // Initialize with scaled dimensions
        this.renderTexture = this.scene.add.renderTexture(0, 0, width * this.scaleRatio, height * this.scaleRatio);
        this.renderTexture.setOrigin(0, 0);
        this.renderTexture.setScrollFactor(0);
        this.renderTexture.setScale(1 / this.scaleRatio); // Scale back up to fit screen
        this.renderTexture.setBlendMode('MULTIPLY');
        this.renderTexture.setDepth(100); // High depth to cover everything except UI
        this.renderTexture.setVisible(false);

        // Helper object for drawing lights
        this.dummyLight = this.scene.make.image({ key: 'light_soft', add: false });
        this.dummyLight.setOrigin(0.5); // Center origin for correct positioning

        /** @type {Array<{x: number, y: number, r: number}>} Cache to avoid redundant drawing */
        this.lastLights = [];
    }

    /**
     * Generates a reusable radial gradient texture for lights.
     * @private
     */
    _createLightCookie() {
        const size = 512;
        const half = size / 2;

        // Use a temporary canvas to draw the gradient
        const texture = this.scene.textures.createCanvas('light_soft', size, size);
        const ctx = texture.context;

        // Radial gradient: White (center) to Transparent (edge)
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        texture.refresh();
    }

    /**
     * Updates the lighting effect.
     * Should be called in the scene's update loop.
     */
    update() {
        // Lighting effects should only be active in outdoor locations (GARDEN).
        // Indoor locations (INDOOR) should rely on their own lighting/mood.
        if (this.scene.location === 'INDOOR') {
            this.renderTexture.setVisible(false);
            return;
        }

        const worldState = this.scene.worldState;
        if (worldState && (worldState.time === "Night" || worldState.time === "Dusk")) {
             this.renderTexture.setVisible(true);
             this._processLights();
        } else {
             this.renderTexture.setVisible(false);
        }
    }

    /**
     * Internal method to process and draw lights if needed.
     * @private
     */
    _processLights() {
        // Collect all light sources
        const lights = [];

        // 1. Player (Increased Radius)
        lights.push({ x: this.scene.sprite.x, y: this.scene.sprite.y, r: 250 });

        // 2. NPCs (If visible)
        if (this.scene.npcScout && this.scene.npcScout.visible) lights.push({ x: this.scene.npcScout.x, y: this.scene.npcScout.y, r: 80 });
        if (this.scene.npcArtisan && this.scene.npcArtisan.visible) lights.push({ x: this.scene.npcArtisan.x, y: this.scene.npcArtisan.y, r: 80 });
        if (this.scene.npcVillager && this.scene.npcVillager.visible) lights.push({ x: this.scene.npcVillager.x, y: this.scene.npcVillager.y, r: 80 });

        // Check if redraw is needed (Hysteresis)
        if (this._needsRedraw(lights)) {
            this.drawLight(lights);
            // Clone lights for next comparison
            this.lastLights = lights.map(l => ({...l}));
        }
    }

    /**
     * Checks if the lights have moved significantly enough to warrant a redraw.
     * @param {Array} currentLights
     * @returns {boolean}
     */
    _needsRedraw(currentLights) {
        if (currentLights.length !== this.lastLights.length) return true;

        for (let i = 0; i < currentLights.length; i++) {
            const curr = currentLights[i];
            const prev = this.lastLights[i];

            if (Math.abs(curr.x - prev.x) > this.movementThreshold ||
                Math.abs(curr.y - prev.y) > this.movementThreshold ||
                Math.abs(curr.r - prev.r) > this.movementThreshold) {
                return true;
            }
        }
        return false;
    }

    /**
     * Draws the spotlight gradient onto the RenderTexture.
     * @param {Array} lights
     */
    drawLight(lights) {
        if (!this.renderTexture) return;

        // Clear with Black (Darkness)
        // Note: fill(0x000000) fills with opaque black.
        this.renderTexture.fill(0x000000, 1);

        lights.forEach(light => {
            // Scale position to RenderTexture space
            const tx = light.x * this.scaleRatio;
            const ty = light.y * this.scaleRatio;

            // Calculate scale for the light cookie
            // Cookie is 512px. Target diameter = r * 2 * scaleRatio
            const targetDiameter = light.r * 2 * this.scaleRatio;
            const spriteScale = targetDiameter / 512;

            this.dummyLight.setScale(spriteScale);
            this.dummyLight.setPosition(tx, ty);

            // Draw the light cookie
            // Standard blending works well here (alpha blending on top of black)
            this.renderTexture.draw(this.dummyLight);
        });
    }

    /**
     * Handles resizing of the lighting texture.
     * @param {number} width - The new width of the game/view.
     * @param {number} height - The new height of the game/view.
     */
    resize(width, height) {
        if (this.renderTexture) {
            this.renderTexture.resize(width * this.scaleRatio, height * this.scaleRatio);
            this.renderTexture.setScale(1 / this.scaleRatio);

            // Force redraw next frame
            this.lastLights = [];
            // We can call update() here or wait for loop
            // But usually resize happens outside loop.
        }
    }
}
