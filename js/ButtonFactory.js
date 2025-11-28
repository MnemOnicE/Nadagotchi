/**
 * Factory class for creating consistent, 3D-style interactive buttons.
 */
class ButtonFactory {
    /**
     * Creates a 3D-style button container.
     * @param {Phaser.Scene} scene - The scene to which the button belongs.
     * @param {number} x - The x coordinate (top-left).
     * @param {number} y - The y coordinate (top-left).
     * @param {string} label - The text label for the button.
     * @param {object} [options] - Configuration options.
     * @param {Function} [options.onClick] - The callback to execute on click.
     * @returns {Phaser.GameObjects.Container} The button container.
     */
    static createButton(scene, x, y, label, options = {}) {
        const padding = { x: 20, y: 12 };
        const depth = 4;
        const mainColor = 0x4a4a4a;
        const hoverColor = 0x666666;
        const shadowColor = 0x222222;

        // Measure text first
        const textObj = scene.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const width = textObj.width + (padding.x * 2);
        const height = textObj.height + (padding.y * 2);

        const container = scene.add.container(x, y);

        // Explicitly set size for layout managers
        container.setSize(width, height + depth);
        // Note: Phaser 3 Containers don't automatically update their 'width' property based on content,
        // so we manually set it to ensure external layout logic works.
        container.width = width;
        container.height = height + depth;

        // Shadow (bottom layer)
        const shadow = scene.add.rectangle(width / 2, height / 2 + depth, width, height, shadowColor);

        // Face (top layer)
        const face = scene.add.rectangle(width / 2, height / 2, width, height, mainColor);

        // Center text on face
        textObj.setPosition(width / 2, height / 2);

        container.add([shadow, face, textObj]);

        // Interactivity
        face.setInteractive({ useHandCursor: true });

        face.on('pointerover', () => {
            face.setFillStyle(hoverColor);
        });

        face.on('pointerout', () => {
            face.setFillStyle(mainColor);
            // Reset position if we dragged out
            face.y = height / 2;
            textObj.y = height / 2;
        });

        face.on('pointerdown', () => {
            face.y += depth;
            textObj.y += depth;
            if (options.onClick) {
                options.onClick();
            }
        });

        face.on('pointerup', () => {
            face.y = height / 2;
            textObj.y = height / 2;
        });

        return container;
    }
}
