
import time
from playwright.sync_api import sync_playwright
import verify_utils
import json

def verify_furniture_pickup():
    with sync_playwright() as p:
        page, context, browser = verify_utils.setup_browser(p)

        # Construct Save Data
        save_data = verify_utils.get_default_save_data()
        save_data["inventory"] = {"Fancy Bookshelf": 1}

        verify_utils.inject_save(page, save_data)

        furniture_data = json.dumps([{"key": "Fancy Bookshelf", "x": 100, "y": 300}])
        page.evaluate(f"localStorage.setItem('nadagotchi_furniture', '{furniture_data}')")

        page.reload()

        if not verify_utils.start_game(page, saved=True):
            print("Failed to start game.")
            browser.close()
            return

        time.sleep(2)

        # Screenshot 1: Verify Furniture Exists
        page.screenshot(path="verification_furniture_exists.png")
        print("Captured verification_furniture_exists.png")

        browser.close()

if __name__ == "__main__":
    verify_furniture_pickup()
