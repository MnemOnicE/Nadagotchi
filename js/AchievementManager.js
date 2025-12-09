import { PersistenceManager } from './PersistenceManager.js';
import { EventKeys } from './EventKeys.js';
import { Achievements } from './AchievementData.js';

/**
 * Manages the unlocking and persistence of achievements.
 * Acts as a headless system listening to game events.
 */
export class AchievementManager {
    /**
     * Creates a new AchievementManager.
     * @param {Phaser.Game} game - The Phaser game instance (for event bus access).
     */
    constructor(game) {
        this.game = game;
        this.persistence = new PersistenceManager();
        this.state = this.persistence.loadAchievements();

        // Ensure default structure
        if (!this.state.unlocked) this.state.unlocked = [];
        if (!this.state.progress) this.state.progress = {};

        this.init();
    }

    /**
     * Initializes event listeners.
     */
    init() {
        // Listen to UI Actions to track player behavior
        this.game.events.on(EventKeys.UI_ACTION, this.handleUIAction, this);
        // Listen for Work Results (which can trigger crafting)
        this.game.events.on(EventKeys.WORK_RESULT, this.handleWorkResult, this);
    }

    /**
     * Handles UI Action events to update progress counters.
     * @param {string} actionType - The type of action.
     * @param {*} data - Data associated with the action.
     */
    handleUIAction(actionType, data) {
        let changed = false;

        // Initialize counters if missing
        this._ensureCounter('craftCount');
        this._ensureCounter('exploreCount');
        this._ensureCounter('chatCount');
        this._ensureCounter('studyCount');

        // Update progress based on action
        switch (actionType) {
            case EventKeys.CRAFT_ITEM:
                this.state.progress.craftCount++;
                changed = true;
                break;
            case EventKeys.EXPLORE:
                this.state.progress.exploreCount++;
                changed = true;
                break;
            case EventKeys.STUDY:
                this.state.progress.studyCount++;
                changed = true;
                break;
            default:
                // Check for NPC interactions
                if (typeof actionType === 'string' && actionType.startsWith('INTERACT_') &&
                    !['INTERACT_BOOKSHELF', 'INTERACT_PLANT', 'INTERACT_FANCY_BOOKSHELF'].includes(actionType)) {
                    this.state.progress.chatCount++;
                    changed = true;
                }
                break;
        }

        if (changed) {
            this.checkAchievements();
            this.persistence.saveAchievements(this.state);
        }
    }

    /**
     * Handles Work Result events.
     * @param {object} data - Result data from minigames.
     */
    handleWorkResult(data) {
        if (data.success && data.craftedItem) {
            this._ensureCounter('craftCount');
            this.state.progress.craftCount++;
            this.checkAchievements();
            this.persistence.saveAchievements(this.state);
        }
    }

    /**
     * Checks all achievements against current progress.
     */
    checkAchievements() {
        Achievements.forEach(achievement => {
            if (!this.state.unlocked.includes(achievement.id)) {
                if (achievement.condition(this.state.progress)) {
                    this.unlock(achievement);
                }
            }
        });
    }

    /**
     * Unlocks an achievement and notifies the game.
     * @param {object} achievement - The achievement object to unlock.
     */
    unlock(achievement) {
        this.state.unlocked.push(achievement.id);
        // Emit event for UI to pick up
        this.game.events.emit(EventKeys.ACHIEVEMENT_UNLOCKED, achievement);
        this.persistence.saveAchievements(this.state);
        // Console log for debug/headless verification
        console.log(`[AchievementManager] Unlocked: ${achievement.name}`);
    }

    /**
     * Helper to ensure a progress counter exists.
     * @param {string} key - The counter key.
     * @private
     */
    _ensureCounter(key) {
        if (typeof this.state.progress[key] !== 'number') {
            this.state.progress[key] = 0;
        }
    }
}
