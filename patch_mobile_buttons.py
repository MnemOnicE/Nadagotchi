import re

with open('js/DanceMinigameScene.js', 'r') as f:
    content = f.read()

# Find the end of the create method
# We can just look for the input listeners and add the mobile buttons right after them

target_str = """        this.input.keyboard.on('keydown-LEFT', () => this.handleInput('LEFT'));
        this.input.keyboard.on('keydown-DOWN', () => this.handleInput('DOWN'));
        this.input.keyboard.on('keydown-UP', () => this.handleInput('UP'));
        this.input.keyboard.on('keydown-RIGHT', () => this.handleInput('RIGHT'));"""

mobile_buttons_code = """
        // Mobile Support - Directional Buttons
        const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        // Always show on smaller screens or explicitly mobile
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Always add them for compatibility, they don't hurt on desktop
        const btnY = h - 60;
        const btnWidth = 60;

        ButtonFactory.createButton(this, this.lanes[0].x, btnY, '←', () => this.handleInput('LEFT'), { width: btnWidth });
        ButtonFactory.createButton(this, this.lanes[1].x, btnY, '↓', () => this.handleInput('DOWN'), { width: btnWidth });
        ButtonFactory.createButton(this, this.lanes[2].x, btnY, '↑', () => this.handleInput('UP'), { width: btnWidth });
        ButtonFactory.createButton(this, this.lanes[3].x, btnY, '→', () => this.handleInput('RIGHT'), { width: btnWidth });
"""

new_content = content.replace(target_str, target_str + "\n" + mobile_buttons_code)

with open('js/DanceMinigameScene.js', 'w') as f:
    f.write(new_content)

print("Patched mobile buttons")
