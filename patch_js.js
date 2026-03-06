const fs = require('fs');
let code = fs.readFileSync('js/LightingManager.js', 'utf8');

const regexConstructor = /this\.lastLights = \[\];/;
code = code.replace(regexConstructor, `this.lastLights = [];\n        this.currentLights = [];\n        this.activeLightCount = 0;`);

const regexProcessLights = /_processLights\(\) \{[\s\S]*?\n    \}/;
const newProcessLights = `_processLights() {
        this.activeLightCount = 0;

        const addLight = (x, y, r) => {
            if (this.activeLightCount < this.currentLights.length) {
                const light = this.currentLights[this.activeLightCount];
                light.x = x;
                light.y = y;
                light.r = r;
            } else {
                this.currentLights.push({ x, y, r });
            }
            this.activeLightCount++;
        };

        addLight(this.scene.sprite.x, this.scene.sprite.y, 250);

        if (this.scene.npcScout && this.scene.npcScout.visible) addLight(this.scene.npcScout.x, this.scene.npcScout.y, 80);
        if (this.scene.npcArtisan && this.scene.npcArtisan.visible) addLight(this.scene.npcArtisan.x, this.scene.npcArtisan.y, 80);
        if (this.scene.npcVillager && this.scene.npcVillager.visible) addLight(this.scene.npcVillager.x, this.scene.npcVillager.y, 80);

        if (this._needsRedraw()) {
            this.drawLight();
            for (let i = 0; i < this.activeLightCount; i++) {
                const curr = this.currentLights[i];
                if (i < this.lastLights.length) {
                    const last = this.lastLights[i];
                    last.x = curr.x;
                    last.y = curr.y;
                    last.r = curr.r;
                } else {
                    this.lastLights.push({ x: curr.x, y: curr.y, r: curr.r });
                }
            }
            this.lastLights.length = this.activeLightCount;
        }
    }`;
code = code.replace(regexProcessLights, newProcessLights);

const regexNeedsRedraw = /_needsRedraw\(currentLights\) \{[\s\S]*?\n    \}/;
const newNeedsRedraw = `_needsRedraw() {
        if (this.activeLightCount !== this.lastLights.length) return true;

        for (let i = 0; i < this.activeLightCount; i++) {
            const curr = this.currentLights[i];
            const prev = this.lastLights[i];

            if (Math.abs(curr.x - prev.x) > this.movementThreshold ||
                Math.abs(curr.y - prev.y) > this.movementThreshold ||
                Math.abs(curr.r - prev.r) > this.movementThreshold) {
                return true;
            }
        }
        return false;
    }`;
code = code.replace(regexNeedsRedraw, newNeedsRedraw);

const regexDrawLight = /drawLight\(lights\) \{[\s\S]*?\n    \}/;
const newDrawLight = `drawLight() {
        if (!this.renderTexture) return;

        this.renderTexture.fill(0x000000, 1);

        for (let i = 0; i < this.activeLightCount; i++) {
            const light = this.currentLights[i];
            const tx = light.x * this.scaleRatio;
            const ty = light.y * this.scaleRatio;

            const targetDiameter = light.r * 2 * this.scaleRatio;
            const spriteScale = targetDiameter / 512;

            this.dummyLight.setScale(spriteScale);
            this.dummyLight.setPosition(tx, ty);

            this.renderTexture.draw(this.dummyLight);
        }
    }`;
code = code.replace(regexDrawLight, newDrawLight);

fs.writeFileSync('js/LightingManager.js', code);
