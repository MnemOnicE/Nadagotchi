import time
from playwright.sync_api import sync_playwright

def verify_onboarding():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        # 1. Clear Local Storage & Load
        page.goto("http://localhost:5173")
        page.evaluate("window.localStorage.clear()")
        page.reload()

        # Wait for game to load (Preloader -> StartScene)
        time.sleep(2)

        print("Taking screenshot of Start Menu...")
        page.screenshot(path="screenshot_start_menu.png")

        # 2. Click "ARRIVE" (New Game)
        # Position: 400, 300 (Center)
        print("Clicking 'ARRIVE'...")
        page.mouse.click(400, 300)
        time.sleep(1)

        print("Taking screenshot of Basket Selection...")
        page.screenshot(path="screenshot_baskets.png")

        # 3. Click "Adventurer" Basket (Left)
        # Position: 200, 330
        print("Clicking 'Adventurer' Basket...")
        page.mouse.click(200, 330)
        time.sleep(2) # Wait for MainScene load + 500ms delay for tutorial

        print("Taking screenshot of Tutorial Prompt...")
        page.screenshot(path="screenshot_tutorial_prompt.png")

        # 4. Click "Yes" for Tutorial
        # Position: 340, 380 (width/2 - 60, height/2 + 80)
        print("Clicking 'Yes'...")
        page.mouse.click(340, 380)
        time.sleep(1)

        print("Taking screenshot of Tutorial Step 1 (Stats Highlight)...")
        page.screenshot(path="screenshot_tutorial_step1.png")

        # 5. Click to Advance (Anywhere)
        page.mouse.click(400, 300)
        time.sleep(0.5)
        print("Taking screenshot of Tutorial Step 2 (Tabs)...")
        page.screenshot(path="screenshot_tutorial_step2.png")

        # 6. Click to Advance
        page.mouse.click(400, 300)
        time.sleep(0.5)
        print("Taking screenshot of Tutorial Step 3 (Actions)...")
        page.screenshot(path="screenshot_tutorial_step3.png")

        # 7. Click to End
        page.mouse.click(400, 300)
        time.sleep(0.5)
        print("Taking screenshot of Gameplay...")
        page.screenshot(path="screenshot_gameplay.png")

        browser.close()

if __name__ == "__main__":
    verify_onboarding()
