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
        this.statsText = this.add.text(10, 10, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 });

        // --- Action Buttons ---
        this.actionButtons = [];
        this.createActionButtons();

        // --- Job Board ---
        // Positioned at bottom-right, with increased size for touch
        this.jobBoardButton = this.add.text(this.cameras.main.width - 10, this.cameras.main.height - 10, 'Job Board', {
            fontFamily: 'Arial', fontSize: '16px', padding: { x: 15, y: 10 }, backgroundColor: '#6A0DAD', color: '#ffffff'
        })
            .setOrigin(1, 1) // Anchor to bottom-right
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.5) // Initially disabled
            .on('pointerdown', () => {
                if (this.jobBoardButton.alpha === 1) { // Check if enabled
                    this.game.events.emit('uiAction', 'WORK');
                }
            });

        // Initial interactive state check
        this.jobBoardButton.disableInteractive();

        // --- Retire Button ---
        // Positioned at top-right, below the date (managed by MainScene, but we'll keep this simple)
        this.retireButton = this.add.text(this.cameras.main.width - 10, 50, 'Retire', {
            fontFamily: 'Arial', fontSize: '16px', padding: { x: 15, y: 10 }, backgroundColor: '#ff00ff', color: '#ffffff'
        })
            .setOrigin(1, 0) // Anchor to top-right
            .setInteractive({ useHandCursor: true })
            .setVisible(false)
            .on('pointerdown', () => this.game.events.emit('uiAction', 'RETIRE'));

        // --- Event Listeners ---
        this.game.events.on('updateStats', this.updateStatsUI, this);
        this.game.events.on('uiAction', this.handleUIActions, this);

        // Handle resize events
        this.scale.on('resize', this.resize, this);


        // --- Modals ---
        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
        this.hobbyModal = this.createModal("Hobbies");
        this.craftingModal = this.createModal("Crafting");
        this.relationshipModal = this.createModal("Relationships");
        this.decorateModal = this.createModal("Decorate");
    }

    /**
     * Handles the resize event.
     * @param {object} gameSize - The new size of the game.
     */
    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.resize(width, height);

        // Update static elements
        this.jobBoardButton.setPosition(width - 10, height - 10);
        this.retireButton.setPosition(width - 10, 50);

        // Re-create flow layout
        this.createActionButtons();
    }

    /**
     * Creates and positions the main action buttons using a responsive flow layout.
     * Buttons wrap upwards from the bottom-left to ensure they fit on mobile screens.
     * @private
     */
    createActionButtons() {
        // Clear existing buttons
        if (this.actionButtons) {
            this.actionButtons.forEach(btn => btn.destroy());
        }
        this.actionButtons = [];

        // Larger touch targets: 16px font + (12px * 2) padding = 40px height approx.
        // buttonStyle is now handled by ButtonFactory

        const actions = [
            // Core Actions
            { text: 'Feed', action: 'FEED' },
            { text: 'Play', action: 'PLAY' },
            { text: 'Study', action: 'STUDY' },
            { text: 'Explore', action: 'EXPLORE' },
            { text: 'Meditate', action: 'MEDITATE' },
            // Menu Actions
            { text: 'Journal', action: 'OPEN_JOURNAL' },
            { text: 'Recipes', action: 'OPEN_RECIPES' },
            { text: 'Hobbies', action: 'OPEN_HOBBIES' },
            { text: 'Craft', action: 'OPEN_CRAFTING_MENU' },
            { text: 'Decorate', action: 'DECORATE' }
        ];

        // Re-ordering for logical grouping:
        // We want the most frequent actions (Feed, Play) to be easily accessible.
        // Let's put Menu items on the very bottom row, and Core items above them.

        const menuItems = actions.slice(5);
        const coreItems = actions.slice(0, 5);

        let bottomOffset = 10; // Margin from bottom
        const spacing = 10;

        // Function to layout a group of buttons
        const layoutGroup = (items) => {
            // Measure max height for this row (assumes all buttons same style height)
            const rowHeight = 45; // Approx height including spacing

            // Let's calculate lines first.
            const lines = [];
            let currentLine = [];
            let currentLineWidth = 0;
            const screenWidth = this.cameras.main.width - 120; // Reserve space for Job Board button on right

            items.forEach(item => {
                // Approximate width calculation (since we haven't created the object yet)
                // 16px font ~ 10px per char avg + 40px padding (from ButtonFactory)
                const estimatedWidth = (item.text.length * 10) + 45;

                if (currentLineWidth + estimatedWidth + spacing > screenWidth && currentLine.length > 0) {
                    // Wrap to new line
                    lines.push(currentLine);
                    currentLine = [];
                    currentLineWidth = 0;
                }
                currentLine.push(item);
                currentLineWidth += estimatedWidth + spacing;
            });
            if (currentLine.length > 0) lines.push(currentLine);

            // Now render the lines from bottom up
            lines.reverse().forEach(line => {
                let x = 10;
                line.forEach(item => {
                    const btn = ButtonFactory.createButton(this, x, this.cameras.main.height - bottomOffset - 40, item.text, {
                        onClick: () => this.game.events.emit('uiAction', item.action)
                    });

                    this.actionButtons.push(btn);
                    x += btn.width + spacing;
                });
                bottomOffset += 60; // Move up for next row (increased for 3D depth)
            });
        };

        // Layout Menus first (at bottom)
        layoutGroup(menuItems);

        // Add a little divider space
        bottomOffset += 5;

        // Layout Core actions (above menus)
        layoutGroup(coreItems);
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
        if (currentCareer) {
            this.jobBoardButton.setInteractive();
            this.jobBoardButton.setAlpha(1.0);
        } else {
            this.jobBoardButton.disableInteractive();
            this.jobBoardButton.setAlpha(0.5);
        }

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
        // Responsive modal sizing
        const modalWidth = Math.min(500, this.cameras.main.width - 40);
        const modalHeight = Math.min(400, this.cameras.main.height - 100);

        const modalBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, modalWidth, modalHeight, 0x1a1a1a, 0.95).setStrokeStyle(2, 0xffffff);
        const modalTitle = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - (modalHeight/2) + 30, title, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Dynamic word wrap based on modal width
        const modalContent = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '', {
            fontSize: '16px', color: '#fff', wordWrap: { width: modalWidth - 40 }
        }).setOrigin(0.5);

        const closeButton = this.add.text(this.cameras.main.width / 2 + (modalWidth/2) - 30, this.cameras.main.height / 2 - (modalHeight/2) + 30, 'X', {
            fontSize: '20px', color: '#fff', backgroundColor: '#800', padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

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
