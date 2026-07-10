const fs = require('fs');
const filePath = 'js/UIScene.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `
    overlay.add(dim);

    handleAchievementUnlocked(achievement) { SoundSynthesizer.instance.playChime(); this.showToast("Achievement Unlocked!", achievement.name, achievement.icon); }
`;

const replacement = `
    overlay.add(dim);
  }

  handleAchievementUnlocked(achievement) {
    SoundSynthesizer.instance.playChime();
    this.showToast("Achievement Unlocked!", achievement.name, achievement.icon);
  }
`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(filePath, content);
