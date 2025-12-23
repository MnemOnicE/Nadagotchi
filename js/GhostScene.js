import { ButtonFactory } from './ButtonFactory.js';
import { GhostSystem } from './systems/GhostSystem.js';
import { EventKeys } from './EventKeys.js';

export class GhostScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GhostScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Atmospheric Background
        this.add.rectangle(0, 0, width, height, 0x111122).setOrigin(0);
        this.add.text(width / 2, 50, "THE ETHER", {
            fontFamily: 'VT323', fontSize: '48px', color: '#AA88DD'
        }).setOrigin(0.5);

        // Placeholder for Ghost List
        this.add.text(width / 2, height / 2, "No spirits found... yet.", {
            fontFamily: 'VT323', fontSize: '24px', color: '#666688'
        }).setOrigin(0.5);

        // Return Button
        ButtonFactory.createButton(this, width / 2, height - 100, "Return to Life", () => {
            this.scene.start('MainScene');
        });
    }
}
