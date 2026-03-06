const fs = require('fs');
let content = fs.readFileSync('tests/performance/LightingManager.perf.test.js', 'utf8');

const newTest = `
    test('Benchmark: Object Allocation Proxy (CPU Time in Tight Loop)', () => {
        const frames = 100000; // Large number of frames to highlight GC/Allocation overhead
        const movementSpeed = 0.2; // Enough to trigger redraws frequently

        const startTime = Date.now();

        for (let i = 0; i < frames; i++) {
            scene.sprite.x += movementSpeed;
            scene.sprite.y += movementSpeed;
            lightingManager.update();
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(\`[ALLOCATION BENCHMARK] Time for \${frames} frames: \${duration.toFixed(2)}ms\`);

        // This test serves as a baseline, we don't strictly assert the time
        // as it varies by machine, but we log it for comparison.
        expect(duration).toBeGreaterThan(0);
    });
});`;

if (!content.includes('Benchmark: Object Allocation')) {
    content = content.replace(/}\);$/, newTest);
    fs.writeFileSync('tests/performance/LightingManager.perf.test.js', content);
}
