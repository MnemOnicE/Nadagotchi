import { EventKeys } from './EventKeys.js';
import { Config } from './Config.js';
import { ItemDefinitions } from './ItemData.js';

export class DebugConsole {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.fpsUpdateInterval = 500;
        this.lastFpsUpdate = 0;
        this.createDOM();

        // Start FPS loop
        this.scene.events.on('update', this.updateFPS, this);
    }

    createDOM() {
        this.container = document.createElement('div');
        this.container.id = 'debug-console';
        // Style it to look like a hacking terminal or raw dev tool
        // Added top padding to account for safe area just in case, though it's an overlay
        this.container.style.cssText = `
            display: none; position: fixed; top: 5%; left: 5%; width: 90%; height: 90%;
            background: rgba(0, 0, 0, 0.90); border: 2px solid #00FF00; color: #00FF00;
            z-index: 5000; overflow-y: scroll; padding: 10px; font-family: monospace;
            box-sizing: border-box; box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        `;

        // Header Row
        const headerRow = document.createElement('div');
        headerRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00FF00; padding-bottom: 10px; margin-bottom: 10px;";

        const title = document.createElement('h2');
        title.innerText = "NADAGOTCHI DEBUG TERMINAL";
        title.style.margin = "0";
        headerRow.appendChild(title);

        // Add Close Button
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "[X] CLOSE";
        closeBtn.style.cssText = "color: red; background: black; border: 1px solid red; padding: 5px 10px; font-family: monospace; font-weight: bold; cursor: pointer;";
        closeBtn.onclick = () => this.toggle();
        headerRow.appendChild(closeBtn);

        this.container.appendChild(headerRow);

        // FPS Counter in Console
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.innerText = "FPS: -- | Delta: --";
        this.fpsDisplay.style.marginBottom = "10px";
        this.container.appendChild(this.fpsDisplay);

        // Add Content Area
        this.content = document.createElement('div');
        this.container.appendChild(this.content);

        // --- SECTIONS ---

        this.addSection("Vitals", [
            { label: "Fill Stats (100)", action: () => this.modifyStats(100, 100, 100) },
            { label: "Starve (Hunger 0)", action: () => this.modifyStats(0, null, null) },
            { label: "Exhaust (Energy 0)", action: () => this.modifyStats(null, 0, null) },
            { label: "Depress (Happy 0)", action: () => this.modifyStats(null, null, 0) },
        ]);

        this.addSection("World Time", [
            { label: "+1 Hour", action: () => { this.scene.worldClock.update(3600 * 1000); this.refreshGame(); } },
            { label: "Next Day", action: () => { this.scene.calendar.advanceDay(); this.refreshGame(); } },
            { label: "Speed: 1x", action: () => this.setSpeed(1.0) },
            { label: "Speed: 10x", action: () => this.setSpeed(10.0) },
            { label: "Speed: 50x", action: () => this.setSpeed(50.0) },
        ]);

        this.addSection("Weather & Events", [
            { label: "Force Rain", action: () => this.scene.weatherSystem.setWeather('Rainy') },
            { label: "Force Storm", action: () => this.scene.weatherSystem.setWeather('Stormy') },
            { label: "Force Sun", action: () => this.scene.weatherSystem.setWeather('Sunny') },
            { label: "Spawn Merchant", action: () => this.forceEvent('TravelingMerchant') },
        ]);

        this.addSection("Inventory God Mode", [
            { label: "+10 All Items", action: () => this.addAllItems() },
            { label: "Clear Inventory", action: () => this.clearInventory() },
            { label: "Unlock All Careers", action: () => { this.scene.nadagotchi.unlockAllCareers(); this.refreshGame(); } },
            { label: "+1000 Coins (Placeholder)", action: () => { this.showToast("Not Implemented", "No currency system yet!", "💰"); console.log("Currency system pending implementation."); } }
        ]);

        this.addSection("Debug Tools", [
            { label: "Toggle Hitbox Bounds", action: () => this.toggleBounds() },
            { label: "Simulate Background Resume (8hr)", action: () => this.simulateBackgroundResume() },
            { label: "Export Save (Clipboard)", action: () => this.exportSave() },
            { label: "Hard Reset (Wipe Save)", action: () => { if(confirm("Delete all data?")) { localStorage.clear(); location.reload(); } } }
        ]);

        document.body.appendChild(this.container);
    }

    addSection(title, buttons) {
        const header = document.createElement('h3');
        header.innerText = `> ${title}`;
        header.style.borderBottom = "1px solid #004400";
        header.style.color = "#88FF88";
        header.style.marginTop = "15px";
        this.content.appendChild(header);

        const btnContainer = document.createElement('div');
        btnContainer.style.display = "flex";
        btnContainer.style.flexWrap = "wrap";
        btnContainer.style.marginBottom = "10px";

        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.innerText = btn.label;
            b.style.cssText = "margin: 4px; padding: 8px 12px; background: #111; color: #00FF00; border: 1px solid #005500; font-family: monospace; cursor: pointer;";
            b.onmouseover = () => { b.style.background = "#003300"; };
            b.onmouseout = () => { b.style.background = "#111"; };

            b.onclick = () => {
                try {
                    btn.action();
                    console.log(`[DEBUG] Executed: ${btn.label}`);
                    // Flash button
                    b.style.background = "#00FF00";
                    b.style.color = "#000";
                    setTimeout(() => {
                        b.style.background = "#111";
                        b.style.color = "#00FF00";
                    }, 200);
                } catch(e) {
                    alert("Debug Cmd Failed: " + e.message);
                    console.error(e);
                }
            };
            btnContainer.appendChild(b);
        });
        this.content.appendChild(btnContainer);
    }

    modifyStats(hunger, energy, happiness) {
        if (hunger !== null) this.scene.nadagotchi.stats.hunger = hunger;
        if (energy !== null) this.scene.nadagotchi.stats.energy = energy;
        if (happiness !== null) this.scene.nadagotchi.stats.happiness = happiness;
        this.refreshGame();
    }

    setSpeed(mult) {
        this.scene.gameSettings.gameSpeed = mult;
        this.scene.game.events.emit(EventKeys.UPDATE_SETTINGS, { gameSpeed: mult });
    }

    addAllItems() {
        Object.keys(ItemDefinitions).forEach(key => {
            this.scene.nadagotchi.inventorySystem.addItem(key, 10);
        });
        this.refreshGame();
        this.showToast("Added Items", "Added 10 of every item.", "🎒");
    }

    clearInventory() {
        this.scene.nadagotchi.inventory = {};
        this.refreshGame();
    }

    forceEvent(eventName) {
        // Rudimentary force: Set active event in manager if possible, or trigger logic
        // Since EventManager might not have a direct 'force' method exposed, we might need to cheat
        // Check EventManager structure from MainScene
        if (this.scene.eventManager) {
             // Mock an event object
             this.scene.eventManager.activeEvent = { name: eventName, timeLeft: 10000 };
             this.scene.checkMerchantVisibility(); // specific handler in MainScene
             this.refreshGame();
        }
    }

    toggleBounds() {
        this.showBounds = !this.showBounds;

        // Custom Furniture Bounds Drawing
        if (this.showBounds) {
             this.debugGraphics = this.scene.add.graphics().setDepth(9999);
        } else {
             if (this.debugGraphics) {
                 this.debugGraphics.clear();
                 this.debugGraphics.destroy();
                 this.debugGraphics = null;
             }
        }
        this.showToast("Bounds Toggled", "Move furniture to see updates.", "🟦");
    }

    simulateBackgroundResume() {
        const hours = 8;
        const ms = hours * 60 * 60 * 1000;
        this.showToast("Time Warp", `Simulating ${hours} hours...`, "⏳");
        // We bypass the cap in MainScene update by calling live directly here?
        // No, we want to test if the cap works OR if the logic handles large deltas.
        // Actually, the user asked to simulate it "to see if your pet survives".
        // If I capped it in MainScene, this test is "safe".
        // If I want to test the RISK, I should call live() directly.

        // Let's invoke the worldClock update logic directly to simulate the catch-up
        this.scene.nadagotchi.live(ms, this.scene.worldState);
        this.scene.worldClock.update(ms);
        this.refreshGame();
    }

    exportSave() {
        const saveString = this.scene.persistence.savePet(this.scene.nadagotchi);
        // savePet might return void and save to LS. Let's grab from LS.
        const raw = localStorage.getItem('nadagotchi_pet_v1'); // Assuming key
        // Also grab salt
        const salt = localStorage.getItem('nadagotchi_dna_salt');

        const dump = JSON.stringify({
            pet: raw ? JSON.parse(raw) : null,
            salt: salt
        }, null, 2);

        navigator.clipboard.writeText(dump).then(() => {
            this.showToast("Exported", "Save data copied to clipboard!", "📋");
        }).catch(err => {
            console.error(err);
            this.showToast("Error", "Clipboard write failed.", "❌");
        });
    }

    refreshGame() {
        // Force UI update event
        const fullState = {
            nadagotchi: this.scene.nadagotchi,
            settings: this.scene.gameSettings,
            world: {
                timePeriod: this.scene.worldClock.getCurrentPeriod(),
                season: this.scene.calendar.season,
                day: this.scene.calendar.getDate().day,
                year: this.scene.calendar.getDate().year,
                weather: this.scene.weatherSystem.getCurrentWeather(),
                event: this.scene.eventManager.getActiveEvent()
            }
        };
        this.scene.game.events.emit(EventKeys.UPDATE_STATS, fullState);
    }

    updateFPS(time, delta) {
        if (this.visible && time > this.lastFpsUpdate + this.fpsUpdateInterval) {
            const fps = this.scene.game.loop.actualFps.toFixed(1);
            this.fpsDisplay.innerText = `FPS: ${fps} | Delta: ${Math.round(delta)}ms`;

            if (fps < 30) this.fpsDisplay.style.color = "red";
            else if (fps < 55) this.fpsDisplay.style.color = "yellow";
            else this.fpsDisplay.style.color = "#00FF00";

            this.lastFpsUpdate = time;
        }

        // Draw bounds if active
        if (this.showBounds && this.debugGraphics) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, 0xFF0000, 1);

            // Draw all furniture bounds in current room
            const furniture = this.scene.placedFurniture[this.scene.currentRoom] || [];
            furniture.forEach(item => {
                if (item.sprite) {
                     const bounds = item.sprite.getBounds();
                     this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                }
            });
        }
    }

    toggle() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'block' : 'none';
        if (this.visible) {
             this.refreshGame();
        }
    }

    showToast(title, message, icon) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.showToast) {
            uiScene.showToast(title, message, icon);
        } else {
            console.log(`[TOAST] ${icon} ${title}: ${message}`);
        }
    }
}
