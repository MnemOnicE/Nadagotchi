
// This test file is intended to be run from the root of the repository: 'node tests/bug_fix_validation.js'

// 1. SETUP: Mock browser-specific APIs for Node.js environment
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// 2. DEPENDENCIES: Load the classes under test
const Nadagotchi = require('../js/Nadagotchi.js');
const PersistenceManager = require('../js/PersistenceManager.js');

// 3. TEST LOGIC
function runBugFixValidationTest() {
    console.log('--- Running Bug Fix Validation Test ---');

    // Arrange: Create a sad, intellectual Nadagotchi
    const pet = new Nadagotchi('Intellectual');
    pet.mood = 'sad';
    const initialLogic = pet.skills.logic;
    const happyMultiplier = 1.5; // The multiplier for a 'happy' mood
    const logicGain = 0.1;

    // Act: Perform the 'STUDY' action. For an intellectual pet, this action should
    // make it happy, and the fix ensures the skill gain is calculated *after* the mood change.
    pet.handleAction('STUDY');

    // Assert: Check if the skill gain was calculated with the correct 'happy' multiplier
    const expectedLogicAfterFix = initialLogic + (logicGain * happyMultiplier);
    const actualLogic = pet.skills.logic;

    console.log(`Initial Logic Skill: ${initialLogic}`);
    console.log(`Logic Skill After Action: ${actualLogic}`);
    console.log(`Expected Skill (after fix): ${expectedLogicAfterFix}`);

    if (actualLogic.toFixed(2) === expectedLogicAfterFix.toFixed(2)) {
        console.log('✅ BUG FIX CONFIRMED: Skill gain was calculated using the correct "happy" mood multiplier.');
    } else {
        console.error('❌ TEST FAILED: The bug fix is not working as expected.');
        console.error(`The calculated logic skill was ${actualLogic}, which does not match the expected value of ${expectedLogicAfterFix}.`);
        process.exit(1); // Exit with error code to fail CI/scripts
    }

    console.log('------------------------------------');
}

runBugFixValidationTest();
