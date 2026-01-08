
global.Phaser = {
    Scene: class {},
    Math: { Between: () => 1 },
    GameObjects: { Image: class {}, Sprite: class {}, Graphics: class {}, Text: class {} },
    Display: { Color: { Interpolate: { ColorWithColor: () => ({r:0,g:0,b:0}) } } }
};

import { Calendar } from './js/Calendar.js';
import { LightingManager } from './js/LightingManager.js';

console.log('--- Verifying Calendar Backend ---');
const cal = new Calendar();
console.log('Initial Year:', cal.year);
cal.season = 'Winter';
cal.day = 28;
cal.advanceDay();
console.log('After Winter D28 -> Advance:', cal.getDate());
if (cal.year === 2 && cal.season === 'Spring') console.log('PASS: Year incremented correctly.');
else console.log('FAIL: Year increment logic failed.');

console.log('\n--- Verifying Lighting Manager (Indoor Check) ---');
// Mock Scene
const mockScene = {
    worldState: { time: 'Night' },
    location: 'INDOOR',
    sprite: { x: 100, y: 100 },
    textures: { createCanvas: () => ({ setSize: () => {}, width: 800, height: 600, context: { createRadialGradient: () => ({ addColorStop: () => {} }), fillRect: () => {} }, refresh: () => {} }) },
    add: { image: () => ({ setOrigin: () => ({ setBlendMode: () => ({ setVisible: () => ({ setDepth: () => {} }) }) }) }) },
    scale: { width: 800, height: 600 }
};
const lm = new LightingManager(mockScene);
// Mock lightImage manually to intercept calls
let isVisible = false;
lm.lightImage = { setVisible: (v) => { isVisible = v; } };

lm.update();
console.log('Indoor Night - Light Visible:', isVisible); // Expect false

mockScene.location = 'GARDEN';
lm.update();
console.log('Outdoor Night - Light Visible:', isVisible); // Expect true
