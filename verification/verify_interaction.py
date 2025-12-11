from playwright.sync_api import sync_playwright, expect

def verify_interaction(page):
    # Set viewport to known size for coordinate calculation
    page.set_viewport_size({"width": 1280, "height": 720})

    # 1. Load game
    page.goto("http://localhost:5173")

    # Wait for game to load (canvas visible)
    page.wait_for_selector("canvas", state="visible")

    # 2. Inject clean state to ensure we have energy
    # We can just clear localStorage to force new game defaults (Energy 100)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_selector("canvas", state="visible")

    # Wait a bit for the scene to fully init (sprites placed)
    page.wait_for_timeout(4000) # Increased timeout to be safe

    # 3. Click the Grizzled Scout
    # Calculations:
    # gameHeight = 720 - (720 * 0.25) = 540
    # x = 1280 - 150 = 1130
    # y = 540 - 150 = 390
    page.mouse.click(1130, 390)

    # 4. Wait for visual response
    page.wait_for_timeout(2000)

    # 5. Take Screenshot
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
