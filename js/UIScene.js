/**
 * @class UIScene
 * @extends Phaser.Scene
 * @classdesc
 * A dedicated Phaser Scene for managing and displaying all UI elements.
 * It implements the "Physical Shell" dashboard layout using a Neo-Retro aesthetic.
 */
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    /**
     * Phaser lifecycle method called once, after `preload`.
     */
    create() {
        // --- State ---
        this.currentTab = 'CARE';
        this.tabButtons = [];
        this.actionButtons = [];

        // --- Dashboard Background ---
        this.dashboardBg = this.add.rectangle(0, 0, 1, 1, 0xA3B8A2).setOrigin(0); // Soft Olive Green
        this.dashboardBorder = this.add.rectangle(0, 0, 1, 1, 0x4A4A4A).setOrigin(0); // Border line

        // --- Stats Display ---
        // Stats overlay on top of the game view (top left)
        this.statsText = this.add.text(10, 10, '', {
            fontFamily: 'VT323, monospace', fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        });

        // --- Action Buttons ---
        this.actionButtons = [];

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
        this.scale.on('resize', this.resize, this);


        // --- Modals ---
        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
        this.hobbyModal = this.createModal("Hobbies");
        this.craftingModal = this.createModal("Crafting");
        this.relationshipModal = this.createModal("Relationships");
        this.decorateModal = this.createModal("Decorate");

        // --- Initial Layout ---
        this.createTabs();
        this.resize(this.scale);
        this.showTab('CARE');
    }

    /**
     * Creates the permanent category tabs (Care, Action, System).
     */
    createTabs() {
        // We create them once, layout them in resize
        const tabs = [
            { label: '❤️ CARE', id: 'CARE' },
            { label: '🎒 ACTION', id: 'ACTION' },
            { label: '⚙️ SYSTEM', id: 'SYSTEM' }
        ];

        tabs.forEach(tab => {
            const btn = ButtonFactory.createButton(this, 0, 0, tab.label, () => {
                this.showTab(tab.id);
            }, { width: 100, height: 35, color: 0xD8A373, fontSize: '24px' });
            btn.tabId = tab.id;
            this.tabButtons.push(btn);
        });
    }

    /**
     * Switches the active tab and populates the dashboard with relevant actions.
     * @param {string} tabId
     */
    showTab(tabId) {
        this.currentTab = tabId;

        // Update Tab Visuals (Highlight active)
        this.tabButtons.forEach(btn => {
            const isSelected = btn.tabId === tabId;
            btn.setAlpha(isSelected ? 1.0 : 0.7);
        });

        // Clear existing action buttons
        this.actionButtons.forEach(btn => btn.destroy());
        this.actionButtons = [];

        // Define Actions per Tab
        let actions = [];
        if (tabId === 'CARE') {
            actions = [
                { text: 'Feed', action: 'FEED' },
                { text: 'Play', action: 'PLAY' },
                { text: 'Meditate', action: 'MEDITATE' }
            ];
        } else if (tabId === 'ACTION') {
            actions = [
                { text: 'Explore', action: 'EXPLORE' },
                { text: 'Study', action: 'STUDY' },
                { text: 'Work', action: 'WORK', condition: () => this.nadagotchiData && this.nadagotchiData.currentCareer },
                { text: 'Craft', action: 'OPEN_CRAFTING_MENU' }
            ];
        } else if (tabId === 'SYSTEM') {
            actions = [
                { text: 'Journal', action: 'OPEN_JOURNAL' },
                { text: 'Recipes', action: 'OPEN_RECIPES' },
                { text: 'Hobbies', action: 'OPEN_HOBBIES' },
                { text: 'Decorate', action: 'DECORATE' },
                { text: 'Retire', action: 'RETIRE', condition: () => this.nadagotchiData && this.nadagotchiData.isLegacyReady }
            ];
        }

        // Create buttons
        const dashboardHeight = Math.floor(this.cameras.main.height * 0.25);
        const dashboardY = this.cameras.main.height - dashboardHeight;

        this.layoutActionButtons(actions, dashboardY + 50); // Start below tabs
    }

    /**
     * Lays out the action buttons in a responsive grid within the dashboard body.
     */
    layoutActionButtons(actions, startY) {
        const width = this.cameras.main.width;
        let currentX = 20;
        let currentY = startY;
        const spacing = 15;
        const btnHeight = 40;

        actions.forEach(item => {
            // Check condition if exists
            if (item.condition && !item.condition()) return;

            // Estimate width
            const btnWidth = (item.text.length * 12) + 40; // Approx width

            // Wrap if needed
            if (currentX + btnWidth > width - 20) {
                currentX = 20;
                currentY += btnHeight + spacing;
            }

            const btn = ButtonFactory.createButton(this, currentX, currentY, item.text, () => {
                this.game.events.emit('uiAction', item.action);
            }, { width: btnWidth, height: btnHeight, color: 0x6A0DAD, fontSize: '24px', textColor: '#FFFFFF' }); // Different color for actions?

            // Override color for specific types?
            // Let's keep them consistent "Neo-Retro" style. Maybe different base colors?
            // User spec: Active Elements: #D8A373.
            // Let's use #D8A373 for tabs, and maybe a variation for actions?
            // Let's stick to user palette.

            this.actionButtons.push(btn);
            currentX += btnWidth + spacing;
        });
    }

    /**
     * Handles the resize event.
     * @param {object} gameSize - The new size of the game.
     */
    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        const dashboardHeight = Math.floor(height * 0.25);
        const dashboardY = height - dashboardHeight;

        this.cameras.main.setSize(width, height);

        // Update Background
        this.dashboardBg.setPosition(0, dashboardY);
        this.dashboardBg.setSize(width, dashboardHeight);

        this.dashboardBorder.setPosition(0, dashboardY);
        this.dashboardBorder.setSize(width, 4); // Top border line

        // Layout Tabs (Top of dashboard)
        const tabWidth = Math.min(120, (width - 40) / 3);
        const tabSpacing = 10;
        let tabX = 20;
        const tabY = dashboardY + 10; // Padding from top of dashboard

        this.tabButtons.forEach(btn => {
            // ButtonFactory returns a container, we can't easily resize it via a method unless we add one
            // We can destroy and recreate or just set position.
            // Since width is baked in, ideally we recreate.
            // For now, let's just move them. If screen gets too narrow, they might overlap.
            // TODO: Ideally ButtonFactory should support setSize or we recreate.
            // Let's just set position for now.
            btn.setPosition(tabX, tabY);
            tabX += tabWidth + tabSpacing;

            // Update the click handler to refresh layout?
            // No, the tab click refreshes actions.
        });

        // Update static elements (Job Board, Retire)
        if (this.jobBoardButton) {
             this.jobBoardButton.setPosition(width - 10, height - 10);
        }
        if (this.retireButton) {
             this.retireButton.setPosition(width - 10, 50);
        }

        // Refresh active tab actions to fit new width
        this.showTab(this.currentTab);
    }

    /**
     * Creates and positions the main action buttons using a responsive flow layout.
     * Buttons wrap upwards from the bottom-left to ensure they fit on mobile screens.
     * @private
     */
    createActionButtons() {
        // This method is now likely unused with the new tab system, but kept for initialization if needed.
        // Or if we want to retain the old logic for fallback.
        // But since create() calls createActionButtons(), let's empty it or make it do nothing if tabs are used.
        // Actually, create() sets this.actionButtons = [], then calls createActionButtons().
        // But showTab() handles creating buttons now.
        // Let's leave it empty to avoid confusion, or remove call in create().
        // I'll leave it empty.
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

        // Refresh tab if conditional buttons changed state (like Work or Retire)
        // Optimization: check if state actually changed before redraw?
        // For now, simple redraw to ensure buttons appear/disappear correctly
        if (this.currentTab === 'ACTION' || this.currentTab === 'SYSTEM') {
            this.showTab(this.currentTab);
        }
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
            { fontFamily: 'VT323, Arial', fontSize: '32px', color: '#000', backgroundColor: '#fff', padding: { x: 10, y: 5 }, align: 'center' }
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
        const modalTitle = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - (modalHeight/2) + 30, title, { fontFamily: 'VT323, Arial', fontSize: '36px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Dynamic word wrap based on modal width
        const modalContent = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '', {
            fontSize: '24px', fontFamily: 'VT323, Arial', color: '#fff', wordWrap: { width: modalWidth - 40 }
        }).setOrigin(0.5);

        const closeButton = ButtonFactory.createButton(this, this.cameras.main.width / 2 + (modalWidth/2) - 40, this.cameras.main.height / 2 - (modalHeight/2) + 30, 'X', () => {
             modalGroup.setVisible(false);
             if (this.scene.isPaused('MainScene')) this.scene.resume('MainScene');
        }, { width: 40, height: 40, color: 0x800000 });

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
                const craftButton = ButtonFactory.createButton(this, this.cameras.main.width / 2 + 150, yPos, 'Craft', () => {
                    this.game.events.emit('uiAction', 'CRAFT_ITEM', recipeName);
                    this.craftingModal.setVisible(false);
                    this.scene.resume('MainScene');
                }, { width: 80, height: 30, color: 0x228B22 });

                this.craftingModal.add(craftButton);
                this.craftingButtons.push(craftButton);
                yPos += 35;
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

            const placeButton = ButtonFactory.createButton(this, this.cameras.main.width / 2 + 150, yPos, 'Place', () => {
                this.game.events.emit('uiAction', 'DECORATE', itemName);
                this.decorateModal.setVisible(false);
                this.scene.resume('MainScene');
            }, { width: 80, height: 30, color: 0x228B22 });

            this.decorateModal.add(placeButton);
            this.decorateButtons.push(placeButton);
            yPos += 35;
        });

        this.decorateModal.content.setText(text);
        this.decorateModal.setVisible(true);
        this.scene.pause('MainScene');
    }
}
