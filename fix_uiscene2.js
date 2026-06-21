const fs = require('fs');
const filePath = 'js/UIScene.js';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('overlay.add(dim);')) {
        // Find handleAchievementUnlocked right after
        if (lines[i+3] && lines[i+3].includes('handleAchievementUnlocked(achievement) {')) {
            // Add a closing brace before it.
            lines.splice(i+1, 0, '  }');
            break;
        }
    }
}

fs.writeFileSync(filePath, lines.join('\n'));
