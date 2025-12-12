
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 800, "height": 600})

        try:
            print("Navigating to game...")
            page.goto("http://localhost:5173")

            # Wait for game to load (Preloader)
            page.wait_for_timeout(2000)

            print("Attempting to enter game...")

            # 1. Click Center (Could be Resume or New Game)
            # Center of 800x600 is 400, 300.
            page.mouse.click(400, 300)
            page.wait_for_timeout(2000)

            # 2. Click Left Option (Adventurer Basket)
            # 200, 330
            # If we were already in MainScene, this clicks emptiness (sky/ground). Safe.
            page.mouse.click(200, 330)
            page.wait_for_timeout(3000) # Wait for Fade/Scene start

            # 3. Handle Tutorial Modal if it appears
            # "Yes" or "No".
            # Tutorial Modal is usually centered. "No" button is usually offset.
            # UIScene: No Button at width/2 + 60, height/2 + 80.
            # 460, 380.
            print("Clicking 'No' on potential Tutorial...")
            page.mouse.click(460, 380)
            page.wait_for_timeout(1000)

            print("Taking screenshot...")
            page.screenshot(path="verification/ui_verification.png")
            print("Screenshot saved.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui()
