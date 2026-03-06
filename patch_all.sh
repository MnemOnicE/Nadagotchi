#!/bin/bash
sed -i 's/console.log(\`\[AchievementManager\] Unlocked: ${achievement.name}\`);//g' js/AchievementManager.js
sed -i 's/console.log("NADAGOTCHI DNA:", text);//g' js/ShowcaseScene.js
sed -i 's/console.log("Currency system pending implementation.");//g' js/DebugConsole.js
sed -i 's/console.log(\`\[DEBUG\] Executed: ${btn.label}\`);//g' js/DebugConsole.js
sed -i 's/console.log(\`\[TOAST\] ${icon} ${title}: ${message}\`);//g' js/DebugConsole.js
sed -i '/console.log/d' js/AchievementManager.js
sed -i '/console.log/d' js/ShowcaseScene.js
sed -i '/console.log/d' js/DebugConsole.js

# Patch MainScene
sed -i '3i import { WikiSystem } from "./WikiSystem.js";' js/MainScene.js
sed -i '/this.persistence = new PersistenceManager();/a \        this.wikiSystem = new WikiSystem(this.persistence);\n        await this.wikiSystem.init();' js/MainScene.js

# Patch EventKeys
sed -i "/OPEN_ACHIEVEMENTS: 'OPEN_ACHIEVEMENTS',/a \    OPEN_WIKI: 'OPEN_WIKI'," js/EventKeys.js

# Patch UIScene
sed -i '4i import { WikiUI } from "./WikiUI.js";' js/UIScene.js
sed -i '/this.inventoryModal = this.createModal("Inventory");/a \        this.wikiUI = new WikiUI(this);\n        if(this.scene && this.scene.get) this.wikiUI.create();' js/UIScene.js
sed -i 's/{ text: '"'"'Achievements'"'"', action: EventKeys.OPEN_ACHIEVEMENTS },/{ text: '"'"'Wiki'"'"', action: EventKeys.OPEN_WIKI }, { text: '"'"'Achievements'"'"', action: EventKeys.OPEN_ACHIEVEMENTS },/g' js/UIScene.js
sed -i '/case EventKeys.OPEN_ACHIEVEMENTS: this.openAchievementsModal(); break;/a \            case EventKeys.OPEN_WIKI: this.openWikiMenu(); break;' js/UIScene.js
sed -i '/openAchievementsModal() {/a \    openWikiMenu() { this.closeAllModals(); this.wikiUI.show(); this.scene.pause("MainScene"); }' js/UIScene.js

# Patch Debug Console
sed -i 's/this.scene.eventManager.activeEvent = { name: eventName, timeLeft: 10000 };/this.scene.eventManager._activeEvent = { name: eventName, timeLeft: 10000 };/g' js/DebugConsole.js
sed -i '/this.scene.checkMerchantVisibility();/c \
             this.scene.isMerchantActive = true;\
             if (this.scene.npcMerchant) {\
                 this.scene.npcMerchant.setVisible(this.scene.location !== "INDOOR");\
             }' js/DebugConsole.js
sed -i 's/{ label: "+1000 Coins (Placeholder)", action: () => { this.showToast("Not Implemented", "No currency system yet!", "💰");  } }/{ label: "+1000 Coins", action: () => { this.scene.nadagotchi.coins += 1000; this.scene.nadagotchi.save(); this.showToast("Added Coins", "+1000 Coins", "💰"); this.refreshGame(); } }/g' js/DebugConsole.js

# Patch Nadagotchi
sed -i '/export class Nadagotchi {/a \
    unlockAllCareers() {\
        if (!this.unlockedCareers) this.unlockedCareers = [];\
        const allCareers = Object.keys(Config.CAREER.CAREERS || {});\
        allCareers.forEach(c => {\
            if (!this.unlockedCareers.includes(c)) this.unlockedCareers.push(c);\
        });\
        this.save();\
    }' js/Nadagotchi.js
sed -i '/this.inventory = {};/a \        this.coins = 0;' js/Nadagotchi.js
sed -i '/this.inventory = data.inventory || {};/a \        this.coins = data.coins || 0;' js/Nadagotchi.js
sed -i '/inventory: this.inventory,/a \            coins: this.coins,' js/Nadagotchi.js
sed -i 's/inventory: {},/inventory: {},\n            coins: 0,/g' js/Nadagotchi.js
