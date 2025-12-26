
import time
from playwright.sync_api import sync_playwright
import verify_utils

def run(playwright):
    page, context, browser = verify_utils.setup_browser(playwright)

    # Inject save for reliability
    save_data = verify_utils.get_default_save_data()
    # Add recipes
    save_data["recipes"] = ["Fancy Bookshelf"]
    # Actually recipes are saved separately in "nadagotchi_recipes"

    verify_utils.inject_save(page, save_data)
    page.evaluate("localStorage.setItem('nadagotchi_recipes', '[\"Fancy Bookshelf\"]')")

    page.reload()

    if not verify_utils.start_game(page, saved=True):
        print("Failed to start game.")
        browser.close()
        return

    # Wait for game to load
    time.sleep(2)

    # Click Action Tab
    print("Clicking Action Tab")
    page.mouse.click(210, 477)
    time.sleep(1)

    # Click Craft Button
    print("Clicking Craft Button")
    page.mouse.click(324, 520)
    time.sleep(2)

    page.screenshot(path="verification_recipes.png") # Updated path to be local
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
