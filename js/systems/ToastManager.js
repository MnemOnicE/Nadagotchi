/**
 * @fileoverview Manages toast notifications for scenes.
 * Supports different visual styles ('GOLD' for UI, 'DARK' for Showcase).
 */

export class ToastManager {
    /**
     * @param {Phaser.Scene} scene - The scene to display toasts in.
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Shows a toast notification.
     * @param {object} config - Configuration object.
     * @param {string} config.title - The title text.
     * @param {string} config.message - The message text.
     * @param {string} [config.icon] - Optional icon (emoji or character).
     * @param {string} [config.style='GOLD'] - The visual style ('GOLD' or 'DARK').
     * @param {number} [config.duration=3000] - Duration in ms before hiding (default 3000ms for Gold, 2000ms for Dark).
     */
    show(config) {
        const { title, message, icon = '', style = 'GOLD' } = config;

        // Default duration based on style if not provided
        // Gold uses 3000ms hold, Dark used 2000ms delay in original code
        const defaultDuration = style === 'DARK' ? 2000 : 3000;
        const duration = config.duration !== undefined ? config.duration : defaultDuration;

        if (style === 'DARK') {
            this._showDark(title, message, duration);
        } else {
            this._showGold(title, message, icon, duration);
        }
    }

    /**
     * internal method for Gold style (UIScene default)
     */
    _showGold(title, message, icon, duration) {
        const width = this.scene.cameras.main.width;
        const toastWidth = 300;
        const toastHeight = 80;

        const container = this.scene.add.container(width / 2 - toastWidth / 2, -toastHeight - 20);

        const bg = this.scene.add.rectangle(0, 0, toastWidth, toastHeight, 0xFFD700)
            .setOrigin(0)
            .setStrokeStyle(2, 0xFFFFFF);

        const iconText = this.scene.add.text(10, 15, icon, { fontSize: '40px' });

        const titleText = this.scene.add.text(70, 10, title, {
            fontSize: '16px',
            color: '#000',
            fontStyle: 'bold',
            fontFamily: 'VT323'
        });

        const msgText = this.scene.add.text(70, 35, message, {
            fontSize: '24px',
            color: '#000',
            fontFamily: 'VT323'
        });

        container.add([bg, iconText, titleText, msgText]);

        this.scene.tweens.add({
            targets: container,
            y: 20,
            duration: 500,
            ease: 'Back.out',
            hold: duration,
            yoyo: true,
            onComplete: () => container.destroy()
        });
    }

    /**
     * internal method for Dark style (ShowcaseScene)
     */
    _showDark(title, message, duration) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const toastWidth = 300;
        const toastHeight = 60;

        const x = width / 2 - toastWidth / 2;
        const y = height - 100;

        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, toastWidth, toastHeight, 0x333333)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff);

        const text = this.scene.add.text(toastWidth / 2, toastHeight / 2, `${title}: ${message}`, {
            fontFamily: 'VT323',
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5);

        container.add([bg, text]);

        this.scene.tweens.add({
            targets: container,
            alpha: 0,
            duration: 500,
            delay: duration,
            onComplete: () => container.destroy()
        });
    }
}
