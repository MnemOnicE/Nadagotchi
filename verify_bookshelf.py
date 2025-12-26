
import time
from playwright.sync_api import sync_playwright
import verify_utils

def verify_bookshelf():
    with sync_playwright() as p:
        page, context, browser = verify_utils.setup_browser(p)

        # Inject save with a bookshelf placed?
        # The original script just started a new game and checked the bookshelf (implying default item or just checking logic?)
        # Ah, "Nadagotchi constructor automatically adds 'Fancy Bookshelf' to discoveredRecipes if the list is empty, ensuring new games start with one craftable item."
        # But it doesn't add it to inventory unless logic says so.
        # Wait, the original verify_bookshelf.py didn't inject anything, it just started a new game.
        # And then took a screenshot of the top-left corner.
        # If the bookshelf isn't placed, what are we verifying?
        # Maybe checking if the sprite exists in the world?
        # Or checking if it's in the inventory (which requires opening UI).
        # "Capture the top-left corner where the bookshelf is (at 80, 80)"
        # This implies the user expects a bookshelf at 80, 80.
        # This might be hardcoded in the test or expected default behavior.

        # To be safe, let's inject a save with a placed bookshelf.
        save_data = verify_utils.get_default_save_data()
        verify_utils.inject_save(page, save_data)

        # Inject furniture
        furniture_data = '[{"key": "Fancy Bookshelf", "x": 80, "y": 80}]'
        page.evaluate(f"localStorage.setItem('nadagotchi_furniture', '{furniture_data}')")

        # Reload to apply storage
        page.reload()

        if not verify_utils.start_game(page, saved=True):
            print("Failed to start game.")
            browser.close()
            return

        time.sleep(2)

        print("Taking screenshot...")
        page.screenshot(path="verification_bookshelf.png", clip={'x': 0, 'y': 0, 'width': 200, 'height': 200})

        browser.close()
        print("Done.")

if __name__ == "__main__":
    verify_bookshelf()
