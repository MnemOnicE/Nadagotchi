export class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        // Loading bar implementation
        this.createLoadingBar();

        // Generate textures programmatically to avoid external dependency issues
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Helper to create simple colored box textures
        const createBox = (key, color, size) => {
            graphics.clear();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, size, size);
            graphics.generateTexture(key, size, size);
        };

        createBox('bookshelf', 0x8B4513, 64);
        createBox('fancy_bookshelf', 0xD2691E, 64);
        createBox('plant', 0x228B22, 64);
        createBox('crafting_table', 0xA0522D, 64);
        createBox('npc_scout', 0x704214, 48);
        createBox('npc_artisan', 0x4682B4, 48);
        createBox('npc_villager', 0x6B8E23, 48);

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

    create() {
        // Once loading is done, start MainScene
        this.scene.start('MainScene');
    }
}
