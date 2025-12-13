import { ButtonFactory } from './ButtonFactory.js';
import { PersistenceManager } from './PersistenceManager.js';
import { NarrativeSystem } from './NarrativeSystem.js';
import { EventKeys } from './EventKeys.js';
import { ItemDefinitions } from './ItemData.js';
import { Config } from './Config.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';
import { Achievements } from './AchievementData.js';

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
        /** @type {string} Stores the signature of the last rendered action buttons to prevent redundant rebuilds. */
        this.lastActionSignature = '';
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
        this.allModals = []; // Track all modals for exclusive management

        // --- Dashboard Background ---
        this.dashboardBg = this.add.rectangle(0, 0, 1, 1, 0xA3B8A2).setOrigin(0); // Soft Olive Green
        this.dashboardBorder = this.add.rectangle(0, 0, 1, 1, 0x4A4A4A).setOrigin(0); // Border line

        // --- Stats Display ---
        // Stats overlay on top of the game view (top left)
        this.statsText = this.add.text(10, 10, '', {
            fontFamily: 'VT323, monospace', fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        });
        /** @type {string} Cache the last text value to prevent redundant setText calls. */
        this.lastStatsText = '';

        // --- Action Buttons ---
        this.actionButtons = [];

        // --- Job Board ---
        // Positioned at bottom-right, with increased size for touch
        // Palette UX Improvement: Use ButtonFactory for consistency and better "Disabled" feedback
        this.jobBoardButton = ButtonFactory.createButton(this, 0, 0, 'Job Board', () => {
            this.handleJobBoardClick();
        }, { width: 120, height: 50, color: 0x6A0DAD, fontSize: '20px' });

        // Initial state: Dimmed but interactive
        this.jobBoardButton.setAlpha(0.6);

        // --- Retire Button ---
        // Positioned at top-right
        this.retireButton = this.add.text(0, 50, 'Retire', {
            fontFamily: 'Arial', fontSize: '16px', padding: { x: 15, y: 10 }, backgroundColor: '#ff00ff', color: '#ffffff'
        })
            .setOrigin(1, 0) // Anchor to top-right
            .setInteractive({ useHandCursor: true })
            .setVisible(false)
            .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.RETIRE));

        // --- Event Listeners ---
        this.game.events.on(EventKeys.UPDATE_STATS, this.updateStatsUI, this);
        this.game.events.on(EventKeys.UI_ACTION, this.handleUIActions, this);
        this.game.events.on(EventKeys.START_TUTORIAL, this.startTutorial, this);
        this.game.events.on(EventKeys.ACHIEVEMENT_UNLOCKED, this.handleAchievementUnlocked, this);
        this.scale.on('resize', this.resize, this);


        // --- Modals (Containers) ---
        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
        this.hobbyModal = this.createModal("Hobbies");
        this.craftingModal = this.createModal("Crafting");
        this.relationshipModal = this.createModal("Relationships");
        this.decorateModal = this.createModal("Decorate");
        this.ancestorModal = this.createModal("Hall of Ancestors");
        this.inventoryModal = this.createModal("Inventory");
        this.achievementsModal = this.createModal("Achievements");
        this.dialogueModal = this.createModal("Conversation");
        this.settingsModal = this.createSettingsModal();

        // --- Initial Layout ---
        this.createTabs();
        this.resize(this.scale); // Initial resize to set positions
        this.showTab('CARE');

        // --- Keyboard Shortcuts (Palette UX) ---
        // Quick access to tabs using number keys 1-4
        this.input.keyboard.on('keydown-ONE', () => this.showTab('CARE'));
        this.input.keyboard.on('keydown-TWO', () => this.showTab('ACTION'));
        this.input.keyboard.on('keydown-THREE', () => this.showTab('SYSTEM'));
        this.input.keyboard.on('keydown-FOUR', () => this.showTab('ANCESTORS'));
    }

    /**
     * Helper method to close all tracked modals.
     * Call this before opening any new modal to ensure exclusive visibility.
     */
    closeAllModals() {
        this.allModals.forEach(modal => modal.setVisible(false));
    }

    /**
     * Handles clicks on the Job Board button.
     */
    handleJobBoardClick() {
        if (this.nadagotchiData && this.nadagotchiData.currentCareer) {
            this.game.events.emit(EventKeys.UI_ACTION, EventKeys.WORK);
        } else {
            SoundSynthesizer.instance.playFailure();
            this.showToast("Job Board Locked", "You need a Career to work!\nTry Studying or Exploring.", "🚫");
        }
    }

    /**
     * Creates the permanent category tabs (Care, Action, System).
     */
    createTabs() {
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
     * @param {string} tabId - The ID of the tab to switch to.
     * Retrieves the list of actions (buttons) for a given tab ID.
     * @param {string} tabId - The ID of the tab (e.g., 'CARE', 'ACTION').
     * @returns {Array<object>} List of action definitions.
     */
    getTabActions(tabId) {
    showTab(tabId) {
        this.currentTab = tabId;

        // Update Tab Visuals
        // Cache the signature of the state used to render this tab
        this.lastTabSignature = this.getTabStateSignature(tabId);

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
                {
                    text: 'Work',
                    action: EventKeys.WORK,
                    condition: () => this.nadagotchiData && this.nadagotchiData.currentCareer,
                    disabledMessage: "You need a Career first!\nTry Studying or Exploring."
                },
                { text: 'Craft', action: EventKeys.OPEN_CRAFTING_MENU }
            ];
        } else if (tabId === 'SYSTEM') {
            actions = [
                { text: 'Passport', action: EventKeys.OPEN_SHOWCASE },
                { text: 'Journal', action: EventKeys.OPEN_JOURNAL },
                { text: 'Inventory', action: EventKeys.OPEN_INVENTORY },
                { text: 'Recipes', action: EventKeys.OPEN_RECIPES },
                { text: 'Hobbies', action: EventKeys.OPEN_HOBBIES },
                { text: 'Achievements', action: EventKeys.OPEN_ACHIEVEMENTS },
                { text: 'Decorate', action: EventKeys.DECORATE },
                { text: 'Settings', action: EventKeys.OPEN_SETTINGS },
                {
                    text: 'Retire',
                    action: EventKeys.RETIRE,
                    condition: () => this.nadagotchiData && this.nadagotchiData.isLegacyReady,
                    disabledMessage: "Not ready to retire yet."
                }
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
        return actions;
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

        // Get Actions
        const allActions = this.getTabActions(tabId);

        // Filter actions based on conditions to determine what will be shown
        // We do this here so we can generate the signature from the *visible* buttons
        const visibleActions = allActions.filter(item => !item.condition || item.condition());

        // Generate Signature (e.g., "Feed|Play|Meditate")
        const signature = visibleActions.map(a => a.text).join('|');

        // OPTIMIZATION: If we are calling showTab but the buttons are already correct, skip rebuild.
        // NOTE: If the user manually clicked the tab, we might want to force rebuild?
        // But usually showTab is called by UI clicks or updateStatsUI.
        // If the signature matches, we don't need to destroy and recreate buttons.
        // However, we must ensure that if this method is called via a Tab Click, we verify we are actually ON that tab.
        // Since we destroyed actionButtons previously in the old logic, we need to be careful.
        // In this logic: "Is the current displayed UI matching the requested UI?"

        // If the actionButtons array is populated and the signature matches, we can return early?
        // But we need to make sure we are not switching tabs (which clears buttons).
        // Let's rely on updateStatsUI to handle the optimization conditional call.
        // BUT, if showTab is called explicitly (e.g. click), we should proceed.
        // To be safe, let's just implement the rendering logic here and let updateStatsUI decide when to call it.
        // Wait, if I click 'Action' tab, showTab('ACTION') is called. Buttons are built.
        // Then updateStatsUI is called. It checks signature. Signature matches. It SKIPS calling showTab.
        // This is the desired behavior.
        // So showTab's job is just to BUILD.

        // Clear existing action buttons
        this.actionButtons.forEach(btn => btn.destroy());
        this.actionButtons = [];

        // Update signature for next comparison
        this.lastActionSignature = signature;

        // Layout buttons based on current screen size
        const dashboardHeight = Math.floor(this.cameras.main.height * 0.25);
        const dashboardY = this.cameras.main.height - dashboardHeight;

        this.layoutActionButtons(visibleActions, dashboardY + 50); // Start below tabs
    }

    /**
     * Lays out the action buttons in a responsive grid.
     */
    layoutActionButtons(actions, startY) {
        const width = this.cameras.main.width;
        let currentX = 20;
        let currentY = startY;
        const spacing = 15;
        const btnHeight = 40;

        actions.forEach(item => {
            // Condition check already done in showTab filtering
            // Palette UX: Show disabled buttons instead of hiding them for better discoverability
            const isDisabled = item.condition && !item.condition();
            const btnWidth = (item.text.length * 12) + 40;

            if (currentX + btnWidth > width - 20) {
                currentX = 20;
                currentY += btnHeight + spacing;
            }

            const btn = ButtonFactory.createButton(this, currentX, currentY, item.text, () => {
                this.game.events.emit(EventKeys.UI_ACTION, item.action, item.data);
            }, {
                width: btnWidth, height: btnHeight, color: 0x6A0DAD, fontSize: '24px', textColor: '#FFFFFF',
                onDisabledClick: () => {
                    this.showToast("Action Locked", item.disabledMessage || "Not available yet.", "🔒");
                }
            });

            if (isDisabled) btn.setDisabled(true);

            this.actionButtons.push(btn);
            currentX += btnWidth + spacing;
        });
    }

    /**
     * Handles the resize event.
     * Repositions UI elements to fit the new game size.
     */
    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        const dashboardHeight = Math.floor(height * 0.25);
        const dashboardY = height - dashboardHeight;

        this.cameras.main.setSize(width, height);

        // Update Dashboard Background
        this.dashboardBg.setPosition(0, dashboardY);
        this.dashboardBg.setSize(width, dashboardHeight);
        this.dashboardBorder.setPosition(0, dashboardY);
        this.dashboardBorder.setSize(width, 4);

        // Layout Tabs
        const tabWidth = Math.min(120, (width - 40) / 4);
        const tabSpacing = 10;
        let tabX = 20;
        const tabY = dashboardY + 10;

        this.tabButtons.forEach(btn => {
            btn.setPosition(tabX, tabY);
            // btn.setSize() is not strictly exposed on Container from ButtonFactory easily, but we rely on fixed size
            tabX += tabWidth + tabSpacing;
        });

        // Update Job Board & Retire Button
        if (this.jobBoardButton) this.jobBoardButton.setPosition(width - 130, height - 60);
        if (this.retireButton) this.retireButton.setPosition(width - 10, 50);

        // Refresh Tabs (Action Buttons)
        this.showTab(this.currentTab);

        // Resize Modals (The Core Fix)
        this.resizeModals(width, height);
    }

    /**
     * Updates the position and size of all modals to stay centered and responsive.
     * @param {number} width - Current screen width.
     * @param {number} height - Current screen height.
     */
    resizeModals(width, height) {
        const modalWidth = Math.min(500, width - 40);
        const modalHeight = Math.min(400, height - 100);

        this.allModals.forEach(container => {
            if (!container.active) return; // Skip destroyed

            // Center the container
            container.setPosition(width / 2, height / 2);

            // Update standard elements if they exist
            if (container.bg) {
                container.bg.setSize(modalWidth, modalHeight);
            }
            if (container.modalTitle) {
                container.modalTitle.setPosition(0, -modalHeight / 2 + 30);
            }
            if (container.closeButton) {
                container.closeButton.setPosition(modalWidth / 2 - 40, -modalHeight / 2 + 30);
            }
            if (container.content) {
                // Content stays at 0,0 (center)
                container.content.setStyle({ wordWrap: { width: modalWidth - 40 } });
            }
        });
    }

    /**
     * Handles specific UI actions.
     */
    handleUIActions(action, data) {
        switch (action) {
            case EventKeys.OPEN_SHOWCASE:
                this.scene.pause('MainScene');
                this.scene.sleep();
                this.scene.launch('ShowcaseScene', { nadagotchi: this.nadagotchiData });
                break;
            case EventKeys.OPEN_JOURNAL: this.openJournal(); break;
            case EventKeys.OPEN_RECIPES: this.openRecipeBook(); break;
            case EventKeys.OPEN_HOBBIES: this.openHobbyMenu(); break;
            case EventKeys.OPEN_CRAFTING_MENU: this.openCraftingMenu(); break;
            case EventKeys.DECORATE: this.openDecorateMenu(); break;
            case EventKeys.INTERACT_NPC: this.openRelationshipMenu(); break;
            case EventKeys.OPEN_ANCESTOR_MODAL: this.openAncestorModal(data); break;
            case EventKeys.OPEN_INVENTORY: this.openInventoryMenu(); break;
            case EventKeys.OPEN_ACHIEVEMENTS: this.openAchievementsModal(); break;
            case EventKeys.OPEN_SETTINGS: this.openSettingsMenu(); break;
        }
    }

    /**
     * Generates a signature string for the current tab's state.
     * Used to avoid rebuilding UI when state hasn't changed.
     * @param {string} tabId - The ID of the tab.
     * @returns {string} A signature representing relevant state.
     */
    getTabStateSignature(tabId) {
        if (!this.nadagotchiData) return '';
        switch (tabId) {
            case 'ACTION':
                // 'Work' button enabled state depends on currentCareer existence
                return `career:${!!this.nadagotchiData.currentCareer}`;
            case 'SYSTEM':
                // 'Retire' button enabled state depends on isLegacyReady
                return `legacy:${!!this.nadagotchiData.isLegacyReady}`;
            default:
                // Other tabs (CARE, ANCESTORS) don't have dynamic enabled states in the main button grid
                return 'static';
        }
    }

    /**
     * Updates all UI elements with the latest data from the Nadagotchi.
     * This method is the callback for the 'updateStats' event.
     * @param {object} data - The entire Nadagotchi object from MainScene.
     */
    updateStatsUI(data) {
        if (data.nadagotchi) {
            this.nadagotchiData = data.nadagotchi;
            this.settingsData = data.settings;
        } else {
            this.nadagotchiData = data;
        }
        const { stats, skills, mood, dominantArchetype, currentCareer, location, isLegacyReady, newCareerUnlocked } = this.nadagotchiData;
        const moodEmoji = this.getMoodEmoji(mood);
        const text = `Location: ${location}\n` +
                     `Archetype: ${dominantArchetype}\n` +
                     `Mood: ${mood} ${moodEmoji}\n` +
                     `Career: ${currentCareer || 'None'}\n` +
                     `Hunger: ${Math.floor(stats.hunger)}\n` +
                     `Energy: ${Math.floor(stats.energy)}\n` +
                     `Happiness: ${Math.floor(stats.happiness)}\n` +
                     `Logic: ${skills.logic.toFixed(2)} | Nav: ${skills.navigation.toFixed(2)} | Research: ${skills.research.toFixed(2)}`;

        // OPTIMIZATION: Only update text object if the string content has actually changed.
        // This runs 10 times a second, so avoiding texture regeneration is a win.
        if (this.lastStatsText !== text) {
            this.statsText.setText(text);
            this.lastStatsText = text;
        }

        if (this.currentTab === 'ACTION' || this.currentTab === 'SYSTEM') {
            // OPTIMIZATION: Check if the visible buttons actually changed before rebuilding
            const allActions = this.getTabActions(this.currentTab);
            const visibleActions = allActions.filter(item => !item.condition || item.condition());
            const signature = visibleActions.map(a => a.text).join('|');

            // Only rebuild if the signature differs from the last rendered state
            if (signature !== this.lastActionSignature) {
            // OPTIMIZATION: Only rebuild the action buttons if the relevant game state (signature) has changed.
            const newSignature = this.getTabStateSignature(this.currentTab);
            if (newSignature !== this.lastTabSignature) {
                this.showTab(this.currentTab);
            }
        }

        if (currentCareer) {
            this.jobBoardButton.setAlpha(1.0);
        } else {
            // Palette UX: Dimmed but interactive
            this.jobBoardButton.setAlpha(0.6);
        }

        this.retireButton.setVisible(isLegacyReady);

        if (newCareerUnlocked) {
            this.showCareerNotification(newCareerUnlocked);
            this.mainScene.nadagotchi.newCareerUnlocked = null;
        }
    }

    getMoodEmoji(mood) { return ({ 'happy': '😊', 'sad': '😢', 'angry': '😠', 'neutral': '😐' })[mood] || '❓'; }

    showCareerNotification(message) {
        const txt = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 30, `Career Unlocked: ${message}!`,
            { fontFamily: 'VT323, Arial', fontSize: '32px', color: '#000', backgroundColor: '#fff', padding: { x: 10, y: 5 }, align: 'center' }
        ).setOrigin(0.5);
        this.time.delayedCall(3000, () => txt.destroy());
    }

    startTutorial() {
        this.closeAllModals();
        this.scene.pause('MainScene');
        // Use Container for tutorial modal too
        const container = this.add.container(this.cameras.main.width/2, this.cameras.main.height/2);
        this.allModals.push(container);

        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9).setStrokeStyle(2, 0xFFFFFF);
        const title = this.add.text(0, -100, "SYSTEM GREETER", { fontFamily: 'VT323', fontSize: '32px', color: '#00FF00' }).setOrigin(0.5);
        const text = this.add.text(0, -20, "Welcome to Nadagotchi!\n\nWould you like a quick tour\nof the interface?", {
            fontFamily: 'VT323', fontSize: '24px', color: '#FFFFFF', align: 'center'
        }).setOrigin(0.5);

        const yesBtn = ButtonFactory.createButton(this, -60, 80, "Yes", () => {
             container.destroy();
             this.allModals = this.allModals.filter(m => m !== container);
             this.runTutorialSequence();
        }, { width: 100, height: 40, color: 0x4CAF50 });

        const noBtn = ButtonFactory.createButton(this, 60, 80, "No", () => {
             container.destroy();
             this.allModals = this.allModals.filter(m => m !== container);
             this.scene.resume('MainScene');
        }, { width: 100, height: 40, color: 0xF44336 });

        container.add([bg, title, text, yesBtn, noBtn]);
        // Tag for resize
        container.bg = bg;
    }

    runTutorialSequence() {
        // ... (Tutorial logic unchanged as it uses full-screen graphics overlay) ...
        // Keeping original implementation for brevity, it's resilient enough (overlay).
        let step = 0;
        const graphics = this.add.graphics();
        const textBg = this.add.rectangle(0, 0, 0, 0, 0x000000, 0.8).setOrigin(0.5);
        const instructionText = this.add.text(0, 0, '', { fontFamily: 'VT323', fontSize: '24px', color: '#FFFFFF', align: 'center' }).setOrigin(0.5);

        const nextStep = () => { step++; runStep(); };
        const highlight = (x, y, w, h, text) => {
            graphics.clear(); graphics.fillStyle(0x000000, 0.7); graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
            const gameW = this.cameras.main.width; const gameH = this.cameras.main.height;
            graphics.fillRect(0, 0, gameW, y); graphics.fillRect(0, y + h, gameW, gameH - (y + h));
            graphics.fillRect(0, y, x, h); graphics.fillRect(x + w, y, gameW - (x + w), h);
            graphics.lineStyle(4, 0x00FF00); graphics.strokeRect(x, y, w, h);
            textBg.setPosition(gameW / 2, gameH / 2); textBg.setSize(400, 100); textBg.setVisible(true);
            instructionText.setPosition(gameW / 2, gameH / 2); instructionText.setText(text + "\n\n(Click to continue)"); instructionText.setVisible(true);
            graphics.setDepth(1000); textBg.setDepth(1001); instructionText.setDepth(1002);
        };
        const runStep = () => {
            if (step === 1) highlight(5, 5, 400, 200, "Here you can see your Pet's\nStats, Mood, and Skills.");
            else if (step === 2) {
                this.showTab('CARE');
                highlight(10, this.cameras.main.height - Math.floor(this.cameras.main.height * 0.25), 500, 50, "Use these tabs to switch between\nCare, Actions, and Systems.");
            } else if (step === 3) {
                 highlight(10, this.cameras.main.height - Math.floor(this.cameras.main.height * 0.25) + 60, 600, 100, "These buttons let you interact\nwith your Nadagotchi.");
            } else {
                graphics.destroy(); textBg.destroy(); instructionText.destroy(); this.scene.resume('MainScene');
            }
        };
        this.input.on('pointerdown', () => { if (step > 0 && step < 4) nextStep(); });
        step = 1; runStep();
    }

    /**
     * Creates a generic modal using a Container for responsive layout.
     */
    createModal(title) {
        // Start centered. Resize will update this.
        const container = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.allModals.push(container);

        // Initial Dimensions (will be updated by resize)
        const w = 500, h = 400;

        // Local Coordinates: Center is 0,0
        const modalBg = this.add.rectangle(0, 0, w, h, 0x1a1a1a, 0.95).setStrokeStyle(2, 0xffffff);
        const modalTitle = this.add.text(0, -h/2 + 30, title, { fontFamily: 'VT323, Arial', fontSize: '36px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        const modalContent = this.add.text(0, 0, '', { fontSize: '24px', fontFamily: 'VT323, Arial', color: '#fff', wordWrap: { width: w - 40 } }).setOrigin(0.5);

        const closeButton = ButtonFactory.createButton(this, w/2 - 40, -h/2 + 30, 'X', () => {
             container.setVisible(false);
             if (this.scene.isPaused('MainScene')) this.scene.resume('MainScene');
        }, { width: 40, height: 40, color: 0x800000 });

        container.add([modalBg, modalTitle, modalContent, closeButton]);
        container.setVisible(false);

        // References for logic & resizing
        container.bg = modalBg;
        container.modalTitle = modalTitle;
        container.content = modalContent;
        container.closeButton = closeButton;

        return container;
    }

    showDialogue(npcName, text) {
        this.closeAllModals();
        this.dialogueModal.modalTitle.setText(npcName);
        this.dialogueModal.content.setText(`"${text}"`);
        this.dialogueModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openJournal() {
        this.closeAllModals();
        const entries = new PersistenceManager().loadJournal();
        const text = entries.length ? entries.slice().reverse().map(e => `[${e.date}]\n${e.text}`).join('\n\n---\n\n') : "No entries yet.";
        this.journalModal.content.setText(text);
        this.journalModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openRecipeBook() {
        this.closeAllModals();
        const discovered = (this.nadagotchiData && this.nadagotchiData.discoveredRecipes) || new PersistenceManager().loadRecipes();
        const allRecipes = (this.nadagotchiData && this.nadagotchiData.recipes) || {};
        let text = (!discovered || discovered.length === 0) ? "No recipes discovered yet." : "Discovered Recipes:\n\n" + discovered.map(name => {
            const r = allRecipes[name];
            return r ? `• ${name}\n  "${r.description}"\n  Req: ${Object.entries(r.materials).map(([m,c]) => `${c} ${m}`).join(', ')}` : `• ${name}`;
        }).join('\n\n');
        this.recipeModal.content.setText(text);
        this.recipeModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openHobbyMenu() {
        this.closeAllModals();
        if (!this.nadagotchiData) return;
        this.hobbyModal.content.setText(Object.entries(this.nadagotchiData.hobbies).map(([h, l]) => `${h}: Level ${l}`).join('\n'));
        this.hobbyModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    /**
     * Helper to get current dynamic modal width.
     */
    getModalWidth() {
        return Math.min(500, this.cameras.main.width - 40);
    }
    getModalHeight() {
        return Math.min(400, this.cameras.main.height - 100);
    }

    openCraftingMenu() {
        this.closeAllModals();
        if (!this.nadagotchiData) return;
        if (this.craftingButtons) this.craftingButtons.forEach(btn => btn.destroy());
        this.craftingButtons = [];

        const mw = this.getModalWidth();
        const startX = mw / 2 - 80; // Right side relative to center
        let yPos = -this.getModalHeight() / 2 + 100;

        const inventoryText = "Inventory:\n" + Object.entries(this.nadagotchiData.inventory).map(([item, count]) => `- ${item}: ${count}`).join('\n');
        let recipeText = "\n\nRecipes:\n";

        for (const recipeName in this.nadagotchiData.recipes) {
            const recipe = this.nadagotchiData.recipes[recipeName];
            const materials = Object.entries(recipe.materials).map(([mat, count]) => `${count} ${mat}`).join(', ');
            recipeText += `- ${recipeName}: ${recipe.description} (Req: ${materials})\n`;
            const canCraft = Object.entries(recipe.materials).every(([mat, count]) => (this.nadagotchiData.inventory[mat] || 0) >= count);

            if (canCraft) {
                // Use relative coords
                const craftButton = ButtonFactory.createButton(this, startX, yPos, 'Craft', () => {
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

    openRelationshipMenu() {
        this.closeAllModals();
        if (!this.nadagotchiData) return;
        this.relationshipModal.content.setText(Object.entries(this.nadagotchiData.relationships).map(([n, d]) => `${n}: Friendship ${d.level}`).join('\n'));
        this.relationshipModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openDecorateMenu() {
        this.closeAllModals();
        if (!this.nadagotchiData) return;
        if (this.decorateButtons) this.decorateButtons.forEach(btn => btn.destroy());
        this.decorateButtons = [];

        const mw = this.getModalWidth();
        const startX = mw / 2 - 80;
        let yPos = -this.getModalHeight() / 2 + 100;

        const furniture = Object.entries(this.nadagotchiData.inventory).filter(([item, count]) => this.nadagotchiData.recipes[item] && count > 0);
        let text = "Select an item to place:\n\n" + (furniture.length === 0 ? "You have no furniture." : "");

        furniture.forEach(([itemName, count]) => {
            text += `- ${itemName}: ${count}\n`;
            const placeButton = ButtonFactory.createButton(this, startX, yPos, 'Place', () => {
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

    openInventoryMenu() {
        this.closeAllModals();
        if (!this.nadagotchiData) return;
        if (this.inventoryButtons) this.inventoryButtons.forEach(btn => btn.destroy());
        this.inventoryButtons = [];
        if (this.inventoryTexts) this.inventoryTexts.forEach(t => t.destroy());
        this.inventoryTexts = [];

        const items = Object.entries(this.nadagotchiData.inventory || {});
        this.inventoryModal.content.setText(items.length === 0 ? "Empty." : "");

        const mw = this.getModalWidth();
        let currentY = -this.getModalHeight() / 2 + 60;
        const startX = -mw / 2 + 20;

        items.forEach(([itemName, count]) => {
            const def = ItemDefinitions[itemName] || { description: "Unknown", emoji: "❓", type: "Misc" };
            const itemStr = `${def.emoji} ${itemName} (x${count})`;
            const itemText = this.add.text(startX, currentY, itemStr, { font: '20px monospace', color: '#ffffff' });
            const descText = this.add.text(startX + 20, currentY + 25, def.description, { font: '16px monospace', color: '#aaaaaa', wordWrap: { width: mw - 150 } });

            this.inventoryModal.add([itemText, descText]);
            this.inventoryTexts.push(itemText, descText);

            if (def.type === 'Consumable' && count > 0) {
                 const useButton = ButtonFactory.createButton(this, mw/2 - 60, currentY + 10, 'Use', () => {
                    this.game.events.emit(EventKeys.UI_ACTION, EventKeys.CONSUME_ITEM, itemName);
                    this.inventoryModal.setVisible(false);
                    this.scene.resume('MainScene');
                }, { width: 60, height: 30, color: 0x228B22 });
                this.inventoryModal.add(useButton);
                this.inventoryButtons.push(useButton);
            }
            currentY += 60;
        });
        this.inventoryModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openAncestorModal(ancestorData) {
        this.closeAllModals();
        if (!ancestorData) return;
        const advice = NarrativeSystem.getAdvice(ancestorData.dominantArchetype);
        const text = `Name: Generation ${ancestorData.generation}\nArchetype: ${ancestorData.dominantArchetype}\nCareer: ${ancestorData.currentCareer || 'None'}\n\nStats:\nHappiness: ${Math.floor(ancestorData.stats.happiness)}\nLogic: ${ancestorData.skills.logic.toFixed(1)}\nEmpathy: ${ancestorData.skills.empathy.toFixed(1)}\n\nAdvice:\n"${advice}"`;
        this.ancestorModal.content.setText(text);
        this.ancestorModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    openAchievementsModal() {
        this.closeAllModals();
        const unlockedIds = new PersistenceManager().loadAchievements().unlocked || [];
        const text = Achievements.map(ach => unlockedIds.includes(ach.id) ? `${ach.icon} ${ach.name}\n${ach.description}` : `🔒 ${ach.name}\n(Locked)`).join('\n\n');
        this.achievementsModal.content.setText(text);
        this.achievementsModal.setVisible(true);
        this.scene.pause('MainScene');
    }

    handleAchievementUnlocked(achievement) {
        SoundSynthesizer.instance.playChime();
        this.showToast("Achievement Unlocked!", achievement.name, achievement.icon);
    }

    showToast(title, message, icon = '') {
        const width = this.cameras.main.width;
        // Toasts are global, so using simple container logic at top is fine
        const toastWidth = 300, toastHeight = 80;
        const container = this.add.container(width / 2 - toastWidth / 2, -toastHeight - 20);
        const bg = this.add.rectangle(0, 0, toastWidth, toastHeight, 0xFFD700).setOrigin(0).setStrokeStyle(2, 0xFFFFFF);
        const iconText = this.add.text(10, 15, icon, { fontSize: '40px' });
        const titleText = this.add.text(70, 10, title, { fontSize: '16px', color: '#000', fontStyle: 'bold', fontFamily: 'VT323' });
        const msgText = this.add.text(70, 35, message, { fontSize: '24px', color: '#000', fontFamily: 'VT323' });
        container.add([bg, iconText, titleText, msgText]);
        this.tweens.add({ targets: container, y: 20, duration: 500, ease: 'Back.out', hold: 3000, yoyo: true, onComplete: () => container.destroy() });
    }

    createSettingsModal() {
        const modal = this.createModal("Settings");
        const h = 400; // default height from createModal

        // Add to Container using local coords (0,0 is center)
        const volLabel = this.add.text(0, -80, "Volume", { fontSize: '24px', fontFamily: 'VT323', monospace: true }).setOrigin(0.5);
        const volDown = ButtonFactory.createButton(this, -80, -40, "-", () => {
             const newVol = Math.max(0, (this.settingsData?.volume ?? 0.5) - 0.1);
             this.game.events.emit(EventKeys.UPDATE_SETTINGS, { volume: newVol });
             this.settingsModal.volDisplay.setText(`${Math.round(newVol * 100)}%`);
             if (!this.settingsData) this.settingsData = {}; this.settingsData.volume = newVol;
        }, { width: 40, height: 40, color: 0x808080 });

        const volUp = ButtonFactory.createButton(this, 80, -40, "+", () => {
             const newVol = Math.min(1, (this.settingsData?.volume ?? 0.5) + 0.1);
             this.game.events.emit(EventKeys.UPDATE_SETTINGS, { volume: newVol });
             this.settingsModal.volDisplay.setText(`${Math.round(newVol * 100)}%`);
             if (!this.settingsData) this.settingsData = {}; this.settingsData.volume = newVol;
        }, { width: 40, height: 40, color: 0x808080 });

        const volDisplay = this.add.text(0, -40, "50%", { fontSize: '24px', fontFamily: 'VT323' }).setOrigin(0.5);
        const speedLabel = this.add.text(0, 20, "Game Speed", { fontSize: '24px', fontFamily: 'VT323' }).setOrigin(0.5);

        const speedButtons = [];
        const speeds = [{ l: "1x", v: Config.SETTINGS.SPEED_MULTIPLIERS.NORMAL }, { l: "2x", v: Config.SETTINGS.SPEED_MULTIPLIERS.FAST }, { l: "5x", v: Config.SETTINGS.SPEED_MULTIPLIERS.HYPER }];
        let startX = -80;
        speeds.forEach(s => {
            const btn = ButtonFactory.createButton(this, startX, 60, s.l, () => {
                 this.game.events.emit(EventKeys.UPDATE_SETTINGS, { gameSpeed: s.v });
                 this.updateSpeedButtons(s.v);
                 if (!this.settingsData) this.settingsData = {}; this.settingsData.gameSpeed = s.v;
            }, { width: 60, height: 40, fontSize: '20px', color: 0x008080 });
            btn.speedVal = s.v;
            speedButtons.push(btn);
            startX += 80;
        });

        modal.add([volLabel, volDown, volUp, volDisplay, speedLabel, ...speedButtons]);
        modal.volDisplay = volDisplay;
        modal.speedButtons = speedButtons;
        return modal;
    }

    updateSpeedButtons(speed) {
        this.settingsModal.speedButtons.forEach(btn => {
            if (Math.abs(btn.speedVal - speed) < 0.01) { btn.setAlpha(1); btn.setScale(1.1); }
            else { btn.setAlpha(0.6); btn.setScale(1.0); }
        });
    }

    openSettingsMenu() {
        this.closeAllModals();
        if (!this.settingsData) this.settingsData = { volume: Config.SETTINGS.DEFAULT_VOLUME, gameSpeed: Config.SETTINGS.DEFAULT_SPEED };
        const vol = Math.round((this.settingsData.volume ?? 0.5) * 100);
        this.settingsModal.volDisplay.setText(`${vol}%`);
        this.updateSpeedButtons(this.settingsData.gameSpeed || 1.0);
        this.settingsModal.setVisible(true);
        this.scene.pause('MainScene');
    }
}
