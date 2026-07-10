const fs = require('fs');

const file = 'js/UIScene.js';
let content = fs.readFileSync(file, 'utf8');

// There is a known bug in UIScene.js on `main` branch
// Based on memory: "The `js/UIScene.js` file on the `main` branch currently contains a known syntax error (methods improperly flattened inside `runTutorialSequence`) introduced in commit #303, which breaks project-wide tools like `npm run build` and `npm test` when global coverage is enabled."
// Let's replace the broken structure around line 716 with a properly closed runTutorialSequence method.

// `runTutorialSequence` is actually probably starting way above. Let's look for it.
console.log(content.indexOf('runTutorialSequence() {'));
