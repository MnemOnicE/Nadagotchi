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
        this.load.image('bookshelf', 'public/assets/sprites/bookshelf_64x64.png');

        // Load Pet Spritesheet
        this.load.spritesheet('pet', 'public/assets/sprites/pet_spritesheet.png', { frameWidth: 16, frameHeight: 16 });

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

        // Housing Textures (Procedural patterns)
        const createPattern = (key, color1, color2, type) => {
            graphics.clear();
            graphics.fillStyle(color1);
            graphics.fillRect(0, 0, 64, 64);

            graphics.fillStyle(color2);
            if (type === 'stripes') {
                for(let i=0; i<64; i+=16) graphics.fillRect(i, 0, 8, 64);
            } else if (type === 'bricks') {
                 for(let y=0; y<64; y+=16) {
                     for(let x=(y%32===0?0:16); x<64; x+=32) {
                         graphics.fillRect(x, y, 30, 14);
                     }
                 }
            } else if (type === 'planks') {
                for(let i=0; i<64; i+=8) graphics.fillRect(0, i, 64, 2);
            } else if (type === 'tiles') {
                for(let y=0; y<64; y+=32) {
                    for(let x=0; x<64; x+=32) {
                        graphics.fillRect(x+2, y+2, 28, 28);
                    }
                }
            } else {
                 // Solid default
            }
            graphics.generateTexture(key, 64, 64);
        };

        createPattern('wallpaper_default', 0xF5F5DC, 0xE0D6B9, 'solid');
        createPattern('wallpaper_blue', 0xADD8E6, 0x87CEEB, 'stripes');
        createPattern('wallpaper_brick', 0xA52A2A, 0x800000, 'bricks');

        createPattern('flooring_default', 0xD2B48C, 0x8B4513, 'solid');
        createPattern('flooring_wood', 0xDEB887, 0x8B4513, 'planks');
        createPattern('flooring_tile', 0x808080, 0xA9A9A9, 'tiles');

        // --- 1. Generate World Objects (snake_case keys) ---
        // 'bookshelf' is now loaded from assets
        createDetailedBox('fancy_bookshelf', 0xD2691E, 64, 'bookshelf'); // Reuse bookshelf logic but diff color
        createDetailedBox('plant', 0x228B22, 64, 'plant');
        createDetailedBox('wooden_chair', 0x8B4513, 64, 'chair');
        createDetailedBox('crafting_table', 0xA0522D, 64, 'crafting');
        createDetailedBox('masterwork_chair', 0xFFD700, 64, 'chair'); // Gold color for Masterwork

        // Housing Items (Procedural Textures)
        this._generateHousingTextures();

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

        graphics.destroy();
    }

    /**
     * Generates textures for housing items (Wallpapers, Flooring).
     */
    _generateHousingTextures() {
        // 1. Cozy Wallpaper (Striped)
        if (!this.textures.exists('cozy_wallpaper')) {
            const graphics = this.make.graphics();
            // Background (Cream)
            graphics.fillStyle(0xFDF5E6, 1);
            graphics.fillRect(0, 0, 64, 64);
            // Stripes (Pale Pink)
            graphics.fillStyle(0xFFC0CB, 0.5);
            for (let i = 0; i < 64; i += 16) {
                graphics.fillRect(i, 0, 8, 64);
            }
            graphics.generateTexture('cozy_wallpaper', 64, 64);
            graphics.destroy();
        }

        // 2. Wood Flooring (Planks)
        if (!this.textures.exists('wood_flooring')) {
            const graphics = this.make.graphics();
            // Base Color (Wood)
            graphics.fillStyle(0xDEB887, 1); // Burlywood
            graphics.fillRect(0, 0, 64, 64);
            // Plank Lines
            graphics.lineStyle(2, 0x8B4513, 1); // Saddle Brown
            for (let i = 0; i < 64; i += 16) {
                graphics.strokeRect(i, 0, 16, 64);
                // Random cross lines for plank ends
                if (i % 32 === 0) graphics.lineBetween(i, 32, i + 16, 32);
            }
            graphics.generateTexture('wood_flooring', 64, 64);
            graphics.destroy();
        }

        // 3. Grass Flooring (Already exists effectively as logic, but useful for icons)
        if (!this.textures.exists('grass_flooring')) {
            const graphics = this.make.graphics();
            graphics.fillStyle(0x228B22, 1); // Forest Green
            graphics.fillRect(0, 0, 64, 64);
            // Texture details
            graphics.fillStyle(0x32CD32, 1);
            for (let k = 0; k < 10; k++) {
                graphics.fillCircle(Phaser.Math.Between(0, 64), Phaser.Math.Between(0, 64), 2);
            }
            graphics.generateTexture('grass_flooring', 64, 64);
            graphics.destroy();
        }

        // 4. Door (For Transitions)
        if (!this.textures.exists('door_icon')) {
            const graphics = this.make.graphics();
            // Door Frame
            graphics.fillStyle(0x8B4513, 1);
            graphics.fillRect(16, 8, 32, 56);
            // Door Panel
            graphics.fillStyle(0xD2691E, 1);
            graphics.fillRect(20, 12, 24, 52);
            // Knob
            graphics.fillStyle(0xFFD700, 1);
            graphics.fillCircle(40, 36, 3);
            graphics.generateTexture('door_icon', 64, 64);
            graphics.destroy();
        }

        // 5. House (For Garden -> Indoor Transition)
        if (!this.textures.exists('house_icon')) {
            const graphics = this.make.graphics();
            // Walls
            graphics.fillStyle(0xF5DEB3, 1); // Wheat
            graphics.fillRect(12, 24, 40, 40);
            // Roof
            graphics.fillStyle(0xA52A2A, 1); // Brown
            graphics.beginPath();
            graphics.moveTo(8, 24);
            graphics.lineTo(32, 4);
            graphics.lineTo(56, 24);
            graphics.fill();
            // Door
            graphics.fillStyle(0x8B4513, 1);
            graphics.fillRect(28, 44, 16, 20);
            graphics.generateTexture('house_icon', 64, 64);
            graphics.destroy();
        }
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
