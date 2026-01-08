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
        this.lastLightHash = '';
    }

    /**
     * Updates the lighting effect.
     * Should be called in the scene's update loop.
     */
    update() {
        // Fix for "Entryway dark" bug: Disable lighting mask when INDOORS.
        // The darkness overlay should only apply outdoors.
        if (this.scene.location === 'INDOOR') {
            this.lightImage.setVisible(false);
            return;
        }

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
     * Supports multiple light sources via 'screen' composite operation.
     */
    drawLight() {
        if (!this.lightTexture) return;

        // Collect all light sources
        const lights = [];

        // 1. Player (Increased Radius)
        lights.push({ x: this.scene.sprite.x, y: this.scene.sprite.y, r: 250 }); // Increased from 150 to 250

        // 2. NPCs (If visible) - Small ambient lights
        if (this.scene.npcScout && this.scene.npcScout.visible) lights.push({ x: this.scene.npcScout.x, y: this.scene.npcScout.y, r: 80 });
        if (this.scene.npcArtisan && this.scene.npcArtisan.visible) lights.push({ x: this.scene.npcArtisan.x, y: this.scene.npcArtisan.y, r: 80 });
        if (this.scene.npcVillager && this.scene.npcVillager.visible) lights.push({ x: this.scene.npcVillager.x, y: this.scene.npcVillager.y, r: 80 });

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
