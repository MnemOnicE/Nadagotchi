import { ButtonFactory } from './ButtonFactory.js';
import { EventKeys } from './EventKeys.js';
import { Config } from './Config.js';

/**
 * @fileoverview A dedicated scene for the "Pet Passport" / Showcase system.
 * Displays detailed pet statistics, visualizes the pet, and allows DNA export/import.
 * Designed to be a "Pause" screen that overlays or replaces the main game view temporarily.
 */

export class ShowcaseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShowcaseScene' });
    }

    /**
     * Initializes the scene with data passed from the calling scene.
     * @param {object} data - The payload containing the pet data.
     * @param {import('./Nadagotchi.js').Nadagotchi} data.nadagotchi - The current pet instance.
     */
    init(data) {
        this.petData = data.nadagotchi;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background (Solid color with slight transparency to hint at pause state, or full solid)
        // Using a "Passport" dark blue theme
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a237e).setOrigin(0.5); // Deep Indigo

        // 2. Header
        this.add.text(width / 2, 40, "PET PASSPORT", {
            fontFamily: 'VT323, monospace', fontSize: '48px', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Pet Visualization (Left Side)
        const petContainer = this.add.container(width * 0.3, height / 2);

        // Spotlight effect
        const spotlight = this.add.circle(0, 0, 100, 0xffffff, 0.1);
        petContainer.add(spotlight);

        // Pet Sprite (Scaled up)
        // We reuse the 'pet' texture but maybe use a specific frame based on mood
        const frame = Config.MOOD_VISUALS.FRAMES[this.petData.mood] ?? Config.MOOD_VISUALS.DEFAULT_FRAME;
        const sprite = this.add.sprite(0, 0, 'pet', frame).setScale(8);

        // Add a simple idle tween
        this.tweens.add({
            targets: sprite,
            y: -10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        petContainer.add(sprite);

        // 4. Stats Panel (Right Side)
        const startX = width * 0.55;
        const startY = 100;
        const lineHeight = 35;

        const styleLabel = { fontFamily: 'VT323, monospace', fontSize: '24px', color: '#aaa' };
        const styleValue = { fontFamily: 'VT323, monospace', fontSize: '24px', color: '#fff' };

        const addStat = (label, value, yOffset) => {
            this.add.text(startX, startY + yOffset, label, styleLabel);
            this.add.text(startX + 180, startY + yOffset, value, styleValue);
        };

        addStat("Name/UUID:", this.petData.uuid.substring(0, 8) + "...", 0);
        addStat("Archetype:", this.petData.dominantArchetype, lineHeight);
        addStat("Generation:", this.petData.generation.toString(), lineHeight * 2);
        addStat("Career:", this.petData.currentCareer || "None", lineHeight * 3);
        addStat("Age:", Math.floor(this.petData.age).toString() + " Days", lineHeight * 4);

        // 5. DNA Section (Bottom)
        const dnaY = height * 0.65;
        this.add.text(width / 2, dnaY, "GENETIC SEQUENCE (DNA)", {
            fontFamily: 'VT323, monospace', fontSize: '20px', color: '#4fc3f7'
        }).setOrigin(0.5);

        // Placeholder / Loading State
        const dnaBg = this.add.rectangle(width / 2, dnaY + 40, width * 0.8, 50, 0x000000, 0.5).setStrokeStyle(1, 0x4fc3f7);
        const dnaText = this.add.text(width / 2, dnaY + 40, "Generating Secure DNA...", {
            fontFamily: 'Courier', fontSize: '16px', color: '#ffff00'
        }).setOrigin(0.5);

        // Async DNA Generation
        this.petData.exportDNA().then(dnaString => {
            // Update Text
            const displayString = dnaString.length > 32 ? dnaString.substring(0, 32) + "..." : dnaString;
            dnaText.setText(displayString);
            dnaText.setColor('#00ff00');

            // "Copy" Button (Simulated)
            ButtonFactory.createButton(this, width / 2, dnaY + 90, "COPY TO CLIPBOARD", () => {
                 this.copyToClipboard(dnaString);
            }, { width: 200, height: 40, color: 0x00695c, fontSize: '20px' });
        }).catch(err => {
            console.error("Failed to generate DNA:", err);
            dnaText.setText("Error Generating DNA");
            dnaText.setColor('#ff0000');
        });

        // 6. Back Button
        ButtonFactory.createButton(this, 60, 40, "<- BACK", () => {
             this.close();
        }, { width: 100, height: 40, color: 0xb71c1c });

    }

    /**
     * Attempts to copy the text to the clipboard.
     * Note: This might be blocked by browser permissions if not triggered directly by a DOM event,
     * but Phaser input events usually count as user interaction.
     * @param {string} text
     */
    copyToClipboard(text) {
        if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast("Copied!", "DNA copied to clipboard.");
            }).catch(err => {
                console.error("Clipboard failed", err);
                this.showToast("Error", "Could not copy DNA.");
                // Fallback: Log to console
                console.log("NADAGOTCHI DNA:", text);
            });
        } else {
            console.log("NADAGOTCHI DNA:", text);
            this.showToast("Console", "DNA logged to console (Clipboard API missing).");
        }
    }

    /**
     * Closes the scene and resumes the main game.
     */
    close() {
        this.scene.resume('MainScene');
        this.scene.stop();
        this.scene.wake('UIScene');
        this.scene.stop();
    }

    /**
     * Shows a temporary toast message.
     * Duplicated from UIScene (should potentially be a utility, but keeping isolated for now).
     */
    showToast(title, message) {
        const width = this.cameras.main.width;
        const toastWidth = 300;
        const toastHeight = 60;
        const x = width / 2 - toastWidth / 2;
        const y = this.cameras.main.height - 100;

        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, toastWidth, toastHeight, 0x333333).setOrigin(0).setStrokeStyle(2, 0xffffff);
        const text = this.add.text(toastWidth/2, toastHeight/2, `${title}: ${message}`, {
            fontFamily: 'VT323', fontSize: '20px', color: '#fff'
        }).setOrigin(0.5);

        container.add([bg, text]);

        this.tweens.add({
            targets: container,
            alpha: 0,
            duration: 500,
            delay: 2000,
            onComplete: () => container.destroy()
        });
    }
}
