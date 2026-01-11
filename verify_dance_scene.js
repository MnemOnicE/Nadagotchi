// Mock Phaser
global.Phaser = {
    Scene: class { constructor(k) { this.key = k; } },
    Math: { Between: () => 0 }
};

// Mock Dependencies
const EventKeys = {};
const ButtonFactory = {};
const SoundSynthesizer = {};

// We can't easily import ES Modules in Node without package.json "type": "module".
// But we can check for syntax errors by reading it.

import fs from 'fs';
try {
    const code = fs.readFileSync('js/DanceMinigameScene.js', 'utf8');
    if (code.includes('class DanceMinigameScene extends Phaser.Scene')) {
        console.log("SUCCESS: DanceMinigameScene class definition found.");
    } else {
        console.error("FAILURE: Class definition missing.");
        process.exit(1);
    }
} catch (e) {
    console.error("FAILURE: Syntax Error or File Missing", e);
    process.exit(1);
}
