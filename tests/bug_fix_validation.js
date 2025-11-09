
// This test file is intended to be run from the root of the repository: 'node tests/bug_fix_validation.js'

// 1. SETUP: Import the centralized test setup
const { Nadagotchi, PersistenceManager } = require('./test_setup.js');

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

function runBookshelfInteractionTest() {
    console.log('--- Running Bookshelf Interaction Logic Test ---');

    // Arrange: Create a sad, intellectual Nadagotchi
    const pet = new Nadagotchi('Intellectual');
    pet.mood = 'sad';
    const initialLogic = pet.skills.logic;
    const happyMultiplier = 1.5; // The multiplier for a 'happy' mood
    const logicGain = 0.15; // From INTERACT_BOOKSHELF action

    // Act: Perform the 'INTERACT_BOOKSHELF' action. For an intellectual pet, this action
    // should make it happy, and the fix ensures the skill gain is calculated *after* the mood change.
    pet.handleAction('INTERACT_BOOKSHELF');

    // Assert: Check if the skill gain was calculated with the correct 'happy' multiplier
    const expectedLogicAfterFix = initialLogic + (logicGain * happyMultiplier);
    const actualLogic = pet.skills.logic;

    console.log(`Initial Logic Skill: ${initialLogic}`);
    console.log(`Logic Skill After Action: ${actualLogic}`);
    console.log(`Expected Skill (after fix): ${expectedLogicAfterFix}`);

    if (actualLogic.toFixed(2) === expectedLogicAfterFix.toFixed(2)) {
        console.log('✅ BUG FIX CONFIRMED: Bookshelf interaction skill gain is correct.');
    } else {
        console.error('❌ TEST FAILED: The bookshelf interaction bug fix is not working.');
        console.error(`The calculated logic skill was ${actualLogic}, which does not match the expected value of ${expectedLogicAfterFix}.`);
        process.exit(1); // Exit with error code to fail CI/scripts
    }

    console.log('------------------------------------');
}


runBugFixValidationTest();
runBookshelfInteractionTest();
