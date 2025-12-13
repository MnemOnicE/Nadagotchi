from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Start with standard desktop size
        page.set_viewport_size({"width": 1024, "height": 768})
        print("Loading game at 1024x768...")
        page.goto("http://localhost:5173/")

        # Wait for game to load
        page.wait_for_selector("canvas", state="visible")
        time.sleep(2) # Allow Preloader

        # 2. Navigate through Start Scene
        print("Clicking Center (ARRIVE)...")
        # Assume fresh profile: Arrive is at center
        page.mouse.click(1024 // 2, 768 // 2)
        time.sleep(1)

        print("Clicking Archetype (Adventurer)...")
        # Adventurer is at approx 312, 422
        page.mouse.click(312, 422)
        time.sleep(2) # Wait for MainScene creation

        # 3. Open Inventory
        print("In MainScene. Switching to SYSTEM tab...")
        page.keyboard.press("3")
        time.sleep(1)

        print("Clicking Inventory button...")
        # Calculated X=384, Y=646
        page.mouse.click(384, 646)
        time.sleep(1)

        page.screenshot(path="verification/responsive_desktop.png")
        print("Captured desktop screenshot. Inventory should be open.")

        # 4. Resize to Mobile Portrait
        print("Resizing to Mobile Portrait (375x812)...")
        page.set_viewport_size({"width": 375, "height": 812})
        time.sleep(2) # Wait for resize event and smooth transition

        page.screenshot(path="verification/responsive_mobile.png")
        print("Captured mobile screenshot. Modal should be centered.")

        browser.close()

if __name__ == "__main__":
    run()
