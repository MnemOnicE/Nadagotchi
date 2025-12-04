import { ButtonFactory } from './ButtonFactory.js';
import { PersistenceManager } from './PersistenceManager.js';
import { NarrativeSystem } from './NarrativeSystem.js';
import { EventKeys } from './EventKeys.js';
import { ItemDefinitions } from './ItemData.js';

/**
 * @fileoverview Manages the "Physical Shell" UI layer of the game.
 * Handles the HUD, action buttons, modals, and user input mapping.
 * Renders on top of the MainScene.
 */

/**
 * @class UIScene
 * @extends Phaser.Scene
 * @classdesc
 * A dedicated Phaser Scene for managing and displaying all UI elements.
 * It implements the "Physical Shell" dashboard layout using a Neo-Retro aesthetic.
 */
export class UIScene extends Phaser.Scene {
    /**
     * Creates an instance of UIScene.
     */
    constructor() {
        super({ key: 'UIScene' });
    }

    /**
     * Phaser lifecycle method called once, after `preload`.
     * Initializes UI state, creates the dashboard background, action buttons, and all modals.
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
                    this.game.events.emit(EventKeys.UI_ACTION, EventKeys.WORK);
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
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.RETIRE));

        // --- Genetic Scanner Button ---
        // Hidden by default, revealed if item is owned
        // Position: width - buttonWidth (100) - padding (10) = width - 110
        this.scannerButton = ButtonFactory.createButton(this, this.cameras.main.width - 110, 100, "🧬 GENES", () => {
             this.onClickScanner();
        }, { width: 100, height: 35, color: 0x008080, fontSize: '16px' });
        // Manually adjust origin/position since ButtonFactory returns a container centered at x,y usually?
        // ButtonFactory creates container at x,y. Let's assume x,y is center.
        // My Retire button is top-right aligned.
        // I'll leave it as is and check placement. ButtonFactory centers content.
        this.scannerButton.setVisible(false);

        // --- Event Listeners ---
        this.game.events.on(EventKeys.UPDATE_STATS, this.updateStatsUI, this);
        this.game.events.on(EventKeys.UI_ACTION, this.handleUIActions, this);
        this.scale.on('resize', this.resize, this);


        // --- Modals ---
        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
        this.hobbyModal = this.createModal("Hobbies");
        this.craftingModal = this.createModal("Crafting");
        this.relationshipModal = this.createModal("Relationships");
        this.decorateModal = this.createModal("Decorate");
        this.scannerModal = this.createModal("Genetic Scanner");
        this.ancestorModal = this.createModal("Hall of Ancestors");
        this.inventoryModal = this.createModal("Inventory");

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
            { label: '⚙️ SYSTEM', id: 'SYSTEM' },
            { label: '🏺 ANCESTORS', id: 'ANCESTORS' }
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
     * @param {string} tabId - The ID of the tab to switch to (e.g., 'CARE', 'ACTION').
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
                { text: 'Feed', action: EventKeys.FEED },
                { text: 'Play', action: EventKeys.PLAY },
                { text: 'Meditate', action: EventKeys.MEDITATE }
            ];
        } else if (tabId === 'ACTION') {
            actions = [
                { text: 'Explore', action: EventKeys.EXPLORE },
                { text: 'Study', action: EventKeys.STUDY },
                { text: 'Work', action: EventKeys.WORK, condition: () => this.nadagotchiData && this.nadagotchiData.currentCareer },
                { text: 'Craft', action: EventKeys.OPEN_CRAFTING_MENU }
            ];
        } else if (tabId === 'SYSTEM') {
            actions = [
                { text: 'Journal', action: EventKeys.OPEN_JOURNAL },
                { text: 'Inventory', action: EventKeys.OPEN_INVENTORY },
                { text: 'Recipes', action: EventKeys.OPEN_RECIPES },
                { text: 'Hobbies', action: EventKeys.OPEN_HOBBIES },
                { text: 'Decorate', action: EventKeys.DECORATE },
                { text: 'Retire', action: EventKeys.RETIRE, condition: () => this.nadagotchiData && this.nadagotchiData.isLegacyReady }
            ];
        } else if (tabId === 'ANCESTORS') {
            const ancestors = new PersistenceManager().loadHallOfFame();
            if (ancestors.length === 0) {
                 actions = [{ text: 'No Ancestors Yet', action: EventKeys.NONE, condition: () => true }];
            } else {
                ancestors.forEach((ancestor) => {
                    actions.push({
                        text: `Gen ${ancestor.generation}: ${ancestor.dominantArchetype}`,
                        action: EventKeys.OPEN_ANCESTOR_MODAL,
                        data: ancestor
                    });
                });
            }
        }

        // Create buttons
        const dashboardHeight = Math.floor(this.cameras.main.height * 0.25);
        const dashboardY = this.cameras.main.height - dashboardHeight;

        this.layoutActionButtons(actions, dashboardY + 50); // Start below tabs
    }

    /**
     * Lays out the action buttons in a responsive grid within the dashboard body.
     * @param {Array<object>} actions - List of action definitions.
     * @param {number} startY - The Y coordinate to start placing buttons.
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
                this.game.events.emit(EventKeys.UI_ACTION, item.action, item.data);
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
     * Repositions UI elements to fit the new game size.
     * @param {object} gameSize - The new size of the game (width, height).
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
        const tabWidth = Math.min(120, (width - 40) / 4);
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
        if (this.scannerButton) {
            // Reposition scanner button below retire button
            this.scannerButton.setPosition(width - 110, 100);
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
     * Handles specific UI actions that open modals, extended to support data payload.
     * @param {string} action - The UI action to handle.
     * @param {any} [data] - Optional data payload.
     * @private
     */
    handleUIActions(action, data) {
        switch (action) {
            case EventKeys.OPEN_JOURNAL: this.openJournal(); break;
            case EventKeys.OPEN_RECIPES: this.openRecipeBook(); break;
            case EventKeys.OPEN_HOBBIES: this.openHobbyMenu(); break;
            case EventKeys.OPEN_CRAFTING_MENU: this.openCraftingMenu(); break;
            case EventKeys.DECORATE: this.openDecorateMenu(); break;
            case EventKeys.INTERACT_NPC: this.openRelationshipMenu(); break;
            case EventKeys.OPEN_ANCESTOR_MODAL: this.openAncestorModal(data); break;
            case EventKeys.OPEN_INVENTORY: this.openInventoryMenu(); break;
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
                     `Logic: ${skills.logic.toFixed(2)} | Nav: ${skills.navigation.toFixed(2)} | Research: ${skills.research.toFixed(2)}`;
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

        // Check inventory for Genetic Scanner
        const hasScanner = this.nadagotchiData.inventory && this.nadagotchiData.inventory['Genetic Scanner'] > 0;
        this.scannerButton.setVisible(hasScanner);

        if (newCareerUnlocked) {
            this.showCareerNotification(newCareerUnlocked);
            this.mainScene.nadagotchi.newCareerUnlocked = null; // Reset flag
        }
    }

    /**
     * Shows the genetic scanner modal with the pet's genotype.
     */
    onClickScanner() {
        if (!this.nadagotchiData || !this.nadagotchiData.genome) return;

        let displayText = "GENETIC ANALYSIS:\n\n";
        const genotype = this.nadagotchiData.genome.genotype;

        for (const [geneKey, allelePair] of Object.entries(genotype)) {
             // e.g. "Metabolism: [5, 8]"
             displayText += `${geneKey}: [${allelePair[0]} | ${allelePair[1]}]`;

             // Check for Heterozygous (different alleles)
             // Note: Alleles can be numbers or strings (traits) or null.
             if (allelePair[0] !== allelePair[1]) {
                 displayText += " (Hetero)";
             }
             displayText += "\n";
        }

        this.scannerModal.content.setText(displayText);
        this.scannerModal.setVisible(true);
        this.scene.pause('MainScene');
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
        const discovered = (this.nadagotchiData && this.nadagotchiData.discoveredRecipes) || new PersistenceManager().loadRecipes();
        const allRecipes = (this.nadagotchiData && this.nadagotchiData.recipes) || {};

        let text = "";

        if (!discovered || discovered.length === 0) {
            text = "No recipes discovered yet. Keep exploring and studying!";
        } else {
            text = "Discovered Recipes:\n\n";
            discovered.forEach(recipeName => {
                const recipeDef = allRecipes[recipeName];

                text += `• ${recipeName}\n`;
                if (recipeDef) {
                    text += `  "${recipeDef.description}"\n`;
                    const materials = Object.entries(recipeDef.materials)
                        .map(([mat, count]) => `${count} ${mat}`)
                        .join(', ');
                    text += `  Requires: ${materials}\n\n`;
                } else {
                    text += "  (Details unknown)\n\n";
                }
            });
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
                    this.game.events.emit(EventKeys.UI_ACTION, EventKeys.CRAFT_ITEM, recipeName);
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

    /**
     * Populates and displays the decoration/furniture menu modal.
     */
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
                this.game.events.emit(EventKeys.UI_ACTION, EventKeys.DECORATE, itemName);
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

    /**
     * Populates and displays the inventory menu modal.
     * Shows consumable items with a "Use" button.
     */
    openInventoryMenu() {
        if (!this.nadagotchiData) return;

        // Clear existing buttons
        if (this.inventoryButtons) {
            this.inventoryButtons.forEach(btn => btn.destroy());
        }
        this.inventoryButtons = [];

        // Clear existing dynamic texts
        if (this.inventoryTexts) {
            this.inventoryTexts.forEach(t => t.destroy());
        }
        this.inventoryTexts = [];

        const inventory = this.nadagotchiData.inventory || {};
        const items = Object.entries(inventory);

        this.inventoryModal.content.setText(""); // Clear default text block

        if (items.length === 0) {
            this.inventoryModal.content.setText("Your inventory is empty.");
        } else {
            let currentY = this.cameras.main.height / 2 - 150; // Start higher to fit list
            const startX = this.cameras.main.width / 2 - 200;

            items.forEach(([itemName, count]) => {
                const def = ItemDefinitions[itemName] || { description: "Unknown item", emoji: "❓", type: "Misc" };

                const itemStr = `${def.emoji} ${itemName} (x${count})`;
                const descStr = `${def.description}`;

                const itemText = this.add.text(startX, currentY, itemStr, { font: '20px monospace', color: '#ffffff' });
                const descText = this.add.text(startX + 20, currentY + 25, descStr, { font: '16px monospace', color: '#aaaaaa', wordWrap: { width: 350 } });

                this.inventoryModal.add(itemText);
                this.inventoryModal.add(descText);
                this.inventoryTexts.push(itemText, descText);

                if (def.type === 'Consumable' && count > 0) {
                     const useButton = ButtonFactory.createButton(this, startX + 350, currentY + 10, 'Use', () => {
                        this.game.events.emit(EventKeys.UI_ACTION, EventKeys.CONSUME_ITEM, itemName);
                        this.inventoryModal.setVisible(false);
                        this.scene.resume('MainScene');
                    }, { width: 60, height: 30, color: 0x228B22 });

                    this.inventoryModal.add(useButton);
                    this.inventoryButtons.push(useButton);
                }

                currentY += 60; // Fixed spacing
            });
        }

        this.inventoryModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    /**
     * Populates and displays the Hall of Ancestors modal for a specific ancestor.
     * @param {object} ancestorData - The data of the retired pet.
     */
    openAncestorModal(ancestorData) {
        if (!ancestorData) return;

        const advice = NarrativeSystem.getAdvice(ancestorData.dominantArchetype);

        let text = `Name: Generation ${ancestorData.generation}\n`;
        text += `Archetype: ${ancestorData.dominantArchetype}\n`;
        text += `Career: ${ancestorData.currentCareer || 'Unemployed'}\n\n`;

        text += `Stats at Retirement:\n`;
        text += `- Happiness: ${Math.floor(ancestorData.stats.happiness)}\n`;
        text += `- Logic: ${ancestorData.skills.logic.toFixed(1)}\n`;
        text += `- Empathy: ${ancestorData.skills.empathy.toFixed(1)}\n\n`;

        text += `Ancestral Advice:\n"${advice}"`;

        this.ancestorModal.content.setText(text);
        this.ancestorModal.setVisible(true);
        this.scene.pause('MainScene');
    }
}
