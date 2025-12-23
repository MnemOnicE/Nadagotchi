import time
from playwright.sync_api import sync_playwright

def verify_bookshelf():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to 800x600 to match game config
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        print("Navigating to game...")
        page.goto("http://localhost:5173/")

        # Wait for game to load (StartScene)
        # We can wait for the canvas
        page.wait_for_selector("canvas", state="visible")

        # Wait a bit for Preloader to finish and StartScene to fade in
        time.sleep(2)

        print("Clicking ARRIVE...")
        # ARRIVE at 400, 300
        page.mouse.click(400, 300)

        time.sleep(1)

        print("Clicking Adventurer Basket...")
        # Adventurer Basket at 200, 330
        page.mouse.click(200, 330)

        # Wait for MainScene to load
        time.sleep(2)

        print("Taking screenshot...")
        # Capture the top-left corner where the bookshelf is (at 80, 80)
        # Bookshelf is 64x64. Position 80,80 is center or top-left?
        # Phaser sprites default origin is 0.5, 0.5.
        # If at 80, 80, it occupies roughly 48,48 to 112,112.
        # We'll capture 0,0 to 200,200 to be safe.
        page.screenshot(path="verification_bookshelf.png", clip={'x': 0, 'y': 0, 'width': 200, 'height': 200})

        browser.close()
        print("Done.")

if __name__ == "__main__":
    verify_bookshelf()
