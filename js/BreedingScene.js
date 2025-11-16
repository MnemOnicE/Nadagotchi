/**
 * @class BreedingScene
 * @extends Phaser.Scene
 * @classdesc
 * A Phaser Scene for the Generational Legacy system.
 * It provides a graphical environment for retiring a pet and influencing the creation of a new generation.
 */
class BreedingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BreedingScene' });
        /** @type {Array<Phaser.GameObjects.GameObject>} */
        this.interactiveItems = [];
    }

    /**
     * Initializes data passed from the MainScene when this scene is started.
     * @param {object} data - The data object from the previous scene.
     * @param {Nadagotchi} data.parentData - The state of the parent pet being retired.
     */
    init(data) {
        /** @type {Nadagotchi} */
        this.parentData = data;
        /** @type {PersistenceManager} */
        this.persistence = new PersistenceManager();
        /** @type {Array<string>} */
        this.selectedItems = [];
    }

    /**
     * Phaser lifecycle method. Preloads necessary assets, in this case, a pixel texture for particles.
     */
    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('pixel', 1, 1);
        graphics.destroy();
    }

    /**
     * Phaser lifecycle method. Sets up the main scene, creating the environment and UI elements.
     */
    create() {
        this.cameras.main.setBackgroundColor('#003300');
        this.createLightMotes();

        this.add.text(this.cameras.main.width / 2, 50, 'The Legacy Sanctuary', {
            fontFamily: 'Georgia, serif', fontSize: '32px', color: '#b2d8b2', fontStyle: 'italic'
        }).setOrigin(0.5);

        // --- Parent Display ---
        this.parentContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50);
        const stage = this.add.graphics().fillStyle(0x002200, 0.8).fillEllipse(0, 50, 150, 40);
        const parentSprite = this.add.text(0, 20, '⭐', { fontSize: '64px' }).setOrigin(0.5);
        const parentInfo = `Generation ${this.parentData.generation} - ${this.parentData.dominantArchetype}`;
        const parentText = this.add.text(0, 120, parentInfo, { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
        this.parentContainer.add([stage, parentSprite, parentText]);

        // --- Item Selection ---
        this.itemSelectionPanel = this.createItemSelectionPanel();

        // --- Initiate Button ---
        this.initiateButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, 'Initiate New Generation', {
            padding: { x: 15, y: 10 }, backgroundColor: '#006400', fontSize: '20px', fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setInteractive();

        this.initiateButton.on('pointerdown', () => this.createConfirmationModal());
        this.initiateButton.on('pointerover', () => this.initiateButton.setBackgroundColor('#008800'));
        this.initiateButton.on('pointerout', () => this.initiateButton.setBackgroundColor('#006400'));
    }

    /**
     * Creates the UI panel for selecting environmental influence items.
     * @returns {Phaser.GameObjects.Container} The container for the item selection panel.
     * @private
     */
    createItemSelectionPanel() {
        this.interactiveItems = [];
        const panelContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150);
        const panelBg = this.add.graphics().fillStyle(0x002200, 0.9).fillRoundedRect(-250, -50, 500, 100, 10).lineStyle(2, 0xb2d8b2, 0.5).strokeRoundedRect(-250, -50, 500, 100, 10);
        const panelTitle = this.add.text(0, -30, 'Choose Environmental Influences', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#b2d8b2' }).setOrigin(0.5);
        panelContainer.add([panelBg, panelTitle]);

        const items = [
            { name: 'logic', emoji: '🧠', description: 'Ancient Tome' },
            { name: 'empathy', emoji: '💖', description: 'Heart Amulet' },
            { name: 'creativity', emoji: '🎨', description: 'Muse Flower' }
        ];

        items.forEach((item, index) => {
            const itemContainer = this.add.container(-150 + (index * 150), 20);
            const itemSprite = this.add.text(0, 0, item.emoji, { fontSize: '48px' }).setOrigin(0.5).setInteractive();
            this.interactiveItems.push(itemSprite);
            const itemText = this.add.text(0, 35, item.description, { fontSize: '12px', fontFamily: 'Arial' }).setOrigin(0.5);
            const glow = this.add.graphics().fillStyle(0xffff00, 0.4).fillCircle(0, 0, 30).setVisible(false);
            itemContainer.add([glow, itemSprite, itemText]);

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
     * Creates and displays a confirmation modal to review choices before proceeding.
     * @private
     */
    createConfirmationModal() {
        this.initiateButton.disableInteractive();
        this.interactiveItems.forEach(item => item.disableInteractive());

        const modalContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2).setAlpha(0);
        const bg = this.add.graphics().fillStyle(0x001a00, 0.95).fillRoundedRect(-200, -150, 400, 300, 15).lineStyle(2, 0xb2d8b2, 1).strokeRoundedRect(-200, -150, 400, 300, 15);
        const title = this.add.text(0, -120, 'Confirm Legacy?', { fontFamily: 'Georgia', fontSize: '24px', color: '#b2d8b2' }).setOrigin(0.5);
        const influenceText = `Influences: ${this.selectedItems.join(', ') || 'None'}`;
        const summary = this.add.text(0, -50, `The spirit of this ${this.parentData.dominantArchetype} will be passed on.\n\n${influenceText}`, { align: 'center', wordWrap: { width: 380 }, fontFamily: 'Arial', fontSize: '16px' }).setOrigin(0.5);
        const confirmButton = this.add.text(-80, 100, 'Confirm', { padding: { x: 10, y: 5 }, backgroundColor: '#006400' }).setOrigin(0.5).setInteractive();
        const cancelButton = this.add.text(80, 100, 'Cancel', { padding: { x: 10, y: 5 }, backgroundColor: '#8B0000' }).setOrigin(0.5).setInteractive();

        modalContainer.add([bg, title, summary, confirmButton, cancelButton]);

        confirmButton.on('pointerdown', () => this.calculateAndDisplayEgg());
        cancelButton.on('pointerdown', () => {
            this.initiateButton.setInteractive();
            this.interactiveItems.forEach(item => item.setInteractive());
            modalContainer.destroy();
        });

        this.tweens.add({ targets: modalContainer, alpha: 1, duration: 300 });
    }

    /**
     * Creates a particle emitter to produce a "sparkling motes of light" effect.
     * @private
     */
    createLightMotes() {
        this.add.particles('pixel').createEmitter({
            x: { min: 0, max: this.cameras.main.width }, y: { min: 0, max: this.cameras.main.height },
            lifespan: 4000, speed: { min: 10, max: 40 }, angle: { min: 0, max: 360 },
            scale: { start: 0.9, end: 0 }, blendMode: 'ADD', tint: 0xb2d8b2,
            quantity: 1, frequency: 120
        });
    }

    /**
     * Calculates the new pet's data and transitions the scene to the egg display.
     * @private
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
     * Displays a procedurally styled egg and waits for the player to click to hatch it.
     * @param {object} newPetData - The calculated data for the new pet.
     * @private
     */
    displayEgg(newPetData) {
        const eggContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2).setAlpha(0);
        const archetypeStyles = {
            'Adventurer': { color: 0xffa500, pattern: '▲' }, 'Nurturer': { color: 0x90ee90, pattern: '❤' },
            'Mischievous': { color: 0x800080, pattern: '§' }, 'Intellectual': { color: 0x87ceeb, pattern: '♦' },
            'Recluse': { color: 0xa9a9a9, pattern: '●' }, 'Default': { color: 0xffffff, pattern: '?' }
        };
        const style = archetypeStyles[newPetData.dominantArchetype] || archetypeStyles['Default'];

        const eggGraphic = this.add.graphics().fillStyle(style.color, 1).fillEllipse(0, 0, 80, 100);
        const eggPattern = this.add.text(0, 0, style.pattern, { fontSize: '48px', color: '#000000', alpha: 0.2 }).setOrigin(0.5);
        const eggTitle = this.add.text(0, -120, 'A New Beginning', { fontSize: '24px', fontFamily: 'Georgia' }).setOrigin(0.5);
        const eggSubtitle = this.add.text(0, 120, 'Click the egg to welcome the new generation.', { fontSize: '16px', fontFamily: 'Arial' }).setOrigin(0.5);

        eggContainer.add([eggGraphic, eggPattern, eggTitle, eggSubtitle]).setSize(160, 200).setInteractive();
        eggContainer.on('pointerdown', () => this.finalizeLegacy(newPetData));
        this.tweens.add({ targets: eggContainer, alpha: 1, duration: 500 });
    }

    /**
     * Calculates the new pet's data based on the parent's traits and selected environmental influences.
     * @returns {object} The complete data object for the new Nadagotchi.
     * @private
     */
    calculateLegacy() {
        const { dominantArchetype, personalityPoints, generation, moodSensitivity, legacyTraits } = this.parentData;

        let secondArchetype = Object.keys(personalityPoints).filter(a => a !== dominantArchetype).reduce((a, b) => personalityPoints[a] > personalityPoints[b] ? a : b);

        const newPetData = {
            mood: 'neutral', dominantArchetype: dominantArchetype,
            personalityPoints: { [dominantArchetype]: 5, [secondArchetype]: 2 },
            stats: { hunger: 100, energy: 100, happiness: 70 },
            skills: { communication: 1, resilience: 1, navigation: 0, empathy: 0, logic: 0, focus: 0, crafting: 0 },
            currentCareer: null, inventory: [], age: 0,
            generation: generation + 1, isLegacyReady: false,
            legacyTraits: legacyTraits.filter(() => Math.random() < 0.3), // 30% chance to inherit each trait
            moodSensitivity: Phaser.Math.Clamp(moodSensitivity + Phaser.Math.Between(-1, 1), 1, 10),
            hobbies: { painting: 0, music: 0 }, relationships: { friend: { level: 0 } }, location: 'Home'
        };

        if (this.selectedItems.includes('logic')) newPetData.personalityPoints.Intellectual = (newPetData.personalityPoints.Intellectual || 0) + 5;
        if (this.selectedItems.includes('empathy')) newPetData.personalityPoints.Nurturer = (newPetData.personalityPoints.Nurturer || 0) + 5;
        if (this.selectedItems.includes('creativity')) {
            newPetData.personalityPoints.Mischievous = (newPetData.personalityPoints.Mischievous || 0) + 3;
            newPetData.hobbies.painting += 10;
        }

        if (Math.random() < 0.05) newPetData.legacyTraits.push(Phaser.Utils.Array.GetRandom(["Quick Learner", "Resilient Spirit", "Charming"]));

        return newPetData;
    }

    /**
     * Finalizes the legacy process: saves the parent to the Hall of Fame, clears the active pet save,
     * and restarts the MainScene with the new pet's data.
     * @param {object} newPetData - The data for the new pet.
     * @private
     */
    finalizeLegacy(newPetData) {
        this.persistence.saveToHallOfFame(this.parentData);
        this.persistence.clearActivePet();
        this.scene.start('MainScene', { newPetData: newPetData });
    }
}
