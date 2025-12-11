from playwright.sync_api import sync_playwright

def verify_interaction(page):
    # Set viewport to known size for coordinate calculation
    width = 1280
    height = 720
    page.set_viewport_size({"width": width, "height": height})

    print("Loading game...")
    # 1. Load game
    page.goto("http://localhost:5173")

    # Wait for game to load (canvas visible)
    page.wait_for_selector("canvas", state="visible")

    # 2. Inject clean state to ensure we have energy
    print("Clearing storage...")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_selector("canvas", state="visible")
    page.wait_for_timeout(2000)

    # 3. Start Scene: Click "ARRIVE (New Game)"
    # Position: Center X (640), Center Y (360)
    print("Clicking New Game...")
    page.mouse.click(width / 2, height * 0.5)
    page.wait_for_timeout(1000)

    # 4. Archetype Selection: Click "Adventurer" Basket
    # Position: Center X - 200 (440), Y * 0.55 (396)
    print("Selecting Archetype...")
    page.mouse.click(width / 2 - 200, height * 0.55)
    page.wait_for_timeout(2000) # Wait for scene transition

    # 5. Tutorial Modal: Click "No"
    # Position: Center X + 60 (700), Center Y + 80 (440)
    print("Skipping Tutorial...")
    page.mouse.click(width / 2 + 60, height / 2 + 80)
    page.wait_for_timeout(1000)

    # 6. Interact with Scout
    # gameHeight = 720 - (720 * 0.25) = 540
    # x = 1280 - 150 = 1130
    # y = 540 - 150 = 390
    print("Interacting with Scout...")
    page.mouse.click(1130, 390)

    # 7. Wait for visual response
    page.wait_for_timeout(2000)

    # 8. Take Screenshot
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/interaction_verification.png")
    print("Screenshot taken at /home/jules/verification/interaction_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_interaction(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
