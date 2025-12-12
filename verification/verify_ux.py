import time
from playwright.sync_api import sync_playwright

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        # 1. Clear Local Storage & Load
        page.goto("http://localhost:5173")
        page.evaluate("window.localStorage.clear()")
        page.reload()
        time.sleep(2) # Wait for load

        # 2. Click "ARRIVE" (New Game)
        page.mouse.click(400, 300)
        time.sleep(1)

        # 3. Click "Adventurer" Basket
        page.mouse.click(200, 330)
        time.sleep(2)

        # 4. Skip Tutorial "No"
        # Position: 460, 380 (width/2 + 60, height/2 + 80)
        page.mouse.click(460, 380)
        time.sleep(1)

        # 5. Click "ACTION" Tab
        # Tabs Y: 600 - 150 + 10 = 460.
        # Tab 2 X: 20 + 120 + 10 = 150.
        # Click center of Tab 2: 150 + 60 = 210, 460 + 17 = 477.
        page.mouse.click(210, 477)
        time.sleep(1)

        # Take screenshot of ACTION tab
        page.screenshot(path="verification/ux_action_tab.png")

        # 6. Click "SYSTEM" Tab
        # Tab 3 X: 150 + 130 = 280.
        # Click center: 280 + 60 = 340.
        page.mouse.click(340, 477)
        time.sleep(1)

        # Take screenshot of SYSTEM tab
        page.screenshot(path="verification/ux_system_tab.png")

        browser.close()

if __name__ == "__main__":
    verify_ux()
