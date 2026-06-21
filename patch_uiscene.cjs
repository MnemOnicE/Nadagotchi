const fs = require('fs');

const file = 'js/UIScene.js';
let content = fs.readFileSync(file, 'utf8');

// The issue is an unclosed method or block around line 714 in UIScene.js
// Let's find out what's around line 714
console.log(content.split('\n').slice(700, 725).join('\n'));
