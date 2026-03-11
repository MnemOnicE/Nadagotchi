import { SceneUIUtils } from './utils/SceneUIUtils.js';

export class BaseMinigameScene extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    create() {
        this.bezelGraphics = this.add.graphics().setDepth(100);
        this.scale.on('resize', this.resize, this);
    }

    addResponsiveUI(config) {
        const { titleText, gameContainerHeight } = config;

        const centerX = SceneUIUtils.getCenterX(this);
        const padding = SceneUIUtils.getPadding(this);

        this.titleText = this.add.text(centerX, padding + 20, titleText, {
            fontFamily: 'VT323, monospace',
            fontSize: '32px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.footerText = this.add.text(centerX, this.scale.height - padding - 20, "Complete the task!", {
            fontFamily: 'VT323, monospace',
            fontSize: '24px',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        this.gameContainerHeight = gameContainerHeight || 400;

        // Force initial resize layout
        this.resize(this.scale);
    }

    resize(gameSize) {
        if (!gameSize) return;
        const width = gameSize.width;
        const height = gameSize.height;
        this.cameras.main.setViewport(0, 0, width, height);

        const centerX = SceneUIUtils.getCenterX(this);
        const padding = SceneUIUtils.getPadding(this);

        if (this.titleText) {
            this.titleText.setPosition(centerX, padding + 20);
        }
        if (this.footerText) {
            this.footerText.setPosition(centerX, height - padding - 20);
        }

        SceneUIUtils.drawBezel(this, this.bezelGraphics);
    }
}
