/**
 * Test script to verify mobile layout improvements
 * This simulates different screen sizes and checks for button overlaps
 */

// Mock Phaser and Config for testing
const mockConfig = {
    UI: {
        DASHBOARD_HEIGHT_RATIO: 0.45,
        SAFE_AREA_TOP: 50,
        SAFE_AREA_BOTTOM: 30,
        BUTTON_PADDING: 8,
        BUTTON_ROW_SPACING: 55,
        MODAL_MAX_WIDTH_RATIO: 0.9,
        MODAL_MAX_HEIGHT_RATIO: 0.75
    }
};

// Test button layout function
function testButtonLayout(screenWidth, screenHeight, actions) {
    console.log(`\nTesting screen size: ${screenWidth}x${screenHeight}`);
    
    const safeAreaBottom = mockConfig.UI.SAFE_AREA_BOTTOM || 20;
    const maxButtonWidth = screenWidth - 40;
    let currentX = mockConfig.UI.BUTTON_PADDING || 10;
    let currentY = screenHeight - (screenHeight * mockConfig.UI.DASHBOARD_HEIGHT_RATIO) + 50;
    
    let row = 0;
    let buttonsInRow = 0;
    
    actions.forEach((item, index) => {
        // Use smaller font size for mobile
        const fontSize = screenWidth < 500 ? 16 : 20;
        const textWidth = Math.min(item.text.length * (fontSize / 1.5), maxButtonWidth - 40);
        const btnWidth = Math.min(textWidth + 40, maxButtonWidth);
        
        if (currentX + btnWidth > screenWidth - (mockConfig.UI.BUTTON_PADDING || 8)) {
            currentX = mockConfig.UI.BUTTON_PADDING || 8;
            currentY += (mockConfig.UI.BUTTON_ROW_SPACING || 55);
            row++;
            buttonsInRow = 0;
        }
        
        // Check if button would be cut off at bottom
        const maxY = screenHeight - safeAreaBottom - 40;
        if (currentY + 40 > maxY) {
            console.log(`  ⚠️  Button "${item.text}" would be cut off at bottom!`);
            return;
        }
        
        console.log(`  Button ${index + 1}: "${item.text}" at (${currentX}, ${currentY}) width=${btnWidth}`);
        
        currentX += btnWidth + (mockConfig.UI.BUTTON_PADDING || 10);
        buttonsInRow++;
    });
    
    console.log(`  Total rows: ${row + 1}, buttons per last row: ${buttonsInRow}`);
}

// Test modal sizing function
function testModalSizing(screenWidth, screenHeight) {
    console.log(`\nTesting modal sizing for screen: ${screenWidth}x${screenHeight}`);
    
    const safeAreaTop = mockConfig.UI.SAFE_AREA_TOP || 50;
    const safeAreaBottom = mockConfig.UI.SAFE_AREA_BOTTOM || 20;
    
    const maxModalWidth = Math.min(500, screenWidth * mockConfig.UI.MODAL_MAX_WIDTH_RATIO);
    const maxModalHeight = Math.min(400, (screenHeight - safeAreaTop - safeAreaBottom) * mockConfig.UI.MODAL_MAX_HEIGHT_RATIO);
    
    console.log(`  Max modal size: ${maxModalWidth}x${maxModalHeight}`);
    console.log(`  Available space: ${screenWidth}x${screenHeight - safeAreaTop - safeAreaBottom}`);
    
    // Check if modal fits
    if (maxModalWidth > screenWidth || maxModalHeight > screenHeight - safeAreaTop - safeAreaBottom) {
        console.log(`  ❌ Modal would overflow screen!`);
    } else {
        console.log(`  ✓ Modal fits within screen bounds`);
    }
}

// Test cases
const testCases = [
    { width: 375, height: 812, name: "iPhone X" },
    { width: 414, height: 896, name: "iPhone 11" },
    { width: 360, height: 760, name: "Generic Android" },
    { width: 768, height: 1024, name: "iPad" },
    { width: 1920, height: 1080, name: "Desktop" }
];

const testActions = [
    { text: "Feed" },
    { text: "Play" },
    { text: "Meditate" },
    { text: "Explore" },
    { text: "Study" },
    { text: "Work" },
    { text: "Craft" },
    { text: "Passport" },
    { text: "Career" },
    { text: "Journal" }
];

console.log("=== Mobile Layout Test Results ===");

testCases.forEach(testCase => {
    console.log(`\n--- ${testCase.name} (${testCase.width}x${testCase.height}) ---`);
    testButtonLayout(testCase.width, testCase.height, testActions);
    testModalSizing(testCase.width, testCase.height);
});

console.log("\n=== Test Complete ===");