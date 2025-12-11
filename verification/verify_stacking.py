from playwright.sync_api import sync_playwright, Page, expect

def verify_modal_stacking(page: Page):
    print("Navigating to game...")
    page.goto("http://localhost:5173")

    print("Waiting for game canvas...")
    page.wait_for_selector("canvas", state="visible")
    page.wait_for_timeout(2000)

    # 1. Start New Game (Arrive)
    # Container (640, 360). 250x60. Center: (765, 390).
    print("Clicking Start/New Game...")
    page.mouse.click(765, 390)
    page.wait_for_timeout(1000)

    # 2. Select Adventurer Basket - Left
    # Image Centered at (440, 396).
    print("Selecting Adventurer Archetype...")
    page.mouse.click(440, 396)
    page.wait_for_timeout(3000)

    # 3. Dismiss Tutorial (Click "No")
    # Container (700, 440). 100x40. Center: (750, 460).
    print("Dismissing Tutorial...")
    page.mouse.click(750, 460)
    page.wait_for_timeout(1000)

    # 4. Click 'System' Tab
    # Container (280, 560). 100x35. Center: (330, 577).
    print("Clicking 'System' Tab...")
    page.mouse.click(330, 577)
    page.wait_for_timeout(500)

    # 5. Open Inventory (Second button)
    # Center: (233, 610).
    print("Opening Inventory...")
    page.mouse.click(233, 610)
    page.wait_for_timeout(1000)

    # 6. Open Recipes (Third button)
    # Center: (384, 610).
    print("Opening Recipes...")
    page.mouse.click(384, 610)
    page.wait_for_timeout(1000)

    # 7. Close the Recipes Modal (X button)
    # Container (850, 190). 40x40. Center: (870, 210).
    print("Closing Recipes Modal...")
    page.mouse.click(870, 210)
    page.wait_for_timeout(1000)

    # 8. Take Screenshot
    # Expectation: Game dashboard visible. No inventory modal.
    print("Taking screenshot...")
    page.screenshot(path="verification/stacking_test.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()
        try:
            verify_modal_stacking(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
