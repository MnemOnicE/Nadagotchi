export class WikiUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.wikiSystem = null; // Injected from MainScene
        this.isVisible = false;

        this.background = null;
        this.titleText = null;
        this.closeBtn = null;
        this.categoryContainer = null;
        this.entryContainer = null;
        this.contentContainer = null;
        this.currentCategory = null;
        this.scrollOffset = 0;
    }

    create() {
        const { width, height } = this.scene.cameras.main;
        const mainScene = this.scene.scene.get('MainScene');
        if (mainScene && mainScene.wikiSystem) {
            this.wikiSystem = mainScene.wikiSystem;
        } else {
            return; // In tests or environments without WikiSystem
        }

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000); // Above everything
        this.container.setVisible(false);

        // Dim overlay
        this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive(); // Block clicks

        // Main modal BG
        const modalWidth = Math.min(width * 0.9, 600);
        const modalHeight = Math.min(height * 0.8, 800);
        const startX = (width - modalWidth) / 2;
        const startY = (height - modalHeight) / 2;

        this.background = this.scene.add.rectangle(startX, startY, modalWidth, modalHeight, 0xEBE0C8)
            .setOrigin(0)
            .setStrokeStyle(4, 0x4A4A4A);

        this.titleText = this.scene.add.text(width / 2, startY + 20, "NADAGOTCHI WIKI", {
            fontFamily: 'VT323, monospace', fontSize: '36px', color: '#000000'
        }).setOrigin(0.5);

        this.closeBtn = this.scene.add.text(startX + modalWidth - 30, startY + 10, "X", {
            fontFamily: 'VT323, monospace', fontSize: '28px', color: '#ff0000'
        }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.hide());

        this.container.add([this.overlay, this.background, this.titleText, this.closeBtn]);

        // Sub-containers for dynamic content
        this.categoryContainer = this.scene.add.container(startX + 20, startY + 60);
        this.entryContainer = this.scene.add.container(startX + 20, startY + 110);
        this.container.add([this.categoryContainer, this.entryContainer]);

        // Input handling for scrolling entries
        this.background.setInteractive().on('wheel', (pointer, dx, dy, dz, event) => {
            this.scrollOffset -= dy;
            this.renderEntries();
        });

        // Add a hidden dummy scroll zone for touch devices
        this.scene.input.on('pointermove', (pointer) => {
            if (!this.isVisible || !pointer.isDown) return;
            this.scrollOffset += (pointer.y - pointer.prevPosition.y);
            this.renderEntries();
        });
    }

    show() {
        if (!this.container) this.create();
        if (!this.wikiSystem) return;

        this.isVisible = true;
        this.container.setVisible(true);
        this.scene.children.bringToTop(this.container);
        this.currentCategory = this.wikiSystem.categories[0];
        this.renderCategories();
        this.renderEntries();
    }

    hide() {
        this.isVisible = false;
        if (this.container) this.container.setVisible(false);
        this.scene.scene.resume("MainScene");
    }

    renderCategories() {
        this.categoryContainer.removeAll(true);
        let xOffset = 0;

        this.wikiSystem.categories.forEach(cat => {
            const isSelected = this.currentCategory === cat;
            const btnBg = this.scene.add.rectangle(xOffset, 0, 100, 30, isSelected ? 0xD8A373 : 0xA3B8A2)
                .setOrigin(0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.currentCategory = cat;
                    this.scrollOffset = 0;
                    this.renderCategories();
                    this.renderEntries();
                });

            const btnText = this.scene.add.text(xOffset + 50, 15, cat.toUpperCase(), {
                fontFamily: 'VT323, monospace', fontSize: '18px', color: '#000000'
            }).setOrigin(0.5);

            this.categoryContainer.add([btnBg, btnText]);
            xOffset += 110;
        });
    }

    renderEntries() {
        this.entryContainer.removeAll(true);
        if (!this.wikiSystem) return;

        const entries = this.wikiSystem.getEntries(this.currentCategory) || [];
        const modalHeight = this.background.height;
        const maxScroll = Math.min(0, -((entries.length * 40) - (modalHeight - 150)));

        if (this.scrollOffset > 0) this.scrollOffset = 0;
        if (entries.length * 40 > modalHeight - 150 && this.scrollOffset < maxScroll) this.scrollOffset = maxScroll;
        if (entries.length * 40 <= modalHeight - 150) this.scrollOffset = 0;

        if (entries.length === 0) {
            this.entryContainer.add(this.scene.add.text(10, 20, "No entries discovered yet...", {
                fontFamily: 'VT323, monospace', fontSize: '24px', color: '#555555'
            }));
            return;
        }

        let yOffset = this.scrollOffset;
        // Basic rendering logic
        entries.forEach((entry, index) => {
            if (yOffset > -40 && yOffset < modalHeight - 120) {
                const entryBg = this.scene.add.rectangle(0, yOffset, this.background.width - 40, 35, 0xFFFFFF)
                    .setOrigin(0)
                    .setStrokeStyle(1, 0x000000);

                const entryText = this.scene.add.text(10, yOffset + 17, `📖 ${entry}`, {
                    fontFamily: 'VT323, monospace', fontSize: '22px', color: '#000000'
                }).setOrigin(0, 0.5);

                this.entryContainer.add([entryBg, entryText]);
            }
            yOffset += 40;
        });
    }

    resize(scale) {
        if (this.isVisible) {
            this.container.destroy();
            this.create();
            this.show();
        }
    }
}
