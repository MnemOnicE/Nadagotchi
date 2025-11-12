/**
 * BreedingScene is a Phaser Scene dedicated to the Generational Legacy system.
 * It allows the player to retire a pet and create a new generation with inherited traits.
 */
class BreedingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BreedingScene' });
    }

    /**
     * `init` is a Phaser lifecycle method that runs before `create`.
     * It receives data passed from the scene that started it (in this case, UIScene).
     * @param {object} data - The data object containing the parent pet's state.
     */
    init(data) {
        this.parentData = data;
        this.persistence = new PersistenceManager();
        this.selectedItems = []; // To track environmental influences
    }

    /**
     * `create` is the main setup method for the scene. It builds the UI for the legacy process.
     */
    create() {
        // --- UI Setup ---
        // Display a title for the scene.
        this.add.text(this.cameras.main.width / 2, 50, 'Pass on the Legacy', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Display information about the retiring parent pet.
        this.add.text(100, 100, `Parent: Gen ${this.parentData.generation} ${this.parentData.dominantArchetype}`, {
            fontFamily: 'Arial',
            fontSize: '18px'
        });
        this.add.text(100, 130, `Legacy Traits: ${this.parentData.legacyTraits.join(', ') || 'None'}`, {
            fontFamily: 'Arial',
            fontSize: '16px'
        });

        // --- Environmental Influence Selection ---
        this.add.text(100, 200, 'Select Environmental Influences:', {
            fontFamily: 'Arial',
            fontSize: '18px'
        });

        // Example buttons for selecting influences. In a full game, this could be a drag-and-drop inventory system.
        const logicButton = this.add.text(100, 240, "Use 'Logic' Item", { padding: { x: 10, y: 5 }, backgroundColor: '#333' }).setInteractive();
        logicButton.on('pointerdown', () => {
            if (!this.selectedItems.includes('logic')) {
                this.selectedItems.push('logic');
                logicButton.setBackgroundColor('#555'); // Indicate selection
            }
        });

        const empathyButton = this.add.text(300, 240, "Use 'Empathy' Item", { padding: { x: 10, y: 5 }, backgroundColor: '#333' }).setInteractive();
        empathyButton.on('pointerdown', () => {
            if (!this.selectedItems.includes('empathy')) {
                this.selectedItems.push('empathy');
                empathyButton.setBackgroundColor('#555'); // Indicate selection
            }
        });

        // --- Finalize Legacy Button ---
        const initiateButton = this.add.text(this.cameras.main.width / 2, 400, 'Initiate New Generation', {
            padding: { x: 15, y: 10 },
            backgroundColor: '#008800',
            fontSize: '20px'
        }).setOrigin(0.5).setInteractive();

        initiateButton.on('pointerdown', () => this.initiateLegacy());
    }

    /**
     * Contains the core logic for creating the next generation's data.
     */
    initiateLegacy() {
        // Helper functions to remove Phaser dependencies
        const between = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
        const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // 1. Inherit Personality: New pet's archetype is the parent's dominant one.
        const topArchetype = this.parentData.dominantArchetype;
        let secondArchetype = 'Adventurer';
        let maxPoints = -1;
        for (const archetype in this.parentData.personalityPoints) {
            if (archetype !== topArchetype && this.parentData.personalityPoints[archetype] > maxPoints) {
                maxPoints = this.parentData.personalityPoints[archetype];
                secondArchetype = archetype;
            }
        }

        // 2. Create the complete data structure for the new pet.
        // This ensures the new Nadagotchi is created with a valid, complete state.
        const newPetData = {
            mood: 'neutral',
            dominantArchetype: topArchetype,
            personalityPoints: {
                [topArchetype]: 5,
                [secondArchetype]: 2
            },
            stats: { hunger: 100, energy: 100, happiness: 70 },
            skills: {
                communication: 1, resilience: 1, navigation: 0,
                empathy: 0, logic: 0, focus: 0, crafting: 0
            },
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

        // 3. Apply Environmental Influence
        if (this.selectedItems.includes('logic')) {
            newPetData.personalityPoints.Intellectual = (newPetData.personalityPoints.Intellectual || 0) + 5;
        }
        if (this.selectedItems.includes('empathy')) {
            newPetData.personalityPoints.Nurturer = (newPetData.personalityPoints.Nurturer || 0) + 5;
        }

        // 4. Inherit Legacy Traits with a chance of being passed down
        this.parentData.legacyTraits.forEach(trait => {
            if (Math.random() < 0.3) { // 30% chance to inherit each trait
                newPetData.legacyTraits.push(trait);
            }
        });

        // 5. Add a NEW rare trait (low chance)
        if (Math.random() < 0.05) { // 5% chance for a brand new trait
            const possibleNewTraits = ["Quick Learner", "Resilient Spirit", "Charming"];
            newPetData.legacyTraits.push(getRandom(possibleNewTraits));
        }

        // --- Final Steps ---
        // 6. Save the retiring pet to the Hall of Fame.
        this.persistence.saveToHallOfFame(this.parentData);

        // 7. Clear the active pet save file.
        this.persistence.clearActivePet();

        // 8. Restart the game with the new pet's data.
        this.scene.start('MainScene', { newPetData: newPetData });
    }
}
