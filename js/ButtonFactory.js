/**
 * @fileoverview Utility for creating consistent UI buttons.
 * Uses Phaser Containers to group visual elements and hit zones into a single interactive object.
 * Implements a "Neo-Retro" aesthetic with 3D bevels and shadows.
 */

/**
 * @class ButtonFactory
 * @classdesc
 * A utility class to generate consistent, "Neo-Retro" style 3D buttons.
 */
export class ButtonFactory {
    /**
     * Creates a 3D beveled button.
     * @param {Phaser.Scene} scene - The scene to add the button to.
     * @param {number} x - The x position (center of the button).
     * @param {number} y - The y position (center of the button).
     * @param {string} text - The text to display on the button.
     * @param {function} callback - The function to call when the button is clicked.
     * @param {object} [options] - Styling options.
     * @param {number} [options.width=100] - The width of the button.
     * @param {number} [options.height=40] - The height of the button.
     * @param {number} [options.color=0xD8A373] - The background color of the button (hex).
     * @param {string} [options.textColor='#4A4A4A'] - The color of the text string.
     * @param {string} [options.fontSize='24px'] - The CSS font size for the text.
     * @returns {Phaser.GameObjects.Container} The created button container.
     */
    static createButton(scene, x, y, text, callback, options = {}) {
        const width = options.width || 100;
        const height = options.height || 40;
        const baseColor = options.color !== undefined ? options.color : 0xD8A373; // Muted Terracotta
        const textColor = options.textColor || '#4A4A4A'; // Deep Warm Gray
        const fontSize = options.fontSize || '24px';
        const fontFamily = 'VT323';

        const container = scene.add.container(x, y);

        // Shadow (Simulates height, renders behind the button)
        const shadow = scene.add.rectangle(4, 4, width, height, 0x000000, 0.3).setOrigin(0);

        // Base Background
        const bg = scene.add.rectangle(0, 0, width, height, baseColor).setOrigin(0);

        // Hover Overlay (White, invisible by default) - Palette UX
        const hoverOverlay = scene.add.rectangle(0, 0, width, height, 0xFFFFFF, 0).setOrigin(0);

        // Bevel Highlights (Top/Left)
        const highlightTop = scene.add.rectangle(0, 0, width, 3, 0xFFFFFF, 0.5).setOrigin(0);
        const highlightLeft = scene.add.rectangle(0, 0, 3, height, 0xFFFFFF, 0.5).setOrigin(0);

        // Bevel Shadows (Bottom/Right)
        const shadeBottom = scene.add.rectangle(0, height - 3, width, 3, 0x000000, 0.2).setOrigin(0);
        const shadeRight = scene.add.rectangle(width - 3, 0, 3, height, 0x000000, 0.2).setOrigin(0);

        // Text
        const btnText = scene.add.text(width / 2, height / 2, text, {
            fontFamily: fontFamily,
            fontSize: fontSize,
            color: textColor
        }).setOrigin(0.5);

        // Interactive Zone (Transparent)
        const hitZone = scene.add.zone(width / 2, height / 2, width, height)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Add everything to container
        // Order determines Z-index: shadow (back), bg, hoverOverlay, highlights/shades, text, hitZone (front)
        container.add([shadow, bg, hoverOverlay, highlightTop, highlightLeft, shadeBottom, shadeRight, btnText, hitZone]);

        // Input Handling
        hitZone.on('pointerdown', () => {
            // Press effect: Move button down-right to cover shadow
            container.x += 2;
            container.y += 2;
            shadow.setVisible(false);
            if (callback) callback();
        });

        // Hover Effects - Palette UX
        hitZone.on('pointerover', () => {
            scene.tweens.add({
                targets: hoverOverlay,
                alpha: 0.2, // Lighten the button
                duration: 100
            });
        });

        const resetState = () => {
            if (!shadow.visible) {
                container.x -= 2;
                container.y -= 2;
                shadow.setVisible(true);
            }
            // Restore hover state
            scene.tweens.add({
                targets: hoverOverlay,
                alpha: 0,
                duration: 100
            });
        };

        hitZone.on('pointerup', resetState);
        hitZone.on('pointerout', resetState);

        // Store size for layout calculations
        container.width = width;
        container.height = height;

        return container;
    }
}
