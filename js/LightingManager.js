/**
 * @fileoverview Manages the visual rendering of dynamic lighting.
 * Handles the spotlight effect used during night and dusk.
 */

/**
 * @class LightingManager
 * @classdesc
 * Responsible for rendering the spotlight/vignette effect around the player
 * during darker times of day.
<<<<<<< HEAD
 *
 * Optimization: Uses a GPU-based RenderTexture with resolution scaling and
 * micro-movement hysteresis to minimize performance cost.
=======
>>>>>>> 74fdaab (Update js/DebugConsole.js)
 */
export class LightingManager {
    /**
     * Creates an instance of LightingManager.
     * @param {Phaser.Scene} scene - The scene this manager belongs to (MainScene).
     */
    constructor(scene) {
        /** @type {Phaser.Scene} */
        this.scene = scene;

<<<<<<< HEAD
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
=======
        this.lightTexture = this.scene.textures.createCanvas('light', this.scene.scale.width, this.scene.scale.height);
        this.lightImage = this.scene.add.image(0, 0, 'light').setOrigin(0).setBlendMode('MULTIPLY').setVisible(false).setDepth(100); // High depth to cover everything except UI

        /** @type {number} Cache to avoid redundant drawing */
        this.lastLightHash = '';
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Updates the lighting effect.
     * Should be called in the scene's update loop.
     */
    update() {
        // Lighting effects should only be active in outdoor locations (GARDEN).
        // Indoor locations (INDOOR) should rely on their own lighting/mood.
        if (this.scene.location === 'INDOOR') {
<<<<<<< HEAD
            this.renderTexture.setVisible(false);
=======
            this.lightImage.setVisible(false);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
            return;
        }

        const worldState = this.scene.worldState;
        if (worldState && (worldState.time === "Night" || worldState.time === "Dusk")) {
<<<<<<< HEAD
             this.renderTexture.setVisible(true);
             this._processLights();
        } else {
             this.renderTexture.setVisible(false);
=======
             this.lightImage.setVisible(true);
             this.drawLight();
        } else {
             this.lightImage.setVisible(false);
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        }
    }

    /**
<<<<<<< HEAD
     * Internal method to process and draw lights if needed.
     * @private
     */
    _processLights() {
=======
     * Internal method to draw the spotlight gradient.
     * Supports multiple light sources via 'screen' composite operation.
     */
    drawLight() {
        if (!this.lightTexture) return;

>>>>>>> 74fdaab (Update js/DebugConsole.js)
        // Collect all light sources
        const lights = [];

        // 1. Player (Increased Radius)
<<<<<<< HEAD
        lights.push({ x: this.scene.sprite.x, y: this.scene.sprite.y, r: 250 });

        // 2. NPCs (If visible)
=======
        lights.push({ x: this.scene.sprite.x, y: this.scene.sprite.y, r: 250 }); // Increased from 150 to 250

        // 2. NPCs (If visible) - Small ambient lights
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        if (this.scene.npcScout && this.scene.npcScout.visible) lights.push({ x: this.scene.npcScout.x, y: this.scene.npcScout.y, r: 80 });
        if (this.scene.npcArtisan && this.scene.npcArtisan.visible) lights.push({ x: this.scene.npcArtisan.x, y: this.scene.npcArtisan.y, r: 80 });
        if (this.scene.npcVillager && this.scene.npcVillager.visible) lights.push({ x: this.scene.npcVillager.x, y: this.scene.npcVillager.y, r: 80 });

<<<<<<< HEAD
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
=======
        // Generate hash to check for changes (Optimization)
        const currentHash = lights.map(l => `${Math.floor(l.x)},${Math.floor(l.y)},${l.r}`).join('|');
        if (this.lastLightHash === currentHash) return;
        this.lastLightHash = currentHash;

        const ctx = this.lightTexture.context;
        const width = this.lightTexture.width;
        const height = this.lightTexture.height;

        // Clear with Black (Darkness)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Full darkness base
        ctx.fillRect(0, 0, width, height);

        // Cut out lights (White = Transparent in MULTIPLY mode, but here we want to draw Light)
        // Wait, current implementation uses MULTIPLY blend mode for the Image.
        // So White pixels in texture = Original Scene Color. Black pixels = Black.
        // We want to draw White circles on a Black background.

        // Use 'screen' to blend multiple white circles together additively maxing at white
        ctx.globalCompositeOperation = 'screen';

        lights.forEach(light => {
            const gradient = ctx.createRadialGradient(light.x, light.y, light.r * 0.2, light.x, light.y, light.r);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Core brightness
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fade to black/transparent

            ctx.fillStyle = gradient;
            // Draw a rect covering the light area to apply the gradient
            // Optimization: Don't fill whole screen for small lights
            ctx.fillRect(light.x - light.r, light.y - light.r, light.r * 2, light.r * 2);
        });

        // Reset composite
        ctx.globalCompositeOperation = 'source-over';

        this.lightTexture.refresh();
>>>>>>> 74fdaab (Update js/DebugConsole.js)
    }

    /**
     * Handles resizing of the lighting texture.
     * @param {number} width - The new width of the game/view.
     * @param {number} height - The new height of the game/view.
     */
    resize(width, height) {
<<<<<<< HEAD
        if (this.renderTexture) {
            this.renderTexture.resize(width * this.scaleRatio, height * this.scaleRatio);
            this.renderTexture.setScale(1 / this.scaleRatio);

            // Force redraw next frame
            this.lastLights = [];
            // We can call update() here or wait for loop
            // But usually resize happens outside loop.
=======
        if (this.lightTexture) {
            this.lightTexture.setSize(width, height);
            // Force redraw
            this.lastLightX = -9999;
            this.lastLightY = -9999;
            this.drawLight();
>>>>>>> 74fdaab (Update js/DebugConsole.js)
        }
    }
}
