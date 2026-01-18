import { ButtonFactory } from './ButtonFactory.js';
import { ExpeditionSystem } from './systems/ExpeditionSystem.js';
import { EventKeys } from './EventKeys.js';
import { SoundSynthesizer } from './utils/SoundSynthesizer.js';

/**
 * @class ExpeditionScene
 * @extends Phaser.Scene
 * @classdesc
 * Handles the visual presentation and interaction of the "Expedition" minigame.
 * Now features a Visual Node Map and Quick Time Events (QTEs).
 */
export class ExpeditionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExpeditionScene' });
    }

    init(data) {
        this.pet = data.nadagotchi;
        this.season = this.pet.currentSeason || 'Spring';
        this.weather = data.weather || 'Sunny';
        this.biome = data.biome || 'Forest';

        // Initialize System
        this.system = new ExpeditionSystem(this.pet.rng);

        // Generate Path (Nodes)
        // We'll generate a simple tree: Start -> [Choice A/B] -> [Choice C/D] -> Boss/End
        this.nodeTree = this.generateNodeMap(3); // 3 layers
        this.currentNode = this.nodeTree[0][0]; // Start node
        this.currentLayer = 0;

        this.loot = {};
        this.xpGained = 0;
        this.inMapMode = true; // Map vs Encounter
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a2b1a');

        this.headerText = this.add.text(400, 40, "EXPEDITION MAP", {
            fontFamily: 'VT323', fontSize: '32px', color: '#88DDAA'
        }).setOrigin(0.5);

        // Container for Map Visualization
        this.mapContainer = this.add.container(0, 0);

        // Container for Encounter/Event
        this.encounterContainer = this.add.container(0, 0).setVisible(false);

        this.renderMap();
    }

    generateNodeMap(layers) {
        // Simplified generation:
        // Layer 0: 1 Node (Start)
        // Layer 1: 2 Nodes
        // Layer 2: 3 Nodes
        // Layer 3: 1 Node (End)

        const tree = [];
        // Layer 0
        tree.push([{ id: 'start', type: 'START', label: 'Entrance', x: 400, y: 500, connections: [0, 1] }]);

        // Layer 1
        tree.push([
            { id: 'l1_0', type: 'EVENT', label: 'Overgrown Path', x: 250, y: 350, connections: [0, 1] },
            { id: 'l1_1', type: 'LOOT', label: 'Berry Bush', x: 550, y: 350, connections: [1, 2] }
        ]);

        // Layer 2
        tree.push([
            { id: 'l2_0', type: 'COMBAT', label: 'Wolf Den', x: 200, y: 200, connections: [0] },
            { id: 'l2_1', type: 'EVENT', label: 'Ancient Ruins', x: 400, y: 200, connections: [0] },
            { id: 'l2_2', type: 'LOOT', label: 'Hidden Cache', x: 600, y: 200, connections: [0] }
        ]);

        // Layer 3 (End)
        tree.push([
            { id: 'end', type: 'BOSS', label: 'Glade Heart', x: 400, y: 80, connections: [] }
        ]);

        return tree;
    }

    renderMap() {
        this.mapContainer.removeAll(true);
        this.headerText.setText("SELECT PATH");

        // Draw Lines first
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x555555);
        this.mapContainer.add(graphics);

        // Draw Nodes
        this.nodeTree.forEach((layer, layerIdx) => {
            layer.forEach((node, nodeIdx) => {
                // Connections (Forward)
                if (node.connections) {
                    const nextLayer = this.nodeTree[layerIdx + 1];
                    if (nextLayer) {
                        node.connections.forEach(targetIdx => {
                            if (nextLayer[targetIdx]) {
                                graphics.lineBetween(node.x, node.y, nextLayer[targetIdx].x, nextLayer[targetIdx].y);
                            }
                        });
                    }
                }

                // Node Visual
                const color = this.getNodeColor(node.type);
                const circle = this.add.circle(node.x, node.y, 25, color).setStrokeStyle(2, 0xFFFFFF);
                const label = this.add.text(node.x, node.y + 35, node.label, { fontSize: '16px', fontFamily: 'VT323' }).setOrigin(0.5);

                this.mapContainer.add([circle, label]);

                // Interactive logic: Only nodes in next layer connected to current node are clickable
                // Or if currentLayer is -1 (just started).
                // Simplified: Allow clicking any node in (currentLayer + 1)

                const isNext = layerIdx === this.currentLayer + 1;
                const isCurrent = (node === this.currentNode);
                const isPast = layerIdx <= this.currentLayer && !isCurrent;

                if (isCurrent) {
                    circle.setStrokeStyle(4, 0x00FF00); // Highlight current
                } else if (isPast) {
                    circle.setFillStyle(0x333333); // Dim past
                } else if (isNext) {
                    circle.setInteractive({ useHandCursor: true });
                    // Pulse animation
                    this.tweens.add({ targets: circle, scale: 1.1, duration: 800, yoyo: true, repeat: -1 });

                    circle.on('pointerdown', () => {
                        this.travelTo(node, layerIdx);
                    });
                } else {
                    circle.setAlpha(0.5); // Future nodes dimmed
                }
            });
        });
    }

    getNodeColor(type) {
        switch(type) {
            case 'START': return 0xFFFFFF;
            case 'LOOT': return 0xFFD700; // Gold
            case 'EVENT': return 0x00FFFF; // Cyan
            case 'COMBAT': return 0xFF0000; // Red
            case 'BOSS': return 0x800080; // Purple
            default: return 0xAAAAAA;
        }
    }

    travelTo(node, layerIdx) {
        this.currentNode = node;
        this.currentLayer = layerIdx;
        this.renderMap(); // Update visual state

        // Trigger Encounter
        this.time.delayedCall(500, () => {
            this.startEncounter(node);
        });
    }

    startEncounter(node) {
        this.mapContainer.setVisible(false);
        this.encounterContainer.setVisible(true);
        this.encounterContainer.removeAll(true);
        this.headerText.setText(node.label.toUpperCase());

        // Background
        const bg = this.add.rectangle(400, 300, 600, 400, 0x222222).setStrokeStyle(2, this.getNodeColor(node.type));
        this.encounterContainer.add(bg);

        // Content based on Type
        if (node.type === 'LOOT') {
            this.showLootEncounter();
        } else if (node.type === 'EVENT' || node.type === 'COMBAT' || node.type === 'BOSS') {
            this.showQTEEncounter(node.type);
        } else if (node.type === 'START') {
            // Should not happen as we start here
        }
    }

    showLootEncounter() {
        const text = this.add.text(400, 200, "You found something!", { fontSize: '24px', fontFamily: 'VT323' }).setOrigin(0.5);

        // Random loot
        const items = ['Berries', 'Sticks', 'Shiny Stone'];
        const item = Phaser.Math.RND.pick(items);
        const qty = Phaser.Math.Between(1, 3);

        const lootText = this.add.text(400, 300, `+ ${qty} ${item}`, { fontSize: '40px', color: '#FFD700' }).setOrigin(0.5);

        this.loot[item] = (this.loot[item] || 0) + qty;

        const btn = ButtonFactory.createButton(this, 400, 400, "Continue", () => {
            this.returnToMap();
        }, { width: 150, height: 50 });

        this.encounterContainer.add([text, lootText, btn]);
    }

    showQTEEncounter(type) {
        let instruction = "";
        let qteType = ""; // 'REFLEX' or 'MASH'

        if (type === 'EVENT') {
            instruction = "Dodge the falling branch! (Stop in Green)";
            qteType = 'REFLEX';
        } else {
            instruction = "Fend off the beast! (Mash Space!)";
            qteType = 'MASH';
        }

        const text = this.add.text(400, 150, instruction, { fontSize: '24px', fontFamily: 'VT323' }).setOrigin(0.5);
        this.encounterContainer.add(text);

        if (qteType === 'REFLEX') {
            this.runReflexQTE();
        } else {
            this.runMashQTE();
        }
    }

    runReflexQTE() {
        // Bar
        const barBg = this.add.rectangle(400, 300, 400, 40, 0x555555);
        const targetZone = this.add.rectangle(400 + Phaser.Math.Between(-150, 150), 300, 60, 40, 0x00FF00);
        const cursor = this.add.rectangle(200, 300, 10, 50, 0xFFFFFF); // Start left

        this.encounterContainer.add([barBg, targetZone, cursor]);

        let direction = 1;
        const speed = 8; // px per frame
        let active = true;

        const updateEvent = this.time.addEvent({
            delay: 16, // ~60fps
            loop: true,
            callback: () => {
                if (!active) return;
                cursor.x += speed * direction;
                if (cursor.x > 600 || cursor.x < 200) direction *= -1;
            }
        });

        // Input
        const handleInput = () => {
            if (!active) return;
            active = false;
            updateEvent.remove();

            // Check collision
            const hit = Phaser.Geom.Intersects.RectangleToRectangle(cursor.getBounds(), targetZone.getBounds());
            this.endEncounter(hit);
        };

        this.input.keyboard.once('keydown-SPACE', handleInput);
        this.input.once('pointerdown', handleInput);
    }

    runMashQTE() {
        const barBg = this.add.rectangle(400, 300, 400, 40, 0x555555);
        const fillBar = this.add.rectangle(200, 300, 0, 40, 0xFFA500).setOrigin(0, 0.5); // Orange fill
        this.encounterContainer.add([barBg, fillBar]);

        let progress = 0;
        let active = true;
        const decay = 0.5;

        // Timer
        let timeLeft = 5000; // 5s
        const timerText = this.add.text(400, 250, "5.0", { fontSize: '32px' }).setOrigin(0.5);
        this.encounterContainer.add(timerText);

        const updateEvent = this.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
                if (!active) return;
                timeLeft -= 50;
                timerText.setText((timeLeft/1000).toFixed(1));

                // Decay
                progress = Math.max(0, progress - decay);
                fillBar.width = 4 * progress; // 100 progress = 400 width

                if (timeLeft <= 0) {
                    active = false;
                    updateEvent.remove();
                    this.endEncounter(false);
                }

                if (progress >= 100) {
                    active = false;
                    updateEvent.remove();
                    this.endEncounter(true);
                }
            }
        });

        const handleInput = () => {
            if (!active) return;
            progress += 5; // 20 hits needed without decay
        };

        this.input.keyboard.on('keydown-SPACE', handleInput);
        // this.input.on('pointerdown', handleInput); // Pointer mash is annoying on click

        // Add a visual button for mash
        const mashBtn = ButtonFactory.createButton(this, 400, 400, "MASH!", handleInput, { width: 100, height: 60, color: 0xFF0000 });
        this.encounterContainer.add(mashBtn);
    }

    endEncounter(success) {
        // Cleanup listeners
        this.input.keyboard.off('keydown-SPACE');

        const resultText = this.add.text(400, 350, success ? "SUCCESS!" : "FAILURE...", {
            fontSize: '48px', color: success ? '#00FF00' : '#FF0000', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);
        this.encounterContainer.add(resultText);

        if (success) {
            this.xpGained += 50;
            // Maybe loot too?
        } else {
            // Damage?
            this.pet.stats.energy -= 10;
        }

        const btn = ButtonFactory.createButton(this, 400, 450, "Continue", () => {
            this.returnToMap();
        }, { width: 150, height: 50 });
        this.encounterContainer.add(btn);
    }

    returnToMap() {
        this.encounterContainer.setVisible(false);
        this.mapContainer.setVisible(true);
        this.headerText.setText("EXPEDITION MAP");

        // Check if End
        if (this.currentNode.type === 'BOSS') {
            this.endExpedition();
        }
    }

    endExpedition() {
        this.mapContainer.setVisible(false);
        this.encounterContainer.setVisible(true); // Reuse container for summary
        this.encounterContainer.removeAll(true);
        this.headerText.setText("EXPEDITION COMPLETE");

        const bg = this.add.rectangle(400, 300, 600, 400, 0x222222).setStrokeStyle(2, 0xFFD700);
        this.encounterContainer.add(bg);

        let summary = "Items Gained:\n";
        for (const [k, v] of Object.entries(this.loot)) {
            summary += `- ${k} x${v}\n`;
            this.pet.inventorySystem.addItem(k, v);
        }
        summary += `\nXP Gained: ${this.xpGained}`;

        // Apply XP
        this.pet.skills.navigation += this.xpGained * 0.01;

        const text = this.add.text(400, 250, summary, { fontSize: '24px', fontFamily: 'VT323', align: 'center' }).setOrigin(0.5);

        const btn = ButtonFactory.createButton(this, 400, 450, "Return Home", () => {
             this.game.events.emit(EventKeys.SCENE_COMPLETE, { type: 'EXPEDITION' });
             this.scene.resume('MainScene');
             this.scene.stop();
        }, { width: 200, height: 50, color: 0x4CAF50 });

        this.encounterContainer.add([bg, text, btn]);
    }
}
