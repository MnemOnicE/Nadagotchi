import re

with open('js/UIScene.js', 'r') as f:
    text = f.read()

# We need to move the second half of openCraftingMenu up to immediately after the first half.
# But wait, looking at `js/UIScene.js` again, the code was probably injected blindly at wrong line numbers.
# A safer bet is just to comment out the bad syntax parts without deleting any method logic, OR just insert the missing method boundaries.

# The syntax error is at 716: `const overlay = this.add.container(0, 0).setDepth(2000);`
# This is clearly part of `runTutorialSequence()`. Let's just define `runTutorialSequence()` right above it!
text = text.replace(
"""    const overlay = this.add.container(0, 0).setDepth(2000);""",
"""    runTutorialSequence() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const dashboardHeight = Math.floor(height * 0.2);
        const dashboardY = height - dashboardHeight;
        const overlay = this.add.container(0, 0).setDepth(2000);""")

text = text.replace(
"""        let yOffset = 0;
        options.forEach(opt => {""",
"""        let yOffset = 0;
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
            highlightGraphic.fillStyle(0x000000, 0.5);
            highlightGraphic.fillRect(0, 0, width, height);
            if (step.highlight) {
                highlightGraphic.eraseRect(step.highlight.x, step.highlight.y, step.highlight.w, step.highlight.h);
                highlightGraphic.lineStyle(4, 0xffff00, 1);
                highlightGraphic.strokeRect(step.highlight.x, step.highlight.y, step.highlight.w, step.highlight.h);
            }
        };
        showStep(currentStep);
        overlay.on('pointerdown', () => {
            currentStep++;
            showStep(currentStep);
        });
    }

    showDialogue(npcName, dialogueData) {
        let text = "";
        let options = [];
        options.forEach(opt => {""")

with open('js/UIScene.js', 'w') as f:
    f.write(text)
