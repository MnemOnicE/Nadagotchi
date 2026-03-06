/**
 * Utility functions to help with centering and drawing UI inside a "safe area" padding.
 */

export class SceneUIUtils {
    /**
     * Gets the current safe area padding from the game registry.
     * @param {Phaser.Scene} scene - The active scene.
     * @returns {number} The padding in pixels.
     */
    static getPadding(scene) {
        return scene.game.registry.get('safeAreaPadding') || 0;
    }

    /**
     * Gets the effective width of the screen, subtracting padding.
     * @param {Phaser.Scene} scene
     */
    static getSafeWidth(scene) {
        return scene.cameras.main.width - (this.getPadding(scene) * 2);
    }

    /**
     * Gets the effective height of the screen, subtracting padding.
     * @param {Phaser.Scene} scene
     */
    static getSafeHeight(scene) {
        return scene.cameras.main.height - (this.getPadding(scene) * 2);
    }

    /**
     * Gets the center X coordinate considering padding.
     * @param {Phaser.Scene} scene
     */
    static getCenterX(scene) {
        return scene.cameras.main.width / 2;
    }

    /**
     * Gets the center Y coordinate considering padding.
     * @param {Phaser.Scene} scene
     */
    static getCenterY(scene) {
        return scene.cameras.main.height / 2;
    }

    /**
     * Draws or updates a Bezel around the screen to show the unsafe area.
     * Useful for visual feedback when boundaries are adjusted.
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Graphics} graphics - The graphics object to draw on.
     */
    static drawBezel(scene, graphics) {
        if (!graphics) return;
        graphics.clear();
        const pad = this.getPadding(scene);
        if (pad <= 0) return;

        const w = scene.cameras.main.width;
        const h = scene.cameras.main.height;

        graphics.fillStyle(0x000000, 0.5); // Semi-transparent black border
        // Top
        graphics.fillRect(0, 0, w, pad);
        // Bottom
        graphics.fillRect(0, h - pad, w, pad);
        // Left
        graphics.fillRect(0, pad, pad, h - pad * 2);
        // Right
        graphics.fillRect(w - pad, pad, pad, h - pad * 2);
    }
}
