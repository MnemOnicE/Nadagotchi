from playwright.sync_api import sync_playwright
import time

def verify_app_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a fixed viewport to match game config
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173")

            # Wait for the canvas to be present, indicating Phaser has initialized
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=10000)

            # Give it a moment to render the start scene
            time.sleep(2)

            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_load()
