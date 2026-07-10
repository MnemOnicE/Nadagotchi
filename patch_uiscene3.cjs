const fs = require('fs');

const file = 'js/UIScene.js';
let content = fs.readFileSync(file, 'utf8');

const matchStr = `        container.setVisible(true);
        this.scene.pause('MainScene');
    }

    const overlay = this.add.container(0, 0).setDepth(2000);`;

console.log(content.indexOf(matchStr));
