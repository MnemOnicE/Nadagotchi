
from playwright.sync_api import sync_playwright

def setup_browser(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 800, 'height': 600})
    page = context.new_page()
    return page, context, browser

def start_game(page):
    page.goto("http://localhost:5173")
    # Wait for canvas
    page.wait_for_selector("canvas", state="visible")

    # Click ARRIVE if it exists (New Game)
    # Check if 'ARRIVE' text is present on canvas? No, canvas is black box.
    # We blindly click where ARRIVE usually is (400, 300)
    page.mouse.click(400, 300)

    # Select archetype (200, 330)
    page.mouse.click(200, 330)

    # Dismiss tutorial (460, 380 - 'No')
    page.mouse.click(460, 380)
