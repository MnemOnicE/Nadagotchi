/**
 * @class UIScene
 * @extends Phaser.Scene
 * @classdesc
 * A dedicated Phaser Scene for managing and displaying all UI elements.
 * It runs in parallel with the MainScene and communicates with it via global events.
 */
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    /**
     * Phaser lifecycle method called once, after `preload`.
     * Used to set up the initial state of the UI scene, create UI elements, and register event listeners.
     */
    create() {
        // --- UI Elements ---
        this.statsText = this.add.text(10, 10, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' });

        // --- Action Buttons ---
        this.createActionButtons();

        // --- Job Board ---
        this.jobBoardButton = this.add.text(this.cameras.main.width - 120, this.cameras.main.height - 40, 'Job Board', { padding: { x: 10, y: 5 }, backgroundColor: '#6A0DAD' })
            .setInteractive(false).setAlpha(0.5)
            .on('pointerdown', () => this.game.events.emit('uiAction', 'WORK'));

        // --- Retire Button ---
        this.retireButton = this.add.text(this.cameras.main.width - 120, 10, 'Retire', { padding: { x: 10, y: 5 }, backgroundColor: '#ff00ff' })
            .setInteractive().setVisible(false)
            .on('pointerdown', () => this.game.events.emit('uiAction', 'RETIRE'));

        // --- Event Listeners ---
        this.game.events.on('updateStats', this.updateStatsUI, this);
        this.game.events.on('uiAction', this.handleUIActions, this);


        // --- Modals ---
        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
        this.hobbyModal = this.createModal("Hobbies");
        this.craftingModal = this.createModal("Crafting");
        this.relationshipModal = this.createModal("Relationships");
        this.decorateModal = this.createModal("Decorate");
    }

    /**
     * Creates and positions the main action buttons in two rows to avoid clutter.
     * @private
     */
    createActionButtons() {
        const buttonStyle = { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', backgroundColor: '#4a4a4a', padding: { x: 10, y: 5 } };

        let startX = 10;
        const row1Y = this.cameras.main.height - 75; // Top row for core actions
        const row2Y = this.cameras.main.height - 35; // Bottom row for menus

        const addButton = (text, action, y) => {
            const button = this.add.text(startX, y, text, buttonStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.game.events.emit('uiAction', action))
                .on('pointerover', () => button.setStyle({ fill: '#ff0' }))
                .on('pointerout', () => button.setStyle({ fill: '#fff' }));
            startX += button.width + 10;
        };

        // Row 1: Core Needs & Interactions
        ['Feed', 'Play', 'Study', 'Explore', 'Meditate'].forEach(action => addButton(action, action.toUpperCase(), row1Y));

        // Reset X for Row 2
        startX = 10;

        // Row 2: Menus & Management
        addButton('Journal', 'OPEN_JOURNAL', row2Y);
        addButton('Recipes', 'OPEN_RECIPES', row2Y);
        addButton('Hobbies', 'OPEN_HOBBIES', row2Y);
        addButton('Craft', 'OPEN_CRAFTING_MENU', row2Y);
        addButton('Decorate', 'DECORATE', row2Y);
    }

    /**
     * Handles specific UI actions that open modals.
     * @param {string} action - The UI action to handle.
     * @private
     */
    handleUIActions(action) {
        switch (action) {
            case 'OPEN_JOURNAL': this.openJournal(); break;
            case 'OPEN_RECIPES': this.openRecipeBook(); break;
            case 'OPEN_HOBBIES': this.openHobbyMenu(); break;
            case 'OPEN_CRAFTING_MENU': this.openCraftingMenu(); break;
            case 'DECORATE': this.openDecorateMenu(); break;
            case 'INTERACT_NPC': this.openRelationshipMenu(); break;
        }
    }

    /**
     * Updates all UI elements with the latest data from the Nadagotchi.
     * This method is the callback for the 'updateStats' event.
     * @param {object} data - The entire Nadagotchi object from MainScene.
     */
    updateStatsUI(data) {
        this.nadagotchiData = data; // Cache the latest data
        const { stats, skills, mood, dominantArchetype, currentCareer, location, isLegacyReady, newCareerUnlocked } = data;

        const moodEmoji = this.getMoodEmoji(mood);
        const text = `Location: ${location}\n` +
                     `Archetype: ${dominantArchetype}\n` +
                     `Mood: ${mood} ${moodEmoji}\n` +
                     `Career: ${currentCareer || 'None'}\n` +
                     `Hunger: ${Math.floor(stats.hunger)}\n` +
                     `Energy: ${Math.floor(stats.energy)}\n` +
                     `Happiness: ${Math.floor(stats.happiness)}\n` +
                     `Logic: ${skills.logic.toFixed(2)} | Nav: ${skills.navigation.toFixed(2)} | Empathy: ${skills.empathy.toFixed(2)}`;
        this.statsText.setText(text);

        // Update interactive element states
        this.jobBoardButton.setInteractive(!!currentCareer).setAlpha(currentCareer ? 1.0 : 0.5);
        this.retireButton.setVisible(isLegacyReady);

        if (newCareerUnlocked) {
            this.showCareerNotification(newCareerUnlocked);
            this.mainScene.nadagotchi.newCareerUnlocked = null; // Reset flag
        }
    }

    /**
     * Returns an emoji character corresponding to a given mood.
     * @param {string} mood - The current mood of the Nadagotchi (e.g., 'happy', 'sad').
     * @returns {string} An emoji representing the mood.
     */
    getMoodEmoji(mood) {
        const moodMap = { 'happy': '😊', 'sad': '😢', 'angry': '😠', 'neutral': '😐' };
        return moodMap[mood] || '❓';
    }

    /**
     * Displays a temporary notification in the center of the screen.
     * @param {string} message - The message to display.
     */
    showCareerNotification(message) {
        const notificationText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 30, `Career Unlocked: ${message}!`,
            { fontFamily: 'Arial', fontSize: '18px', color: '#000', backgroundColor: '#fff', padding: { x: 10, y: 5 }, align: 'center' }
        ).setOrigin(0.5);
        this.time.delayedCall(3000, () => notificationText.destroy());
    }

    /**
     * Creates a generic modal group (background, title, content, close button).
     * @param {string} title - The title to display at the top of the modal.
     * @returns {Phaser.GameObjects.Group} The created (but hidden) modal group.
     */
    createModal(title) {
        const modalGroup = this.add.group();
        const modalBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 500, 400, 0x1a1a1a, 0.9).setStrokeStyle(2, 0xffffff);
        const modalTitle = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 170, title, { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
        const modalContent = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '', { fontSize: '16px', color: '#fff', wordWrap: { width: 480 } }).setOrigin(0.5);
        const closeButton = this.add.text(this.cameras.main.width / 2 + 220, this.cameras.main.height / 2 - 170, 'X', { fontSize: '20px', color: '#fff', backgroundColor: '#800' , padding: { x: 8, y: 4 }}).setOrigin(0.5).setInteractive();

        closeButton.on('pointerdown', () => {
            modalGroup.setVisible(false);
            if (this.scene.isPaused('MainScene')) this.scene.resume('MainScene');
        });

        modalGroup.addMultiple([modalBg, modalTitle, modalContent, closeButton]);
        modalGroup.setVisible(false);
        modalGroup.content = modalContent; // For easy access
        return modalGroup;
    }

    /**
     * Populates and displays the journal modal.
     */
    openJournal() {
        const entries = new PersistenceManager().loadJournal();
        if (entries.length === 0) {
            this.journalModal.content.setText("No entries yet.");
        } else {
            const formattedEntries = entries
                .slice() // Create a shallow copy to avoid reversing the original array
                .reverse() // Show most recent first
                .map(e => `[${e.date}]\n${e.text}`)
                .join('\n\n---\n\n'); // Add a separator
            this.journalModal.content.setText(formattedEntries);
        }
        this.journalModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    /**
     * Populates and displays the recipe book modal.
     */
    openRecipeBook() {
        const recipes = new PersistenceManager().loadRecipes();
        let text;
        if (recipes.length === 0) {
            text = "No recipes discovered yet. Keep exploring and studying!";
        } else {
            text = "Discovered Recipes:\n\n" + recipes.map(r => `• ${r}`).join('\n');
        }
        this.recipeModal.content.setText(text);
        this.recipeModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    /**
     * Populates and displays the hobby menu modal.
     */
    openHobbyMenu() {
        if (!this.nadagotchiData) return;
        const text = Object.entries(this.nadagotchiData.hobbies).map(([hobby, level]) => `${hobby}: Level ${level}`).join('\n');
        this.hobbyModal.content.setText(text);
        this.hobbyModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    /**
     * Populates and displays the crafting menu modal.
     */
    openCraftingMenu() {
        if (!this.nadagotchiData) return;

        // Clear existing buttons
        if (this.craftingButtons) {
            this.craftingButtons.forEach(btn => btn.destroy());
        }
        this.craftingButtons = [];

        const inventoryText = "Inventory:\n" +
            Object.entries(this.nadagotchiData.inventory)
                  .map(([item, count]) => `- ${item}: ${count}`)
                  .join('\n');

        let recipeText = "\n\nRecipes:\n";
        let yPos = this.cameras.main.height / 2 - 50; // Start position for buttons

        for (const recipeName in this.nadagotchiData.recipes) {
            const recipe = this.nadagotchiData.recipes[recipeName];
            const materials = Object.entries(recipe.materials)
                                    .map(([mat, count]) => `${count} ${mat}`)
                                    .join(', ');
            recipeText += `- ${recipeName}: ${recipe.description} (Req: ${materials})\n`;

            // Check if player can craft it
            const canCraft = Object.entries(recipe.materials).every(([mat, count]) => {
                return (this.nadagotchiData.inventory[mat] || 0) >= count;
            });

            if (canCraft) {
                const craftButton = this.add.text(this.cameras.main.width / 2 + 100, yPos, 'Craft', {
                    padding: { x: 8, y: 4 },
                    backgroundColor: '#008000'
                }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                    this.game.events.emit('uiAction', 'CRAFT_ITEM', recipeName);
                    this.craftingModal.setVisible(false);
                    this.scene.resume('MainScene');
                });
                this.craftingModal.add(craftButton);
                this.craftingButtons.push(craftButton);
                yPos += 30;
            }
        }

        this.craftingModal.content.setText(inventoryText + recipeText);
        this.craftingModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    /**
     * Populates and displays the relationship menu modal.
     */
    openRelationshipMenu() {
        if (!this.nadagotchiData) return;
        const text = Object.entries(this.nadagotchiData.relationships).map(([npc, data]) => `${npc}: Friendship ${data.level}`).join('\n');
        this.relationshipModal.content.setText(text);
        this.relationshipModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openDecorateMenu() {
        if (!this.nadagotchiData) return;

        // Clear existing buttons
        if (this.decorateButtons) {
            this.decorateButtons.forEach(btn => btn.destroy());
        }
        this.decorateButtons = [];

        const furniture = Object.entries(this.nadagotchiData.inventory)
            .filter(([item, count]) => this.nadagotchiData.recipes[item] && count > 0);

        let yPos = this.cameras.main.height / 2 - 50; // Start position for buttons
        let text = "Select an item to place:\n\n";

        if (furniture.length === 0) {
            text += "You have no furniture to place.";
        }

        furniture.forEach(([itemName, count]) => {
            text += `- ${itemName}: ${count}\n`;
            const placeButton = this.add.text(this.cameras.main.width / 2 + 100, yPos, 'Place', {
                padding: { x: 8, y: 4 },
                backgroundColor: '#008000'
            }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                this.game.events.emit('uiAction', 'DECORATE', itemName);
                this.decorateModal.setVisible(false);
                this.scene.resume('MainScene');
            });
            this.decorateModal.add(placeButton);
            this.decorateButtons.push(placeButton);
            yPos += 30;
        });

        this.decorateModal.content.setText(text);
        this.decorateModal.setVisible(true);
        this.scene.pause('MainScene');
    }
}
