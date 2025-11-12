/**
 * BreedingScene is a Phaser Scene for the Generational Legacy system.
 * It provides a serene, graphical environment for retiring a pet and creating a new generation.
 */
class BreedingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BreedingScene' });
        this.interactiveItems = []; // To store references to interactive items
    }

    /**
     * Initializes data passed from the UIScene.
     * @param {object} data - Contains the parent pet's state.
     */
    init(data) {
        this.parentData = data;
        this.persistence = new PersistenceManager();
        this.selectedItems = []; // To track environmental influences
    }

    /**
     * Preloads necessary assets for this scene, such as the particle texture.
     */
    preload() {
        // Create a 1x1 white pixel texture for the particle emitter
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('pixel', 1, 1);
        graphics.destroy();
    }

    /**
     * Main scene setup. Creates the graphical environment and UI elements.
     */
    create() {
        this.cameras.main.setBackgroundColor('#003300');
        this.createLightMotes();

        this.add.text(this.cameras.main.width / 2, 50, 'The Legacy Sanctuary', {
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            color: '#b2d8b2',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.parentContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50);
        const stage = this.add.graphics().fillStyle(0x002200, 0.8).fillEllipse(0, 50, 150, 40);
        const parentSprite = this.add.text(0, 20, '\u{1F430}', { fontSize: '64px' }).setOrigin(0.5);
        const parentInfo = `Generation ${this.parentData.generation} - ${this.parentData.dominantArchetype}`;
        const parentText = this.add.text(0, 120, parentInfo, { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
        this.parentContainer.add([stage, parentSprite, parentText]);

        this.itemSelectionPanel = this.createItemSelectionPanel();

        this.initiateButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, 'Initiate New Generation', {
            padding: { x: 15, y: 10 },
            backgroundColor: '#006400',
            fontSize: '20px',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setInteractive();

        this.initiateButton.on('pointerdown', () => this.createConfirmationModal());
        this.initiateButton.on('pointerover', () => this.initiateButton.setBackgroundColor('#008800'));
        this.initiateButton.on('pointerout', () => this.initiateButton.setBackgroundColor('#006400'));
    }

    /**
     * Creates the UI panel for selecting environmental influence items.
     */
    createItemSelectionPanel() {
        this.interactiveItems = []; // Reset the array
        const panelX = this.cameras.main.width / 2;
        const panelY = this.cameras.main.height / 2 + 150;

        const panelContainer = this.add.container(panelX, panelY);

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x002200, 0.9);
        panelBg.fillRoundedRect(-250, -50, 500, 100, 10);
        panelBg.lineStyle(2, 0xb2d8b2, 0.5);
        panelBg.strokeRoundedRect(-250, -50, 500, 100, 10);
        panelContainer.add(panelBg);

        const panelTitle = this.add.text(0, -30, 'Choose Environmental Influences', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#b2d8b2'
        }).setOrigin(0.5);
        panelContainer.add(panelTitle);

        const items = [
            { name: 'logic', emoji: '\u{1F9E0}', description: 'Ancient Tome' },
            { name: 'empathy', emoji: '\u{1F496}', description: 'Heart Amulet' },
            { name: 'creativity', emoji: '\u{1F3A8}', description: 'Muse Flower' }
        ];

        items.forEach((item, index) => {
            const itemX = -150 + (index * 150);
            const itemY = 20;

            const itemContainer = this.add.container(itemX, itemY);
            const itemSprite = this.add.text(0, 0, item.emoji, { fontSize: '48px' }).setOrigin(0.5).setInteractive();
            this.interactiveItems.push(itemSprite); // Store reference
            const itemText = this.add.text(0, 35, item.description, { fontSize: '12px', fontFamily: 'Arial' }).setOrigin(0.5);

            itemContainer.add([itemSprite, itemText]);

            const glow = this.add.graphics();
            glow.fillStyle(0xffff00, 0.4);
            glow.fillCircle(0, 0, 30);
            glow.setVisible(false);
            itemContainer.add(glow);

            itemSprite.on('pointerdown', () => {
                const itemIndex = this.selectedItems.indexOf(item.name);
                if (itemIndex > -1) {
                    this.selectedItems.splice(itemIndex, 1);
                    glow.setVisible(false);
                } else {
                    this.selectedItems.push(item.name);
                    glow.setVisible(true);
                }
            });
            panelContainer.add(itemContainer);
        });
        return panelContainer;
    }

    /**
     * Creates a confirmation modal to review choices before proceeding.
     */
    createConfirmationModal() {
        this.initiateButton.disableInteractive();
        this.interactiveItems.forEach(item => item.disableInteractive());

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const modalContainer = this.add.container(centerX, centerY);
        modalContainer.setAlpha(0);

        const bg = this.add.graphics().fillStyle(0x001a00, 0.95).fillRoundedRect(-200, -150, 400, 300, 15);
        bg.lineStyle(2, 0xb2d8b2, 1).strokeRoundedRect(-200, -150, 400, 300, 15);
        modalContainer.add(bg);

        const title = this.add.text(0, -120, 'Confirm Legacy?', { fontFamily: 'Georgia', fontSize: '24px', color: '#b2d8b2' }).setOrigin(0.5);
        const influenceText = `Influences: ${this.selectedItems.join(', ') || 'None'}`;
        const summary = this.add.text(0, -50, `The spirit of this ${this.parentData.dominantArchetype} will be passed on.\n\n${influenceText}`, {
            align: 'center',
            wordWrap: { width: 380 },
            fontFamily: 'Arial',
            fontSize: '16px'
        }).setOrigin(0.5);
        modalContainer.add([title, summary]);

        const confirmButton = this.add.text(-80, 100, 'Confirm', { padding: { x: 10, y: 5 }, backgroundColor: '#006400' }).setOrigin(0.5).setInteractive();
        const cancelButton = this.add.text(80, 100, 'Cancel', { padding: { x: 10, y: 5 }, backgroundColor: '#8B0000' }).setOrigin(0.5).setInteractive();
        modalContainer.add([confirmButton, cancelButton]);

        confirmButton.on('pointerdown', () => {
            modalContainer.destroy();
            this.calculateAndDisplayEgg();
        });

        cancelButton.on('pointerdown', () => {
            this.initiateButton.setInteractive();
            this.interactiveItems.forEach(item => item.setInteractive());
            modalContainer.destroy();
        });

        this.tweens.add({ targets: modalContainer, alpha: 1, duration: 300 });
    }

    /**
     * Creates a particle emitter for the "sparkling motes of light" effect.
     */
    createLightMotes() {
        const particles = this.add.particles('pixel');
        particles.createEmitter({
            x: { min: 0, max: this.cameras.main.width },
            y: { min: 0, max: this.cameras.main.height },
            lifespan: 4000,
            speed: { min: 10, max: 40 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.9, end: 0 },
            blendMode: 'ADD',
            tint: 0xb2d8b2,
            quantity: 1,
            frequency: 120
        });
    }

    /**
     * Calculates the new pet's data and transitions to the egg display.
     */
    calculateAndDisplayEgg() {
        const newPetData = this.calculateLegacy();
        this.tweens.add({
            targets: [this.parentContainer, this.itemSelectionPanel, this.initiateButton],
            alpha: 0,
            duration: 500,
            onComplete: () => this.displayEgg(newPetData)
        });
    }

    /**
     * Displays the procedurally designed egg and waits for player confirmation.
     */
    displayEgg(newPetData) {
        // ... (code is identical to previous version)
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const eggContainer = this.add.container(centerX, centerY);
        eggContainer.setAlpha(0);

        const archetypeStyles = {
            'Adventurer': { color: 0xffa500, pattern: '▲' },
            'Nurturer': { color: 0x90ee90, pattern: '❤' },
            'Mischievous': { color: 0x800080, pattern: '§' },
            'Intellectual': { color: 0x87ceeb, pattern: '♦' },
            'Recluse': { color: 0xa9a9a9, pattern: '●' },
            'Default': { color: 0xffffff, pattern: '?' }
        };
        const style = archetypeStyles[newPetData.dominantArchetype] || archetypeStyles['Default'];

        const eggGraphic = this.add.graphics();
        eggGraphic.fillStyle(style.color, 1);
        eggGraphic.fillEllipse(0, 0, 80, 100);
        const eggPattern = this.add.text(0, 0, style.pattern, { fontSize: '48px', color: '#000000', alpha: 0.2 }).setOrigin(0.5);

        const eggTitle = this.add.text(0, -120, 'A New Beginning', { fontSize: '24px', fontFamily: 'Georgia' }).setOrigin(0.5);
        const eggSubtitle = this.add.text(0, 120, 'Click the egg to welcome the new generation.', { fontSize: '16px', fontFamily: 'Arial' }).setOrigin(0.5);

        eggContainer.add([eggGraphic, eggPattern, eggTitle, eggSubtitle]);

        eggContainer.setSize(160, 200).setInteractive();
        eggContainer.on('pointerdown', () => {
            this.finalizeLegacy(newPetData);
        });

        this.tweens.add({
            targets: eggContainer,
            alpha: 1,
            duration: 500
        });
    }

    /**
     * Calculates the new pet's data based on parent and influences.
     */
    calculateLegacy() {
        // ... (code is identical to previous version)
        const between = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
        const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const topArchetype = this.parentData.dominantArchetype;
        let secondArchetype = 'Adventurer';
        let maxPoints = -1;
        for (const archetype in this.parentData.personalityPoints) {
            if (archetype !== topArchetype && this.parentData.personalityPoints[archetype] > maxPoints) {
                maxPoints = this.parentData.personalityPoints[archetype];
                secondArchetype = archetype;
            }
        }

        const newPetData = {
            mood: 'neutral',
            dominantArchetype: topArchetype,
            personalityPoints: { [topArchetype]: 5, [secondArchetype]: 2 },
            stats: { hunger: 100, energy: 100, happiness: 70 },
            skills: { communication: 1, resilience: 1, navigation: 0, empathy: 0, logic: 0, focus: 0, crafting: 0 },
            currentCareer: null,
            inventory: [],
            age: 0,
            generation: this.parentData.generation + 1,
            isLegacyReady: false,
            legacyTraits: [],
            moodSensitivity: clamp(this.parentData.moodSensitivity + between(-1, 1), 1, 10),
            hobbies: { painting: 0, music: 0 },
            relationships: { friend: { level: 0 } },
            location: 'Home'
        };

        if (this.selectedItems.includes('logic')) newPetData.personalityPoints.Intellectual = (newPetData.personalityPoints.Intellectual || 0) + 5;
        if (this.selectedItems.includes('empathy')) newPetData.personalityPoints.Nurturer = (newPetData.personalityPoints.Nurturer || 0) + 5;
        if (this.selectedItems.includes('creativity')) {
            newPetData.personalityPoints.Mischievous = (newPetData.personalityPoints.Mischievous || 0) + 3;
            newPetData.hobbies.painting = (newPetData.hobbies.painting || 0) + 10;
        }

        this.parentData.legacyTraits.forEach(trait => {
            if (Math.random() < 0.3) newPetData.legacyTraits.push(trait);
        });

        if (Math.random() < 0.05) {
            const possibleNewTraits = ["Quick Learner", "Resilient Spirit", "Charming"];
            newPetData.legacyTraits.push(getRandom(possibleNewTraits));
        }

        return newPetData;
    }

    /**
     * Saves data and restarts the game with the new pet.
     */
    finalizeLegacy(newPetData) {
        this.persistence.saveToHallOfFame(this.parentData);
        this.persistence.clearActivePet();
        this.scene.start('MainScene', { newPetData: newPetData });
    }
}
