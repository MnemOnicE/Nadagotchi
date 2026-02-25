import { ButtonFactory } from './ButtonFactory.js';
import { PersistenceManager } from './PersistenceManager.js';
import { NarrativeSystem } from './NarrativeSystem.js';
import { EventKeys } from './EventKeys.js';
import { ItemDefinitions } from './ItemData.js';
import { Config } from './Config.js';
import { CareerDefinitions } from './CareerDefinitions.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';
import { Achievements } from './AchievementData.js';

/**
 * @fileoverview Manages the "Physical Shell" UI layer of the game.
 * Handles the HUD, action buttons, modals, and user input mapping.
 * Renders on top of the MainScene.
 */

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.lastActionSignature = '';
        this.craftingGridState = new Array(9).fill(null);
        this.selectedInventoryItem = null;
        this.persistence = new PersistenceManager();
        this.cachedAncestors = [];
    }

    create() {
        this.currentTab = 'CARE';
        this.tabButtons = [];
        this.actionButtons = [];
        this.allModals = [];

        this.dashboardBg = this.add.rectangle(0, 0, 1, 1, 0xA3B8A2).setOrigin(0);
        this.dashboardBorder = this.add.rectangle(0, 0, 1, 1, 0x4A4A4A).setOrigin(0);

        const safeTop = Config.UI.SAFE_AREA_TOP || 0;
        this.statsText = this.add.text(10, 10 + safeTop, '', {
            fontFamily: 'VT323, monospace', fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        });

        // --- SECRET DEBUG TRIGGER ---
        this.statsText.setInteractive({ useHandCursor: true });
        this.statsTextClickCount = 0;
        this.statsText.on('pointerdown', () => {
             this.statsTextClickCount++;
             if (this.statsTextClickCount === 1) {
                  // Reset after 2 seconds
                  this.time.delayedCall(2000, () => { this.statsTextClickCount = 0; });
             }
             if (this.statsTextClickCount >= 5) {
                  this.statsTextClickCount = 0;
                  const mainScene = this.scene.get('MainScene');
                  if (mainScene && mainScene.debugConsole) {
                       mainScene.debugConsole.toggle();
                  }
             }
        });

        this.lastStatsText = '';

        this.actionButtons = [];

        this.jobBoardButton = ButtonFactory.createButton(this, 0, 0, 'Job Board', () => {
            this.handleJobBoardClick();
        }, { width: 120, height: 50, color: 0x6A0DAD, fontSize: '20px' });
        this.jobBoardButton.setAlpha(0.6);

        this.retireButton = this.add.text(0, 50, 'Retire', {
            fontFamily: 'Arial', fontSize: '16px', padding: { x: 15, y: 10 }, backgroundColor: '#ff00ff', color: '#ffffff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setVisible(false)
          .on('pointerdown', () => this.game.events.emit(EventKeys.UI_ACTION, EventKeys.RETIRE));

        this.game.events.on(EventKeys.UPDATE_STATS, this.updateStatsUI, this);
        this.game.events.on(EventKeys.UI_ACTION, this.handleUIActions, this);
        this.game.events.on(EventKeys.START_TUTORIAL, this.startTutorial, this);
        this.game.events.on(EventKeys.ACHIEVEMENT_UNLOCKED, this.handleAchievementUnlocked, this);
        this.scale.on('resize', this.resize, this);

        this.calendarDropdown = this.createCalendarDropdown();

        this.journalModal = this.createModal("Journal");
        this.recipeModal = this.createModal("Recipe Book");
        this.hobbyModal = this.createModal("Hobbies");

        // Crafting Modal
        this.craftingModal = this.createModal("Crafting Table");

        this.relationshipModal = this.createModal("Relationships");
        this.decorateModal = this.createModal("Decorate");
        this.ancestorModal = this.createModal("Hall of Ancestors");
        this.inventoryModal = this.createModal("Inventory");
        this.achievementsModal = this.createModal("Achievements");
        this.dialogueModal = this.createModal("Conversation");
        this.settingsModal = this.createSettingsModal();
        this.showcaseModal = this.createShowcaseModal();
        this.careerModal = this.createModal("Career Profile");
        this.jobBoardModal = this.createModal("Job Board");

        this.createTabs();
        this.resize(this.scale);
        this.showTab('CARE');

        this.input.keyboard.on('keydown-ONE', () => this.showTab('CARE'));
        this.input.keyboard.on('keydown-TWO', () => this.showTab('ACTION'));
        this.input.keyboard.on('keydown-THREE', () => this.showTab('SYSTEM'));
        this.input.keyboard.on('keydown-FOUR', () => this.showTab('ANCESTORS'));

        // Initial async data load for UI
        this.loadAsyncUIData();
    }

    async loadAsyncUIData() {
        this.cachedAncestors = await this.persistence.loadHallOfFame();
        // Trigger update if on Ancestors tab
        if (this.currentTab === 'ANCESTORS') {
            this.updateActionButtons(true);
        }
    }

    closeAllModals() { this.allModals.forEach(modal => modal.setVisible(false)); }
    handleJobBoardClick() { this.game.events.emit(EventKeys.UI_ACTION, EventKeys.OPEN_JOB_BOARD); }
    createTabs() {
        const tabs = [{ label: '❤️ CARE', id: 'CARE' }, { label: '🎒 ACTION', id: 'ACTION' }, { label: '⚙️ SYSTEM', id: 'SYSTEM' }, { label: '🏺 ANCESTORS', id: 'ANCESTORS' }];
        tabs.forEach(tab => {
            const btn = ButtonFactory.createButton(this, 0, 0, tab.label, () => { this.showTab(tab.id, true); }, { width: 100, height: 35, color: 0xD8A373, fontSize: '24px' });
            btn.tabId = tab.id; this.tabButtons.push(btn);
        });
    }
    getTabActions(tabId) {
        let actions = [];
        if (tabId === 'CARE') actions = [{ text: 'Feed', action: EventKeys.FEED }, { text: 'Play', action: EventKeys.PLAY }, { text: 'Meditate', action: EventKeys.MEDITATE }];
        else if (tabId === 'ACTION') actions = [{ text: 'Explore', action: EventKeys.EXPLORE }, { text: 'Study', action: EventKeys.STUDY }, { text: 'Work', action: EventKeys.WORK, condition: () => this.nadagotchiData && this.nadagotchiData.currentCareer, disabledMessage: "You need a Career first!" }, { text: 'Craft', action: EventKeys.OPEN_CRAFTING_MENU }];
        else if (tabId === 'SYSTEM') actions = [{ text: 'Passport', action: EventKeys.OPEN_SHOWCASE }, { text: 'Career', action: EventKeys.OPEN_CAREER_MENU }, { text: 'Journal', action: EventKeys.OPEN_JOURNAL }, { text: 'Inventory', action: EventKeys.OPEN_INVENTORY }, { text: 'Recipes', action: EventKeys.OPEN_RECIPES }, { text: 'Hobbies', action: EventKeys.OPEN_HOBBIES }, { text: 'Achievements', action: EventKeys.OPEN_ACHIEVEMENTS }, { text: 'Showcase', action: EventKeys.OPEN_SHOWCASE }, { text: 'Decorate', action: EventKeys.DECORATE }, { text: 'Settings', action: EventKeys.OPEN_SETTINGS }, { text: 'Retire', action: EventKeys.RETIRE, condition: () => this.nadagotchiData && this.nadagotchiData.isLegacyReady, disabledMessage: "Not ready yet." }];
        else if (tabId === 'ANCESTORS') {
            const ancestors = this.cachedAncestors || [];
            if (ancestors.length === 0) actions = [{ text: 'No Ancestors Yet', action: EventKeys.NONE, condition: () => true }];
            else ancestors.forEach((ancestor) => { actions.push({ text: `Gen ${ancestor.generation}: ${ancestor.dominantArchetype}`, action: EventKeys.OPEN_ANCESTOR_MODAL, data: ancestor }); });
            // Trigger refresh in case data wasn't ready (will loop if not handled carefully, but getTabActions is pure)
            if (this.cachedAncestors.length === 0) {
                 this.loadAsyncUIData(); // Attempt reload if empty
            }
        }
        return actions;
    }
    showTab(tabId, force = false) {
        this.currentTab = tabId;
        this.tabButtons.forEach(btn => { btn.setAlpha(btn.tabId === tabId ? 1.0 : 0.7); });
        this.updateActionButtons(force);
    }
    updateActionButtons(force = false) {
        const allActions = this.getTabActions(this.currentTab);
        const visibleActions = allActions.filter(item => !item.condition || item.condition());
        const signature = `${this.currentTab}:${visibleActions.map(a => a.text).join('|')}`;
        if (!force && signature === this.lastActionSignature) return;
        this.actionButtons.forEach(btn => btn.destroy());
        this.actionButtons = [];
        this.lastActionSignature = signature;
        const dashboardHeight = Math.floor(this.cameras.main.height * Config.UI.DASHBOARD_HEIGHT_RATIO);
        const dashboardY = this.cameras.main.height - dashboardHeight;
        this.layoutActionButtons(visibleActions, dashboardY + 50);
    }
    layoutActionButtons(actions, startY) {
        const width = this.cameras.main.width;
        let currentX = 20, currentY = startY;
        actions.forEach(item => {
            const btnWidth = (item.text.length * 12) + 40;
            if (currentX + btnWidth > width - 20) { currentX = 20; currentY += 55; }
            const btn = ButtonFactory.createButton(this, currentX, currentY, item.text, () => { this.game.events.emit(EventKeys.UI_ACTION, item.action, item.data); }, { width: btnWidth, height: 40, color: 0x6A0DAD, fontSize: '24px', textColor: '#FFFFFF', onDisabledClick: () => { this.showToast("Action Locked", item.disabledMessage || "Not available yet.", "🔒"); } });
            if (item.condition && !item.condition()) btn.setDisabled(true);
            this.actionButtons.push(btn);
            currentX += btnWidth + 15;
        });
    }
    resize(gameSize) {
        const width = gameSize.width, height = gameSize.height;
        const dashboardHeight = Math.floor(height * Config.UI.DASHBOARD_HEIGHT_RATIO);
        const dashboardY = height - dashboardHeight;
        this.cameras.main.setSize(width, height);
        this.dashboardBg.setPosition(0, dashboardY); this.dashboardBg.setSize(width, dashboardHeight);
        this.dashboardBorder.setPosition(0, dashboardY); this.dashboardBorder.setSize(width, 4);
        const tabWidth = Math.min(120, (width - 40) / 4);
        let tabX = 20;
        this.tabButtons.forEach(btn => { btn.setPosition(tabX, dashboardY + 10); tabX += tabWidth + 10; });
        if (this.jobBoardButton) this.jobBoardButton.setPosition(width - 130, height - 60);
        if (this.retireButton) this.retireButton.setPosition(width - 10, 50);

        const safeTop = Config.UI.SAFE_AREA_TOP || 0;
        if (this.calendarDropdown) this.calendarDropdown.setPosition(width - 160, safeTop);

        this.updateActionButtons(true);
        this.resizeModals(width, height);
    }
    resizeModals(width, height) {
        const modalWidth = Math.min(500, width - 40);
        const modalHeight = Math.min(400, height - 100);
        this.allModals.forEach(container => {
            if (!container.active) return;
            container.setPosition(width / 2, height / 2);
            if (container.bg) container.bg.setSize(modalWidth, modalHeight);
            if (container.modalTitle) container.modalTitle.setPosition(0, -modalHeight / 2 + 30);
            if (container.closeButton) container.closeButton.setPosition(modalWidth / 2 - 40, -modalHeight / 2 + 30);
            if (container.content) container.content.setStyle({ wordWrap: { width: modalWidth - 40 } });
        });
    }
    handleUIActions(action, data) {
        switch (action) {
            case EventKeys.OPEN_SHOWCASE: this.scene.pause('MainScene'); this.scene.sleep(); this.scene.launch('ShowcaseScene', { nadagotchi: this.nadagotchiData }); break;
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
            case EventKeys.OPEN_CAREER_MENU: this.openCareerMenu(); break;
            case EventKeys.OPEN_JOB_BOARD: this.openJobBoardMenu(); break;
        }
    }
    getTabStateSignature(tabId) {
        if (!this.nadagotchiData) return '';
        switch (tabId) {
            case 'ACTION': return `career:${!!this.nadagotchiData.currentCareer}`;
            case 'SYSTEM': return `legacy:${!!this.nadagotchiData.isLegacyReady}`;
            default: return 'static';
        }
    }
    updateStatsUI(data) {
        let worldState = null;
        if (data.nadagotchi) { this.nadagotchiData = data.nadagotchi; this.settingsData = data.settings; worldState = data.world; } else { this.nadagotchiData = data; }
        if (worldState) this.updateCalendarDropdown(worldState);
        const { stats, skills, mood, dominantArchetype, currentCareer, location, isLegacyReady, newCareerUnlocked } = this.nadagotchiData;
        const moodEmoji = this.getMoodEmoji(mood);
        const text = `Location: ${location}\nArchetype: ${dominantArchetype}\nMood: ${mood} ${moodEmoji}\nCareer: ${currentCareer || 'None'}\nHunger: ${Math.floor(stats.hunger)}\nEnergy: ${Math.floor(stats.energy)}\nHappiness: ${Math.floor(stats.happiness)}\nLogic: ${skills.logic.toFixed(2)} | Nav: ${skills.navigation.toFixed(2)} | Research: ${skills.research.toFixed(2)}`;
        if (this.lastStatsText !== text) { this.statsText.setText(text); this.lastStatsText = text; }
        this.updateActionButtons(false);
        if (currentCareer) this.jobBoardButton.setAlpha(1.0); else this.jobBoardButton.setAlpha(0.6);
        this.retireButton.setVisible(isLegacyReady);
        if (newCareerUnlocked) { this.showCareerNotification(newCareerUnlocked); this.mainScene.nadagotchi.newCareerUnlocked = null; }
    }
    getMoodEmoji(mood) { return Config.MOOD_VISUALS.EMOJIS[mood] || Config.MOOD_VISUALS.DEFAULT_EMOJI; }
    showCareerNotification(message) { const txt = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 30, `Career Unlocked: ${message}!`, { fontFamily: 'VT323, Arial', fontSize: '32px', color: '#000', backgroundColor: '#fff', padding: { x: 10, y: 5 }, align: 'center' }).setOrigin(0.5); this.time.delayedCall(3000, () => txt.destroy()); }
    createCalendarDropdown() {
        const width = 150, collapsedHeight = 30, expandedHeight = 120;
        const container = this.add.container(0, 0);
        const bg = this.add.rectangle(0, 0, width, collapsedHeight, 0x000000, 0.7).setOrigin(0, 0).setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
        const headerText = this.add.text(10, 5, "🕒 Day", { fontFamily: 'VT323, monospace', fontSize: '20px', color: '#FFFFFF' });
        const contentContainer = this.add.container(0, collapsedHeight).setVisible(false);
        const contentBg = this.add.rectangle(0, 0, width, expandedHeight - collapsedHeight, 0x222222, 0.9).setOrigin(0, 0).setStrokeStyle(1, 0x888888);
        const detailsText = this.add.text(10, 10, "Year: 1\nSpring\nDay 1\nWeather: Sunny", { fontFamily: 'VT323, monospace', fontSize: '16px', color: '#CCCCCC', lineSpacing: 5 });
        contentContainer.add([contentBg, detailsText]); container.add([bg, headerText, contentContainer]);
        container.isExpanded = false; container.headerText = headerText; container.detailsText = detailsText;
        bg.on('pointerdown', () => { container.isExpanded = !container.isExpanded; contentContainer.setVisible(container.isExpanded); bg.setSize(width, container.isExpanded ? expandedHeight : collapsedHeight); container.setDepth(200); });
        container.updateText = (header, details) => { headerText.setText(header); detailsText.setText(details); };
        return container;
    }
    updateCalendarDropdown(worldState) { if (!this.calendarDropdown) return; const { timePeriod, season, day, year, weather, event } = worldState; const timeIcon = (timePeriod === 'Night' || timePeriod === 'Dusk' || timePeriod === 'Dawn') ? '🌙' : '☀️'; const header = `${timeIcon} ${timePeriod}`; let details = `Year ${year}\n${season}, Day ${day}\n${weather}`; if (event) details += `\nEvent: ${event.name}`; if (this.calendarDropdown.updateText) this.calendarDropdown.updateText(header, details); }
    createModal(title) {
        const container = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2); this.allModals.push(container);
        const w = 500, h = 400;
        const modalBg = this.add.rectangle(0, 0, w, h, 0x1a1a1a, 0.95).setStrokeStyle(2, 0xffffff).setInteractive();
        const modalTitle = this.add.text(0, -h/2 + 30, title, { fontFamily: 'VT323, Arial', fontSize: '36px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        const modalContent = this.add.text(0, 0, '', { fontSize: '24px', fontFamily: 'VT323, Arial', color: '#fff', wordWrap: { width: w - 40 } }).setOrigin(0.5);
        const closeButton = ButtonFactory.createButton(this, w/2 - 40, -h/2 + 30, 'X', () => { container.setVisible(false); if (this.scene.isPaused('MainScene')) this.scene.resume('MainScene'); }, { width: 40, height: 40, color: 0x800000 });
        container.add([modalBg, modalTitle, modalContent, closeButton]); container.setVisible(false);
        container.bg = modalBg; container.modalTitle = modalTitle; container.content = modalContent; container.closeButton = closeButton;
        return container;
    }
    getModalWidth() { return Math.min(500, this.cameras.main.width - 40); }
    getModalHeight() { return Math.min(400, this.cameras.main.height - 100); }

    // --- UPDATED CRAFTING MENU (GRID) ---
    openCraftingMenu() {
        this.closeAllModals();
        if (!this.nadagotchiData) return;

        this.craftingGridState = new Array(9).fill(null);
        this.selectedInventoryItem = null;

        const container = this.craftingModal;
        if (this.craftingDynamicItems) { this.craftingDynamicItems.forEach(i => i.destroy()); }
        this.craftingDynamicItems = [];

        container.content.setText("");

        const items = Object.entries(this.nadagotchiData.inventory).filter(([k,v]) => v > 0);
        let startY = -150;

        const invTitle = this.add.text(-200, -180, "Inventory:", { fontSize: '18px', fontFamily: 'VT323' });
        container.add(invTitle);
        this.craftingDynamicItems.push(invTitle);

        items.forEach(([item, count]) => {
            const btn = ButtonFactory.createButton(this, -200, startY, `${item} (${count})`, () => {
                this.selectedInventoryItem = item;
                this.showToast("Selected", item, "🪵");
            }, { width: 140, height: 30, fontSize: '16px', color: 0x444444 });
            container.add(btn);
            this.craftingDynamicItems.push(btn);
            startY += 40;
        });

        const gridStartX = -50;
        const gridStartY = -100;
        const cellSize = 60;

        for(let i=0; i<9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = gridStartX + (col * (cellSize + 5));
            const y = gridStartY + (row * (cellSize + 5));

            const slot = this.add.rectangle(x, y, cellSize, cellSize, 0x333333).setStrokeStyle(2, 0x888888).setInteractive();
            const slotText = this.add.text(x, y, "", { fontSize: '12px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);

            slot.on('pointerdown', () => {
                if (this.selectedInventoryItem) {
                    this.craftingGridState[i] = this.selectedInventoryItem;
                    slotText.setText(this.selectedInventoryItem.substring(0, 6) + ".");
                    slot.setFillStyle(0x555555);
                } else {
                    this.craftingGridState[i] = null;
                    slotText.setText("");
                    slot.setFillStyle(0x333333);
                }
            });

            container.add([slot, slotText]);
            this.craftingDynamicItems.push(slot, slotText);
        }

        const craftBtn = ButtonFactory.createButton(this, 180, 0, "CRAFT!", () => {
             const mainScene = this.scene.get('MainScene');
             const result = mainScene.nadagotchi.inventorySystem.craftFromGrid(this.craftingGridState);

             if (result.success) {
                 this.showToast("Crafted!", result.item, "✨");
                 this.openCraftingMenu(); // Refresh
             } else {
                 this.showToast("Failed", result.message, "❌");
             }
        }, { width: 100, height: 60, color: 0x228B22 });
        container.add(craftBtn);
        this.craftingDynamicItems.push(craftBtn);

        container.setVisible(true);
        this.scene.pause('MainScene');
    }

    showDialogue(npcName, dialogueData) {
        this.closeAllModals();
        let text = "";
        let options = [];
        if (typeof dialogueData === 'string') { text = dialogueData; options = [{ label: "Close", action: null }]; } else { text = dialogueData.text; options = dialogueData.options || [{ label: "Close", action: null }]; }
        if (this.dialogueButtons) { this.dialogueButtons.forEach(btn => btn.destroy()); }
        this.dialogueButtons = [];
        this.dialogueModal.modalTitle.setText(npcName);
        this.dialogueModal.content.setText(`"${text}"`);
        const startY = 100;
        let yOffset = 0;
        options.forEach(opt => {
            const btn = ButtonFactory.createButton(this, 0, startY + yOffset, opt.label, () => {
                 this.dialogueModal.setVisible(false);
                 this.scene.resume('MainScene');
                 if (opt.action) {
                     if (opt.action === 'GIFT_CALLBACK') { this.game.events.emit(EventKeys.UI_ACTION, EventKeys.INTERACT_NPC, { npc: npcName, type: 'GIFT' }); } else { opt.action(); }
                 }
            }, { width: 200, height: 40, color: 0x4444AA });
            this.dialogueModal.add(btn);
            this.dialogueButtons.push(btn);
            yOffset += 50;
        });
        this.dialogueModal.setVisible(true);
        this.scene.pause('MainScene');
    }
    async openJournal() { this.closeAllModals(); const entries = await this.persistence.loadJournal(); const modal = this.journalModal; modal.entries = entries.slice().reverse(); modal.currentPage = 0; modal.entriesPerPage = 3; if (!modal.navButtons) { const mw = this.getModalWidth(); const mh = this.getModalHeight(); const yPos = mh/2 - 40; modal.btnPrev = ButtonFactory.createButton(this, -80, yPos, "< Prev", () => this.changeJournalPage(-1), { width: 80, height: 30 }); modal.btnNext = ButtonFactory.createButton(this, 80, yPos, "Next >", () => this.changeJournalPage(1), { width: 80, height: 30 }); modal.pageIndicator = this.add.text(0, yPos, "1/1", { fontFamily: 'VT323', fontSize: '20px' }).setOrigin(0.5); modal.add([modal.btnPrev, modal.btnNext, modal.pageIndicator]); modal.navButtons = true; } this.updateJournalPage(); this.journalModal.setVisible(true); this.scene.pause('MainScene'); }
    changeJournalPage(delta) { const modal = this.journalModal; const totalPages = Math.ceil(modal.entries.length / modal.entriesPerPage) || 1; let newPage = modal.currentPage + delta; if (newPage < 0) newPage = 0; if (newPage >= totalPages) newPage = totalPages - 1; modal.currentPage = newPage; this.updateJournalPage(); }
    updateJournalPage() { const modal = this.journalModal; const totalPages = Math.ceil(modal.entries.length / modal.entriesPerPage) || 1; const start = modal.currentPage * modal.entriesPerPage; const pageEntries = modal.entries.slice(start, start + modal.entriesPerPage); const text = pageEntries.length ? pageEntries.map(e => `[${e.date}]\n${e.text}`).join('\n\n---\n\n') : "No entries yet."; modal.content.setText(text); modal.pageIndicator.setText(`${modal.currentPage + 1}/${totalPages}`); modal.btnPrev.setDisabled(modal.currentPage === 0); modal.btnNext.setDisabled(modal.currentPage >= totalPages - 1); modal.btnPrev.setAlpha(modal.currentPage === 0 ? 0.5 : 1); modal.btnNext.setAlpha(modal.currentPage >= totalPages - 1 ? 0.5 : 1); }
    async openRecipeBook() { this.closeAllModals(); const discovered = (this.nadagotchiData && this.nadagotchiData.discoveredRecipes) || await this.persistence.loadRecipes(); const allRecipes = (this.nadagotchiData && this.nadagotchiData.recipes) || {}; let text = (!discovered || discovered.length === 0) ? "No recipes discovered yet." : "Discovered Recipes:\n\n" + discovered.map(name => { const r = allRecipes[name]; return r ? `• ${name}\n  "${r.description}"\n  Req: ${Object.entries(r.materials).map(([m,c]) => `${c} ${m}`).join(', ')}` : `• ${name}`; }).join('\n\n'); this.recipeModal.content.setText(text); this.recipeModal.setVisible(true); this.scene.pause('MainScene'); }
    openHobbyMenu() { this.closeAllModals(); if (!this.nadagotchiData) return; this.hobbyModal.content.setText(Object.entries(this.nadagotchiData.hobbies).map(([h, l]) => `${h}: Level ${l}`).join('\n')); this.hobbyModal.setVisible(true); this.scene.pause('MainScene'); }
    openRelationshipMenu() { this.closeAllModals(); if (!this.nadagotchiData) return; this.relationshipModal.content.setText(Object.entries(this.nadagotchiData.relationships).map(([n, d]) => `${n}: Friendship ${d.level}`).join('\n')); this.relationshipModal.setVisible(true); this.scene.pause('MainScene'); }
    openDecorateMenu() { this.closeAllModals(); if (!this.nadagotchiData) return; if (this.decorateButtons) this.decorateButtons.forEach(btn => btn.destroy()); this.decorateButtons = []; const mw = this.getModalWidth(); const startX = mw / 2 - 80; let yPos = -this.getModalHeight() / 2 + 100; const validTypes = ['FURNITURE', 'WALLPAPER', 'FLOORING']; const furniture = Object.entries(this.nadagotchiData.inventory).filter(([item, count]) => { const def = ItemDefinitions[item]; return def && validTypes.includes(def.type) && count > 0; }); let text = "Select an item to place:\n\n" + (furniture.length === 0 ? "You have no furniture or decor." : ""); furniture.forEach(([itemName, count]) => { text += `- ${itemName}: ${count}\n`; const def = ItemDefinitions[itemName]; const isSurface = def && (def.type === 'WALLPAPER' || def.type === 'FLOORING'); const actionKey = isSurface ? EventKeys.APPLY_HOME_DECOR : EventKeys.PLACE_FURNITURE; const btnText = isSurface ? 'Apply' : 'Place'; const placeButton = ButtonFactory.createButton(this, startX, yPos, btnText, () => { this.game.events.emit(EventKeys.UI_ACTION, actionKey, itemName); this.decorateModal.setVisible(false); this.scene.resume('MainScene'); }, { width: 80, height: 30, color: 0x228B22 }); this.decorateModal.add(placeButton); this.decorateButtons.push(placeButton); yPos += 35; }); const moveBtnY = this.getModalHeight() / 2 - 60; const toggleBtn = ButtonFactory.createButton(this, 0, moveBtnY, 'Move Furniture', () => { this.game.events.emit(EventKeys.UI_ACTION, EventKeys.TOGGLE_DECORATION_MODE); this.decorateModal.setVisible(false); this.scene.resume('MainScene'); }, { width: 160, height: 40, color: 0x4169E1 }); this.decorateModal.add(toggleBtn); this.decorateButtons.push(toggleBtn); this.decorateModal.content.setText(text); this.decorateModal.setVisible(true); this.scene.pause('MainScene'); }
    openInventoryMenu() { this.closeAllModals(); if (!this.nadagotchiData) return; if (this.inventoryButtons) this.inventoryButtons.forEach(btn => btn.destroy()); this.inventoryButtons = []; if (this.inventoryTexts) this.inventoryTexts.forEach(t => t.destroy()); this.inventoryTexts = []; const items = Object.entries(this.nadagotchiData.inventory || {}); this.inventoryModal.content.setText(items.length === 0 ? "Empty." : ""); const mw = this.getModalWidth(); let currentY = -this.getModalHeight() / 2 + 60; const startX = -mw / 2 + 20; items.forEach(([itemName, count]) => { const def = ItemDefinitions[itemName] || { description: "Unknown", emoji: "❓", type: "Misc" }; const itemStr = `${def.emoji} ${itemName} (x${count})`; const itemText = this.add.text(startX, currentY, itemStr, { font: '20px monospace', color: '#ffffff' }); const descText = this.add.text(startX + 20, currentY + 25, def.description, { font: '16px monospace', color: '#aaaaaa', wordWrap: { width: mw - 150 } }); this.inventoryModal.add([itemText, descText]); this.inventoryTexts.push(itemText, descText); if (def.type === 'Consumable' && count > 0) { const useButton = ButtonFactory.createButton(this, mw/2 - 60, currentY + 10, 'Use', () => { this.game.events.emit(EventKeys.UI_ACTION, EventKeys.CONSUME_ITEM, itemName); this.inventoryModal.setVisible(false); this.scene.resume('MainScene'); }, { width: 60, height: 30, color: 0x228B22 }); this.inventoryModal.add(useButton); this.inventoryButtons.push(useButton); } currentY += 60; }); this.inventoryModal.setVisible(true); this.scene.pause('MainScene'); }
    openAncestorModal(ancestorData) { this.closeAllModals(); if (!ancestorData) return; const advice = NarrativeSystem.getAdvice(ancestorData.dominantArchetype); const text = `Name: Generation ${ancestorData.generation}\nArchetype: ${ancestorData.dominantArchetype}\nCareer: ${ancestorData.currentCareer || 'None'}\n\nStats:\nHappiness: ${Math.floor(ancestorData.stats.happiness)}\nLogic: ${ancestorData.skills.logic.toFixed(1)}\nEmpathy: ${ancestorData.skills.empathy.toFixed(1)}\n\nAdvice:\n"${advice}"`; this.ancestorModal.content.setText(text); this.ancestorModal.setVisible(true); this.scene.pause('MainScene'); }
    async openAchievementsModal() { this.closeAllModals(); const data = await this.persistence.loadAchievements(); const unlockedIds = data.unlocked || []; const text = Achievements.map(ach => unlockedIds.includes(ach.id) ? `${ach.icon} ${ach.name}\n${ach.description}` : `🔒 ${ach.name}\n(Locked)`).join('\n\n'); this.achievementsModal.content.setText(text); this.achievementsModal.setVisible(true); this.scene.pause('MainScene'); }
    startTutorial() {
        this.closeAllModals();
        this.scene.pause('MainScene');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const container = this.add.container(width / 2, height / 2).setDepth(1000);
        const bg = this.add.rectangle(0, 0, 400, 250, 0x000000, 0.9).setStrokeStyle(2, 0xffffff).setInteractive();
        const title = this.add.text(0, -80, "Welcome to Nadagotchi!", { fontFamily: 'VT323', fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        const content = this.add.text(0, -20, "Would you like a quick tour\nof the interface?", { fontFamily: 'VT323', fontSize: '24px', color: '#fff', align: 'center' }).setOrigin(0.5);

        const yesBtn = ButtonFactory.createButton(this, -60, 80, "Yes", () => {
            container.destroy();
            this.runTutorialSequence();
        }, { width: 100, height: 40, color: 0x4CAF50 });

        const noBtn = ButtonFactory.createButton(this, 60, 80, "No", () => {
            container.destroy();
            this.scene.resume('MainScene');
        }, { width: 100, height: 40, color: 0x808080 });

        container.add([bg, title, content, yesBtn, noBtn]);
    }

    runTutorialSequence() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const dashboardHeight = Math.floor(height * Config.UI.DASHBOARD_HEIGHT_RATIO);
        const dashboardY = height - dashboardHeight;

        const overlay = this.add.container(0, 0).setDepth(2000);
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();
        overlay.add(dim);

        const steps = [
            {
                text: "These are your pet's STATS.\nKeep an eye on Hunger and Energy!",
                highlight: { x: 5, y: 5, w: 320, h: 220 }
            },
            {
                text: "These TABS let you switch between\nCare, Actions, and Systems.",
                highlight: { x: 5, y: dashboardY + 5, w: width - 10, h: 45 }
            },
            {
                text: "Finally, these are ACTION buttons.\nThis is how you interact with the world!",
                highlight: { x: 5, y: dashboardY + 50, w: width - 10, h: dashboardHeight - 55 }
            }
        ];

        let currentStep = 0;

        const msgBox = this.add.container(width / 2, height / 2);
        const msgBg = this.add.rectangle(0, 0, 500, 120, 0x333333, 0.9).setStrokeStyle(2, 0xffffff);
        const msgText = this.add.text(0, -10, "", { fontFamily: 'VT323', fontSize: '24px', color: '#fff', align: 'center', wordWrap: { width: 450 } }).setOrigin(0.5);
        const hintText = this.add.text(0, 40, "(Click anywhere to continue)", { fontFamily: 'VT323', fontSize: '18px', color: '#aaa' }).setOrigin(0.5);
        msgBox.add([msgBg, msgText, hintText]);
        overlay.add(msgBox);

        const highlightGraphic = this.add.graphics();
        overlay.add(highlightGraphic);

        const showStep = (idx) => {
            if (idx >= steps.length) {
                overlay.destroy();
                this.scene.resume('MainScene');
                return;
            }

            const step = steps[idx];
            msgText.setText(step.text);

            highlightGraphic.clear();
            highlightGraphic.lineStyle(4, 0xffff00, 1);
            highlightGraphic.strokeRect(step.highlight.x, step.highlight.y, step.highlight.w, step.highlight.h);

            // Move message box if it overlaps with highlight
            if (idx === 0) msgBox.setPosition(width / 2, height * 0.7);
            else msgBox.setPosition(width / 2, height * 0.3);
        };

        dim.on('pointerdown', () => {
            currentStep++;
            showStep(currentStep);
        });

        showStep(currentStep);
    }

    handleAchievementUnlocked(achievement) { SoundSynthesizer.instance.playChime(); this.showToast("Achievement Unlocked!", achievement.name, achievement.icon); }
    showToast(title, message, icon = '') { const width = this.cameras.main.width; const toastWidth = 300, toastHeight = 80; const container = this.add.container(width / 2 - toastWidth / 2, -toastHeight - 20); const bg = this.add.rectangle(0, 0, toastWidth, toastHeight, 0xFFD700).setOrigin(0).setStrokeStyle(2, 0xFFFFFF); const iconText = this.add.text(10, 15, icon, { fontSize: '40px' }); const titleText = this.add.text(70, 10, title, { fontSize: '16px', color: '#000', fontStyle: 'bold', fontFamily: 'VT323' }); const msgText = this.add.text(70, 35, message, { fontSize: '24px', color: '#000', fontFamily: 'VT323' }); container.add([bg, iconText, titleText, msgText]); this.tweens.add({ targets: container, y: 20, duration: 500, ease: 'Back.out', hold: 3000, yoyo: true, onComplete: () => container.destroy() }); }
    createSettingsModal() { const modal = this.createModal("Settings"); const h = 400; const volLabel = this.add.text(0, -80, "Volume", { fontSize: '24px', fontFamily: 'VT323', monospace: true }).setOrigin(0.5); const volDown = ButtonFactory.createButton(this, -80, -40, "-", () => { const newVol = Math.max(0, (this.settingsData?.volume ?? 0.5) - 0.1); this.game.events.emit(EventKeys.UPDATE_SETTINGS, { volume: newVol }); this.settingsModal.volDisplay.setText(`${Math.round(newVol * 100)}%`); if (!this.settingsData) this.settingsData = {}; this.settingsData.volume = newVol; }, { width: 40, height: 40, color: 0x808080 }); const volUp = ButtonFactory.createButton(this, 80, -40, "+", () => { const newVol = Math.min(1, (this.settingsData?.volume ?? 0.5) + 0.1); this.game.events.emit(EventKeys.UPDATE_SETTINGS, { volume: newVol }); this.settingsModal.volDisplay.setText(`${Math.round(newVol * 100)}%`); if (!this.settingsData) this.settingsData = {}; this.settingsData.volume = newVol; }, { width: 40, height: 40, color: 0x808080 }); const volDisplay = this.add.text(0, -40, "50%", { fontSize: '24px', fontFamily: 'VT323' }).setOrigin(0.5); const speedLabel = this.add.text(0, 20, "Game Speed", { fontSize: '24px', fontFamily: 'VT323' }).setOrigin(0.5); const speedButtons = []; const speeds = [{ l: "1x", v: Config.SETTINGS.SPEED_MULTIPLIERS.NORMAL }, { l: "2x", v: Config.SETTINGS.SPEED_MULTIPLIERS.FAST }, { l: "5x", v: Config.SETTINGS.SPEED_MULTIPLIERS.HYPER }]; let startX = -80; speeds.forEach(s => { const btn = ButtonFactory.createButton(this, startX, 60, s.l, () => { this.game.events.emit(EventKeys.UPDATE_SETTINGS, { gameSpeed: s.v }); this.updateSpeedButtons(s.v); if (!this.settingsData) this.settingsData = {}; this.settingsData.gameSpeed = s.v; }, { width: 60, height: 40, fontSize: '20px', color: 0x008080 }); btn.speedVal = s.v; speedButtons.push(btn); startX += 80; }); modal.add([volLabel, volDown, volUp, volDisplay, speedLabel, ...speedButtons]); modal.volDisplay = volDisplay; modal.speedButtons = speedButtons; return modal; }
    updateSpeedButtons(speed) { this.settingsModal.speedButtons.forEach(btn => { if (Math.abs(btn.speedVal - speed) < 0.01) { btn.setAlpha(1); btn.setScale(1.1); } else { btn.setAlpha(0.6); btn.setScale(1.0); } }); }
    openSettingsMenu() { this.closeAllModals(); if (!this.settingsData) this.settingsData = { volume: Config.SETTINGS.DEFAULT_VOLUME, gameSpeed: Config.SETTINGS.DEFAULT_SPEED }; const vol = Math.round((this.settingsData.volume ?? 0.5) * 100); this.settingsModal.volDisplay.setText(`${vol}%`); this.updateSpeedButtons(this.settingsData.gameSpeed || 1.0); this.settingsModal.setVisible(true); this.scene.pause('MainScene'); }
    createShowcaseModal() { const modal = this.createModal("Pet Passport"); const passportContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2); modal.add(passportContainer); modal.passportContainer = passportContainer; return modal; }
    openShowcase() { this.closeAllModals(); if (!this.nadagotchiData) return; const container = this.showcaseModal.passportContainer; container.removeAll(true); const width = 400; const height = 250; const cardBg = this.add.rectangle(0, 0, width, height, 0xFFF8E7).setStrokeStyle(4, 0xD4AF37); const frame = Config.MOOD_VISUALS.FRAMES[this.nadagotchiData.mood] ?? Config.MOOD_VISUALS.DEFAULT_FRAME; const sprite = this.add.image(-120, 0, 'pet', frame).setScale(8); const name = `Archetype: ${this.nadagotchiData.dominantArchetype}`; const gen = `Generation: ${this.nadagotchiData.generation || 1}`; const career = `Career: ${this.nadagotchiData.currentCareer || 'Unemployed'}`; const age = `Age: ${Math.floor(this.nadagotchiData.age || 0)} Days`; const infoText = this.add.text(0, -60, `${name}\n${gen}\n${career}\n${age}`, { fontFamily: 'VT323, monospace', fontSize: '24px', color: '#000000', lineSpacing: 10 }).setOrigin(0, 0); const footer = this.add.text(0, 80, "OFFICIAL NADAGOTCHI PASSPORT", { fontFamily: 'Arial', fontSize: '12px', color: '#888888', fontStyle: 'italic' }).setOrigin(0.5); container.add([cardBg, sprite, infoText, footer]); this.showcaseModal.setVisible(true); this.scene.pause('MainScene'); }
    openCareerMenu() { this.closeAllModals(); if (!this.nadagotchiData) return; const container = this.careerModal; if (this.careerDynamicItems) { this.careerDynamicItems.forEach(i => i.destroy()); } this.careerDynamicItems = []; const mw = this.getModalWidth(); const mh = this.getModalHeight(); let yPos = -mh / 2 + 80; const career = this.nadagotchiData.currentCareer; let infoText = ""; if (career) { const level = this.nadagotchiData.careerLevels[career] || 1; const xp = this.nadagotchiData.careerXP[career] || 0; const title = CareerDefinitions.TITLES[career] ? CareerDefinitions.TITLES[career][level] : 'Employee'; const nextThreshold = CareerDefinitions.XP_THRESHOLDS[level + 1] || 'MAX'; const payBonus = (Config.CAREER.LEVEL_MULTIPLIERS[level] - 1) * 100; infoText = `Current Job: ${career}\nTitle: ${title} (Lvl ${level})\nXP: ${xp} / ${nextThreshold}\nBonuses: +${Math.round(payBonus)}% Efficiency`; } else { infoText = "No Active Career.\nStudy or Explore to unlock paths!"; } const statsText = this.add.text(0, yPos, infoText, { fontFamily: 'VT323, monospace', fontSize: '24px', color: '#ffffff', align: 'center', wordWrap: { width: mw - 60 } }).setOrigin(0.5, 0); container.add(statsText); this.careerDynamicItems.push(statsText); yPos += 140; const listTitle = this.add.text(0, yPos, "Unlocked Career Paths:", { fontFamily: 'VT323', fontSize: '20px', color: '#AAAAAA' }).setOrigin(0.5); container.add(listTitle); this.careerDynamicItems.push(listTitle); yPos += 30; const unlocked = this.nadagotchiData.unlockedCareers || []; if (unlocked.length === 0) { const noneText = this.add.text(0, yPos, "(None yet)", { fontFamily: 'VT323', fontSize: '18px', color: '#888' }).setOrigin(0.5); container.add(noneText); this.careerDynamicItems.push(noneText); } else { unlocked.forEach(c => { const isCurrent = c === career; const lvl = this.nadagotchiData.careerLevels[c] || 1; const label = `${c} (Lvl ${lvl})`; const rowText = this.add.text(-mw/2 + 60, yPos + 10, label, { fontFamily: 'VT323', fontSize: '24px', color: isCurrent ? '#00FF00' : '#FFF' }); container.add(rowText); this.careerDynamicItems.push(rowText); if (!isCurrent) { const switchBtn = ButtonFactory.createButton(this, mw/2 - 80, yPos + 20, "Switch", () => { this.game.events.emit(EventKeys.UI_ACTION, EventKeys.SWITCH_CAREER, c); container.setVisible(false); this.scene.resume('MainScene'); }, { width: 80, height: 30, color: 0x4CAF50, fontSize: '18px' }); container.add(switchBtn); this.careerDynamicItems.push(switchBtn); } else { const activeLbl = this.add.text(mw/2 - 80, yPos + 10, "[Active]", { fontFamily: 'VT323', fontSize: '18px', color: '#00FF00' }); container.add(activeLbl); this.careerDynamicItems.push(activeLbl); } yPos += 45; }); } container.setVisible(true); this.scene.pause('MainScene'); }
    openJobBoardMenu() { this.closeAllModals(); if (!this.nadagotchiData) return; const container = this.jobBoardModal; if (this.jobBoardDynamicItems) { this.jobBoardDynamicItems.forEach(i => i.destroy()); } this.jobBoardDynamicItems = []; const career = this.nadagotchiData.currentCareer; let text = ""; if (career) { text = `Active Assignment:\n${career}`; } else { text = "No Active Career Assignment."; } const infoText = this.add.text(0, -50, text, { fontFamily: 'VT323', fontSize: '32px', color: '#FFF', align: 'center' }).setOrigin(0.5); container.add(infoText); this.jobBoardDynamicItems.push(infoText); const startBtn = ButtonFactory.createButton(this, 0, 30, "Start Shift", () => { if (career) { this.game.events.emit(EventKeys.UI_ACTION, EventKeys.WORK); container.setVisible(false); } else { this.showToast("No Job", "Select a career first!", "🚫"); } }, { width: 160, height: 50, color: career ? 0x6A0DAD : 0x555555, fontSize: '24px' }); if (!career) startBtn.setDisabled(true); container.add(startBtn); this.jobBoardDynamicItems.push(startBtn); const careerBtn = ButtonFactory.createButton(this, 0, 100, "Career Profiles", () => { this.openCareerMenu(); }, { width: 160, height: 40, color: 0xD8A373, fontSize: '20px' }); container.add(careerBtn); this.jobBoardDynamicItems.push(careerBtn); container.setVisible(true); this.scene.pause('MainScene'); }
}
