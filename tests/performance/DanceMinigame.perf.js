// Micro-benchmark for DanceMinigameScene lane lookup optimization

const iterations = 1000000;
console.log(`Running lookup benchmark for ${iterations} iterations...\n`);

// Data Setup
const lanes = [
    { key: 'LEFT', x: 200, input: 'LEFT' },
    { key: 'DOWN', x: 300, input: 'DOWN' },
    { key: 'UP', x: 400, input: 'UP' },
    { key: 'RIGHT', x: 500, input: 'RIGHT' }
];

// Mock laneTargets (array)
const laneTargets = [ { id: 'leftTarget' }, { id: 'downTarget' }, { id: 'upTarget' }, { id: 'rightTarget' } ];

// Mock laneIndicators (dictionary)
const laneIndicators = {
    'LEFT': { id: 'leftTarget' },
    'DOWN': { id: 'downTarget' },
    'UP': { id: 'upTarget' },
    'RIGHT': { id: 'rightTarget' }
};

const keys = ['LEFT', 'DOWN', 'UP', 'RIGHT'];

// Baseline: O(N) Array findIndex
console.time('Baseline: O(N) findIndex');
let baselineCount = 0;
for (let i = 0; i < iterations; i++) {
    const key = keys[i % 4];
    const index = lanes.findIndex(l => l.key === key);
    const target = laneTargets[index];
    if (target) baselineCount++;
}
console.timeEnd('Baseline: O(N) findIndex');

// Optimization: O(1) Dictionary Lookup
console.time('Optimized: O(1) Dictionary Lookup');
let optimizedCount = 0;
for (let i = 0; i < iterations; i++) {
    const key = keys[i % 4];
    const target = laneIndicators[key];
    if (target) optimizedCount++;
}
console.timeEnd('Optimized: O(1) Dictionary Lookup');

console.log(`\nResults verification: Baseline hit ${baselineCount}, Optimized hit ${optimizedCount}`);
