const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 800, height: 600 });

  // Log console messages to debug
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
      await page.goto('http://localhost:5173');

      // Wait for StartScene
      await page.waitForTimeout(2000);

      // Clear any previous data just in case
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForTimeout(2000);

      // Click "ARRIVE (New Game)" (Center)
      console.log('Clicking New Game...');
      await page.mouse.click(400, 300);

      await page.waitForTimeout(1000);

      // Click Archetype (Center - Nurturer)
      console.log('Clicking Archetype...');
      await page.mouse.click(400, 330);

      // Wait for MainScene + Tutorial
      await page.waitForTimeout(3000);

      // Click No on Tutorial
      console.log('Clicking No on Tutorial...');
      await page.mouse.click(460, 380);
      await page.waitForTimeout(1000);

      // Click SYSTEM tab
      console.log('Clicking SYSTEM Tab...');
      await page.mouse.click(290, 477);
      await page.waitForTimeout(500);

      // Click Settings Button (Calculated to be 1st item on 2nd row)
      // Tab Y ends ~480. Actions start ~510.
      // Row 1 ends ~550.
      // Row 2 starts ~565.
      // Button height 40. Center Y ~ 585.
      // Button X starts 20. Width ~136. Center ~88.
      console.log('Clicking Settings...');
      await page.mouse.click(88, 585);

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'verify_settings_modal.png' });
      console.log('Screenshot saved to verify_settings_modal.png');

  } catch (e) {
      console.error(e);
      await page.screenshot({ path: 'error_state.png' });
  } finally {
      await browser.close();
  }
})();
