import { ItemDefinitions } from './ItemData.js';

/**
 * @fileoverview Preloads game assets.
 * Now generates enhanced procedural textures (Pixel Art + Emojis)
 * to differentiate between World Objects and UI Icons.
 */

/**
 * PreloaderScene: Handles asset loading and generation.
 * @class PreloaderScene
 * @extends Phaser.Scene
 */
export class PreloaderScene extends Phaser.Scene {
    /**
     * Creates an instance of PreloaderScene.
     */
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    /**
     * Phaser lifecycle method: preload.
     * Generates graphics and loading UI.
     */
    preload() {
        // Loading bar implementation
        this.createLoadingBar();

        // Load Asset for Pre-placed Bookshelf
        this.load.image('bookshelf', 'assets/sprites/bookshelf_64x64.png');

        // --- Helper: Create Detailed Pixel-Art Style Boxes ---
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        const createDetailedBox = (key, baseColor, size, type) => {
            graphics.clear();

            // 1. Base Fill
            graphics.fillStyle(baseColor);
            graphics.fillRect(0, 0, size, size);

            // 2. Add "Noise" (Simulates texture)
            graphics.fillStyle(0x000000, 0.1); // Semi-transparent black
            for (let i = 0; i < 10; i++) {
                const rx = Math.floor(Math.random() * size);
                const ry = Math.floor(Math.random() * size);
                const rw = Math.floor(Math.random() * (size / 4));
                const rh = Math.floor(Math.random() * (size / 4));
                graphics.fillRect(rx, ry, rw, rh);
            }

            // 3. Add Specific Details based on 'type'
            if (type === 'bookshelf') {
                // Draw Shelves
                graphics.fillStyle(0x3e2723); // Dark wood
                graphics.fillRect(2, 16, size-4, 4);
                graphics.fillRect(2, 32, size-4, 4);
                graphics.fillRect(2, 48, size-4, 4);

                // Draw "Books" (Random colored rectangles)
                const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
                for (let r = 0; r < 3; r++) { // 3 rows
                    let cx = 4;
                    while(cx < size - 8) {
                        const bw = 4 + Math.random() * 8; // Book width
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        graphics.fillStyle(color);
                        graphics.fillRect(cx, (r * 16) + 4, bw, 12);
                        cx += bw + 1;
                    }
                }
            } else if (type === 'plant') {
                // Pot
                graphics.fillStyle(0x8B4513); // Clay color
                graphics.fillRect(16, 32, 32, 32);
                // Leaves
                graphics.fillStyle(0x32CD32); // Green
                graphics.fillCircle(32, 24, 16);
                graphics.fillCircle(20, 32, 12);
                graphics.fillCircle(44, 32, 12);
            } else if (type === 'chair') {
                // Chair Back
                graphics.fillStyle(0x5D4037); // Darker Wood
                graphics.fillRect(10, 0, size - 20, 32);
                // Seat
                graphics.fillStyle(0x8D6E63); // Lighter Wood
                graphics.fillRect(10, 32, size - 20, 10);
                // Legs
                graphics.fillRect(10, 42, 6, 22);
                graphics.fillRect(size - 16, 42, 6, 22);
            } else if (type === 'crafting') {
                 // Table top details
                 graphics.fillStyle(0xD7CCC8);
                 graphics.fillRect(10, 10, size-20, size-20);
                 // Tools (symbolic)
                 graphics.fillStyle(0x555555);
                 graphics.fillRect(20, 20, 10, 20); // Hammer handle?
            } else if (type === 'npc') {
                // Face
                graphics.fillStyle(0xFFE0BD); // Skin tone
                graphics.fillRect(12, 8, 24, 20);
                // Eyes
                graphics.fillStyle(0x000000);
                graphics.fillRect(16, 16, 4, 4);
                graphics.fillRect(28, 16, 4, 4);
            }

            // 4. Border (Makes it pop)
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(0, 0, size, size);

            graphics.generateTexture(key, size, size);
        };

        // --- Helper: Create Emoji Textures (Canvas-based) ---
        const createEmojiTexture = (key, emoji, size) => {
            // Check if texture already exists to avoid warnings
            if (this.textures.exists(key)) return;

            // Use direct Canvas creation for emoji textures
            // This avoids the 'Text.generateTexture' issue in older Phaser versions
            const canvasTex = this.textures.createCanvas(key, size, size);
            const ctx = canvasTex.context;

            // Clear
            ctx.clearRect(0, 0, size, size);

            // Draw Emoji
            ctx.font = `${size - 16}px serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Adjust y position slightly for vertical centering
            ctx.fillText(emoji, size / 2, size / 2 + 2);

            canvasTex.refresh();
        };

        // --- 1. Generate World Objects (snake_case keys) ---
        // 'bookshelf' is now loaded from assets
        createDetailedBox('fancy_bookshelf', 0xD2691E, 64, 'bookshelf'); // Reuse bookshelf logic but diff color
        createDetailedBox('plant', 0x228B22, 64, 'plant');
        createDetailedBox('crafting_table', 0xA0522D, 64, 'crafting');
        createDetailedBox('masterwork_chair', 0xFFD700, 64, 'chair'); // Gold color for Masterwork

        // NPCs
        createDetailedBox('npc_scout', 0x704214, 48, 'npc');
        createDetailedBox('npc_artisan', 0x4682B4, 48, 'npc');
        createDetailedBox('npc_villager', 0x6B8E23, 48, 'npc');

        // Baskets (Onboarding)
        const createBox = (key, color, size) => {
            graphics.clear();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, size, size);
            graphics.generateTexture(key, size, size);
        };
        createBox('basket_adventurer', 0xA52A2A, 64);
        createBox('basket_nurturer', 0x32CD32, 64);
        createBox('basket_intellectual', 0x4169E1, 64);

        // --- 2. Generate Inventory/UI Icons (Item Name keys) ---
        // Iterates through ItemData.js to create textures for every defined item
        for (const [itemName, def] of Object.entries(ItemDefinitions)) {
            if (def.emoji) {
                createEmojiTexture(itemName, def.emoji, 64);
            }
        }

        // --- 3. UI Elements ---
        // Bubbles
        graphics.clear();
        graphics.fillStyle(0xFFFFFF); graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('thought_bubble', 32, 32);

        graphics.clear();
        graphics.fillStyle(0xADD8E6); graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('explore_bubble', 32, 32);

        // Pixel
        graphics.clear();
        graphics.fillStyle(0xFFFFFF); graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('pixel', 1, 1);

        // Pet Spritesheet (64x16) - 4 frames of 16x16
        graphics.clear();
        graphics.fillStyle(0xFFFF00); graphics.fillRect(0, 0, 16, 16); // Happy (Yellow)
        graphics.fillStyle(0xFFFFFF); graphics.fillRect(16, 0, 16, 16); // Neutral (White)
        graphics.fillStyle(0x0000FF); graphics.fillRect(32, 0, 16, 16); // Sad (Blue)
        graphics.fillStyle(0xFF0000); graphics.fillRect(48, 0, 16, 16); // Angry (Red)
        graphics.generateTexture('pet', 64, 16);

        graphics.destroy();
    }

    /**
     * Creates a visual loading bar to indicate progress.
     * @private
     */
    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
    }

    /**
     * Phaser lifecycle method: create.
     * Transitions to the StartScene once loading is complete.
     */
    create() {
        // Updated to start StartScene instead of MainScene
        this.scene.start('StartScene');
    }
}
