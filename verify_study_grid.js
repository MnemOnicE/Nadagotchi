// Mock Phaser
global.Phaser = {
    Scene: class { constructor(k) { this.key = k; } },
    Math: { Between: () => 0 }
};

// Simulation of grid logic
class MockStudyScene {
    constructor() {
        this.grid = [];
        this.selectedCells = [];
    }

    // Adjacency Check
    isValidStep(last, current) {
        const dx = Math.abs(last.x - current.x);
        const dy = Math.abs(last.y - current.y);
        return !(dx > 1 || dy > 1 || (dx === 0 && dy === 0));
    }
}

const scene = new MockStudyScene();
const c1 = { x: 0, y: 0 };
const c2 = { x: 1, y: 1 }; // Diagonal, valid
const c3 = { x: 0, y: 2 }; // Jump, invalid

console.log("Verifying Study Grid Logic...");

if (scene.isValidStep(c1, c2)) {
    console.log("SUCCESS: Diagonal adjacency valid.");
} else {
    console.error("FAILURE: Diagonal adjacency failed.");
    process.exit(1);
}

if (!scene.isValidStep(c1, c3)) {
    console.log("SUCCESS: Non-adjacent jump invalid.");
} else {
    console.error("FAILURE: Non-adjacent jump allowed.");
    process.exit(1);
}
