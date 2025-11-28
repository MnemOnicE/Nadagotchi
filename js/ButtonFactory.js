/**
 * @class ButtonFactory
 * @classdesc
 * A utility class to generate consistent, "Neo-Retro" style 3D buttons.
 */
export class ButtonFactory {
    /**
     * Creates a 3D beveled button.
     * @param {Phaser.Scene} scene - The scene to add the button to.
     * @param {number} x - The x position.
     * @param {number} y - The y position.
     * @param {string} text - The text to display.
     * @param {function} callback - The function to call on click.
     * @param {object} [options] - styling options.
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
        container.add([shadow, bg, highlightTop, highlightLeft, shadeBottom, shadeRight, btnText, hitZone]);

        // Input Handling
        hitZone.on('pointerdown', () => {
            // Press effect: Move button down-right to cover shadow
            container.x += 2;
            container.y += 2;
            shadow.setVisible(false);

            if (callback) callback();
        });

        const resetState = () => {
            if (!shadow.visible) {
                container.x -= 2;
                container.y -= 2;
                shadow.setVisible(true);
            }
        };

        hitZone.on('pointerup', resetState);
        hitZone.on('pointerout', resetState);

        // Store size for layout calculations
        container.width = width;
        container.height = height;

        return container;
    }
}
