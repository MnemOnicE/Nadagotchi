
import time
from playwright.sync_api import sync_playwright
import verify_utils

def verify_expedition():
    with sync_playwright() as p:
        page, context, browser = verify_utils.setup_browser(p)

        # Inject save to skip intro
        save_data = verify_utils.get_default_save_data()
        # Ensure we have energy
        save_data["stats"]["energy"] = 100

        verify_utils.inject_save(page, save_data)

        if not verify_utils.start_game(page, saved=True):
            print("Failed to start game.")
            browser.close()
            return

        print("Game started. Waiting for MainScene...")
        time.sleep(2)

        # Click ACTION tab (Center approx 210, 410)
        # Note: UI layout might differ based on "Physical Shell".
        # 800x600.
        # Check UI code or previous scripts.
        # Previous script used 210, 410.
        print("Clicking ACTION tab...")
        page.mouse.click(210, 410)
        time.sleep(1)

        # Click Explore (First button, approx 80, 460)
        print("Clicking Explore...")
        page.mouse.click(80, 460)

        # Wait for Expedition Scene
        time.sleep(3)

        print("Taking screenshot...")
        page.screenshot(path="verification_expedition.png")

        browser.close()

if __name__ == "__main__":
    verify_expedition()
