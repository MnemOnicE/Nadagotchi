
import time
from playwright.sync_api import sync_playwright
import verify_utils

def verify_pet():
    with sync_playwright() as p:
        page, context, browser = verify_utils.setup_browser(p)

        try:
            # Clear storage to ensure new game
            page.goto("http://localhost:5173")
            page.evaluate("localStorage.clear()")
            verify_utils.start_game(page)
        except Exception as e:
            print(f"Failed to start game: {e}")
            browser.close()
            return

        print("Waiting for MainScene stability...")
        time.sleep(2)

        print("Taking screenshot...")
        page.screenshot(path="verification_pet.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    verify_pet()
