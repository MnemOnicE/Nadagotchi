const fs = require('fs');

const file = 'js/UIScene.js';
let content = fs.readFileSync(file, 'utf8');

const brokenStr = `        container.setVisible(true);
        this.scene.pause('MainScene');
    }

    const overlay = this.add.container(0, 0).setDepth(2000);
    const dim = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setInteractive();
    overlay.add(dim);
  }`;

const fixedStr = `        container.setVisible(true);
        this.scene.pause('MainScene');

        const overlay = this.add.container(0, 0).setDepth(2000);
        const dim = this.add
          .rectangle(0, 0, width, height, 0x000000, 0.7)
          .setOrigin(0)
          .setInteractive();
        overlay.add(dim);
    }`;

if (content.includes(brokenStr)) {
  fs.writeFileSync(file, content.replace(brokenStr, fixedStr), 'utf8');
  console.log('Fixed');
} else {
  console.log('Could not find string');
}
