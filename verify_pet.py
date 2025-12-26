
import time
from playwright.sync_api import sync_playwright
import verify_utils

def verify_pet():
    with sync_playwright() as p:
        page, context, browser = verify_utils.setup_browser(p)

        if not verify_utils.start_game(page, saved=False):
            print("Failed to start game.")
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
