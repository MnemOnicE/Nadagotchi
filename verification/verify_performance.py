
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_game_running(page: Page):
    page.goto("http://localhost:5173/")

    # Wait for canvas
    canvas = page.locator("canvas")
    expect(canvas).to_be_visible(timeout=10000)

    time.sleep(2)
    page.screenshot(path="verification/step1_menu.png")

    # Click "ARRIVE (New Game)" at center (400, 300)
    # Note: ButtonFactory hit area is centered.
    page.mouse.click(400, 300)

    time.sleep(1)
    page.screenshot(path="verification/step2_selection.png")

    # Click "Adventurer" at (200, 330)
    page.mouse.click(200, 330)

    time.sleep(3)
    page.screenshot(path="verification/step3_game.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 800, "height": 600})
        try:
            verify_game_running(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
