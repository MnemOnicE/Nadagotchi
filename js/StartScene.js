import { ButtonFactory } from './ButtonFactory.js';
import { PersistenceManager } from './PersistenceManager.js';

/**
 * @fileoverview The Main Menu / Onboarding Scene.
 * Represents the "Town Gate" where players arrive or return to the world.
 * Handles New Game (Archetype Selection) and Load Game functionality.
 */
export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        // --- Background (Horizon) ---
        // Reuse the sky generation logic for a nice background
        this.createSkyBackground();

        // --- Title ---
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height * 0.2, 'NADAGOTCHI', {
            fontFamily: 'VT323, monospace',
            fontSize: '80px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.2 + 60, 'The Digital Life Sim', {
            fontFamily: 'VT323, monospace',
            fontSize: '32px',
            color: '#eeeeee',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // --- Persistence Check ---
        this.persistence = new PersistenceManager();
        const existingPet = this.persistence.loadPet();

        // --- Menu Buttons ---
        this.menuContainer = this.add.container(0, 0);

        let buttonY = height * 0.5;

        if (existingPet) {
            const resumeBtn = ButtonFactory.createButton(this, width / 2, buttonY, 'ENTER WORLD', () => {
                this.scene.start('MainScene');
            }, { width: 250, height: 60, fontSize: '32px', color: 0x4CAF50 });
            this.menuContainer.add(resumeBtn);
            buttonY += 80;
        }

        const newGameBtn = ButtonFactory.createButton(this, width / 2, buttonY, 'ARRIVE (New Game)', () => {
            this.showArchetypeSelection();
        }, { width: 250, height: 60, fontSize: '32px', color: 0x2196F3 });
        this.menuContainer.add(newGameBtn);

        // --- Archetype Selection Container (Hidden initially) ---
        this.selectionContainer = this.add.container(0, 0);
        this.selectionContainer.setVisible(false);
    }

    /**
     * Shows the "Welcome Basket" selection screen.
     */
    showArchetypeSelection() {
        this.menuContainer.setVisible(false);
        this.selectionContainer.setVisible(true);
        this.selectionContainer.removeAll(true); // Clear previous if any

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const title = this.add.text(width / 2, height * 0.3, 'Choose your Welcome Basket', {
            fontFamily: 'VT323, monospace',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.selectionContainer.add(title);

        const archetypes = [
            { key: 'Adventurer', color: 0xA52A2A, desc: 'Energetic & Curious', texture: 'basket_adventurer' },
            { key: 'Nurturer', color: 0x32CD32, desc: 'Kind & Caring', texture: 'basket_nurturer' },
            { key: 'Intellectual', color: 0x4169E1, desc: 'Smart & Logical', texture: 'basket_intellectual' }
        ];

        let startX = width / 2 - 200;
        const spacing = 200;

        archetypes.forEach((arch, index) => {
            const x = startX + (index * spacing);
            const y = height * 0.55;

            // Basket Image
            const basket = this.add.image(x, y, arch.texture).setScale(1.5).setInteractive({ useHandCursor: true });

            // Hover effects
            basket.on('pointerover', () => basket.setScale(1.7));
            basket.on('pointerout', () => basket.setScale(1.5));
            basket.on('pointerdown', () => this.startGame(arch.key));

            // Label
            const label = this.add.text(x, y + 60, arch.key, {
                fontFamily: 'VT323, monospace',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            // Description
            const desc = this.add.text(x, y + 90, arch.desc, {
                fontFamily: 'VT323, monospace',
                fontSize: '18px',
                color: '#dddddd',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.selectionContainer.add([basket, label, desc]);
        });

        // Back Button
        const backBtn = ButtonFactory.createButton(this, width / 2, height - 80, 'Back', () => {
            this.selectionContainer.setVisible(false);
            this.menuContainer.setVisible(true);
        }, { width: 100, height: 40, color: 0x888888 });
        this.selectionContainer.add(backBtn);
    }

    /**
     * Starts the main game with the selected archetype and tutorial enabled.
     * @param {string} archetype
     */
    startGame(archetype) {
        // Clear existing save to ensure fresh start
        this.persistence.clearAllData();

        this.scene.start('MainScene', {
            newPetData: { dominantArchetype: archetype },
            startTutorial: true
        });
    }

    /**
     * Creates a simple gradient sky background.
     */
    createSkyBackground() {
        const width = this.scale.width;
        const height = this.scale.height;

        const texture = this.textures.createCanvas('start_sky', width, height);
        const context = texture.context;
        const gradient = context.createLinearGradient(0, 0, 0, height);

        // Dawn/Morning colors
        gradient.addColorStop(0, '#87CEEB'); // Sky Blue
        gradient.addColorStop(1, '#FFDAB9'); // Peach Puff

        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        texture.refresh();

        this.add.image(0, 0, 'start_sky').setOrigin(0);

        // Add some ground
        this.add.rectangle(0, height - 50, width, 50, 0x228B22).setOrigin(0);
    }
}
