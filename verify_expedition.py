from playwright.sync_api import sync_playwright
import time

def run(page):
    print("Navigating...")
    page.goto("http://localhost:5173/index.html")

    print("Waiting for canvas...")
    page.wait_for_selector("canvas", timeout=10000)

    # Wait for Preloader
    time.sleep(3)

    print("Clicking ARRIVE (New Game)...")
    page.mouse.click(400, 300)
    time.sleep(2)

    print("Clicking Archetype (Adventurer)...")
    page.mouse.click(200, 330)
    time.sleep(2)

    # Skip Tutorial (Click "No" at 460, 380)
    print("Skipping Tutorial...")
    page.mouse.click(460, 380)
    time.sleep(1)

    # Click ACTION tab (Center approx 210, 410)
    print("Clicking ACTION tab...")
    page.mouse.click(210, 410)
    time.sleep(1)

    # Click Explore (First button, approx 80, 460)
    print("Clicking Explore...")
    page.mouse.click(80, 460)

    # Wait for Expedition Scene
    time.sleep(2)

    print("Taking screenshot...")
    page.screenshot(path="verification_expedition.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 800, "height": 600})
    try:
        run(page)
    except Exception as e:
        print(f"Error: {e}")
    browser.close()
