const fs = require('fs');
const content = fs.readFileSync('js/UIScene.js', 'utf8');
const lines = content.split('\n');
for(let i=1160; i<=1165; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
