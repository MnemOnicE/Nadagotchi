from playwright.sync_api import sync_playwright

def verify_dialogue_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        try:
            print("Loading game...")
            page.goto("http://localhost:5173")
            page.wait_for_load_state('networkidle')
            page.wait_for_selector('canvas')

            # Start New Game
            print("Clicking New Game...")
            page.mouse.click(400, 300)
            page.wait_for_timeout(1000)

            # Select Nurturer (Center) - Maybe Adventurer had an issue?
            print("Selecting Nurturer (400, 330)...")
            page.mouse.click(400, 330)

            # Wait for transition
            page.wait_for_timeout(3000)

            # Take screenshot to see if we moved past selection
            page.screenshot(path="verification/step_selection.png")

            # Dismiss Tutorial
            print("Dismissing Tutorial...")
            page.mouse.click(460, 380)
            page.wait_for_timeout(1000)

            # Click Scout
            print("Clicking Scout...")
            page.mouse.click(650, 300)
            page.wait_for_timeout(1000)

            screenshot_path = "verification/dialogue_modal.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dialogue_modal()
