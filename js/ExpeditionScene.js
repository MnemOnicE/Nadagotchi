// Manual Override: Patch Applied.
import { ButtonFactory } from './ButtonFactory.js';
import { ExpeditionSystem } from './systems/ExpeditionSystem.js';
import { EventKeys } from './EventKeys.js';

/**
 * @class ExpeditionScene
 * @extends Phaser.Scene
 * @classdesc
 * Handles the visual presentation and interaction of the "Expedition" minigame.
 * Displays nodes, handles choices, and shows results.
 */
export class ExpeditionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExpeditionScene' });
    }

    init(data) {
        this.pet = data.nadagotchi; // Reference to the pet
        this.season = this.pet.currentSeason || 'Spring';
        this.weather = data.weather || 'Sunny';

        // Initialize System
        this.system = new ExpeditionSystem(this.pet.rng);

        // Generate Path
        this.path = this.system.generatePath(this.season, this.weather, 3);
        this.currentIndex = 0;
        this.loot = {};
        this.xpGained = 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background (Darker overlay)
        this.add.rectangle(0, 0, width, height, 0x1a2b1a).setOrigin(0);

        // Header
        this.add.text(width / 2, 50, "WILDERNESS EXPEDITION", {
            fontFamily: 'VT323, monospace', fontSize: '48px', color: '#88DDAA'
        }).setOrigin(0.5);

        // Content Area Container
        this.contentContainer = this.add.container(width / 2, height / 2);

        // Start Logic
        if (this.path.length === 0) {
            this.showSummary(); // Should not happen usually
        } else {
            this.showNode(this.path[this.currentIndex]);
        }
    }

    showNode(node) {
        this.contentContainer.removeAll(true);
        const w = 600;
        const h = 400;

        // Panel Background
        const bg = this.add.rectangle(0, 0, w, h, 0x2e3b2e).setStrokeStyle(2, 0x88DDAA);
        this.contentContainer.add(bg);

        // Step Counter
        const counter = this.add.text(0, -h/2 + 30, `Step ${this.currentIndex + 1} / ${this.path.length}`, {
            fontFamily: 'VT323', fontSize: '24px', color: '#AAAAAA'
        }).setOrigin(0.5);
        this.contentContainer.add(counter);

        // Description
        const desc = this.add.text(0, -50, node.description, {
            fontFamily: 'VT323', fontSize: '32px', color: '#FFFFFF', align: 'center', wordWrap: { width: w - 40 }
        }).setOrigin(0.5);
        this.contentContainer.add(desc);

        // Choices
        let yPos = 80;
        node.choices.forEach(choice => {
            let label = choice.text;
            if (choice.skill) {
                const chance = this.pet.skills[choice.skill] || 0;
                // Optional: Show hint about chance? " (Logic: 3)"
                label += ` [${choice.skill}: ${Math.floor(chance)}]`;
            }

            const btn = ButtonFactory.createButton(this, 0, yPos, label, () => {
                this.handleChoice(choice);
            }, { width: 400, height: 50, color: 0x446644, fontSize: '24px' });

            this.contentContainer.add(btn);
            yPos += 70;
        });
    }

    handleChoice(choice) {
        const result = this.system.resolveChoice(choice, this.pet);
        this.showResult(result.details, result.outcome);
    }

    showResult(details, outcome) {
        this.contentContainer.removeAll(true);
        const w = 600;
        const h = 400;

        const bg = this.add.rectangle(0, 0, w, h, 0x2e3b2e).setStrokeStyle(2, outcome === 'success' ? 0x00FF00 : 0xFF0000);
        this.contentContainer.add(bg);

        const title = this.add.text(0, -h/2 + 40, outcome === 'success' ? "SUCCESS!" : "FAILURE...", {
            fontFamily: 'VT323', fontSize: '40px', color: outcome === 'success' ? '#00FF00' : '#FF0000'
        }).setOrigin(0.5);
        this.contentContainer.add(title);

        const text = this.add.text(0, -20, details.text, {
            fontFamily: 'VT323', fontSize: '28px', color: '#FFFFFF', align: 'center', wordWrap: { width: w - 40 }
        }).setOrigin(0.5);
        this.contentContainer.add(text);

        // Apply Rewards Logic Temporary (Accumulate)
        if (details.items) {
            for (const [item, qty] of Object.entries(details.items)) {
                this.loot[item] = (this.loot[item] || 0) + qty;
            }
        }
        if (details.xp) {
            this.xpGained += details.xp;
        }
        // Direct Stat Application (Instant for now)
        if (details.stats) {
            for (const [stat, val] of Object.entries(details.stats)) {
                if (stat === 'happiness') this.pet.stats.happiness += val;
                if (stat === 'energy') this.pet.stats.energy += val;
                if (stat === 'cleanliness') { /* No cleanliness stat yet, ignore */ }
            }
            // Clamp stats
            this.pet.stats.happiness = Math.max(0, Math.min(this.pet.maxStats.happiness, this.pet.stats.happiness));
            this.pet.stats.energy = Math.max(0, Math.min(this.pet.maxStats.energy, this.pet.stats.energy));
        }

        const nextBtn = ButtonFactory.createButton(this, 0, 100, "Continue", () => {
            this.currentIndex++;
            if (this.currentIndex < this.path.length) {
                this.showNode(this.path[this.currentIndex]);
            } else {
                this.showSummary();
            }
        }, { width: 200, height: 50, color: 0xD8A373 });
        this.contentContainer.add(nextBtn);
    }

    showSummary() {
        this.contentContainer.removeAll(true);
        const w = 600;
        const h = 400;

        const bg = this.add.rectangle(0, 0, w, h, 0x2e3b2e).setStrokeStyle(2, 0xFFD700);
        this.contentContainer.add(bg);

        this.add.text(0, -h/2 + 40, "EXPEDITION COMPLETE", {
            fontFamily: 'VT323', fontSize: '40px', color: '#FFD700'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1).addToDisplayList(this.contentContainer); // Helper to add to container? No, just add

        const title = this.add.text(0, -h/2 + 40, "EXPEDITION COMPLETE", {
            fontFamily: 'VT323', fontSize: '40px', color: '#FFD700'
        }).setOrigin(0.5);
        this.contentContainer.add(title);

        let summaryText = "You returned home.\n\nLoot Gained:\n";
        const items = Object.entries(this.loot);
        if (items.length === 0) summaryText += "- Nothing...\n";
        items.forEach(([item, qty]) => {
            summaryText += `- ${item} x${qty}\n`;
            // Actually add to pet inventory
            this.pet.inventorySystem.addItem(item, qty);
        });

        // XP? Assuming general skill gain or just mechanic fun.
        // Let's add the XP to Navigation skill for now as a catch-all
        if (this.xpGained > 0) {
             this.pet.skills.navigation += (this.xpGained * 0.01);
             summaryText += `\nNavigation Skill +${(this.xpGained * 0.01).toFixed(2)}`;
        }

        const text = this.add.text(0, 0, summaryText, {
            fontFamily: 'VT323', fontSize: '24px', color: '#FFFFFF', align: 'center'
        }).setOrigin(0.5);
        this.contentContainer.add(text);

        const homeBtn = ButtonFactory.createButton(this, 0, 150, "Return Home", () => {
             this.game.events.emit(EventKeys.SCENE_COMPLETE, { type: 'EXPEDITION' });
             this.scene.stop();
             this.scene.resume('MainScene');
        }, { width: 200, height: 50, color: 0x4CAF50 });
        this.contentContainer.add(homeBtn);
    }
}
