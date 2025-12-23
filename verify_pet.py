import time
from playwright.sync_api import sync_playwright

def verify_pet():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        print("Navigating to game...")
        page.goto("http://localhost:5173/")

        page.wait_for_selector("canvas", state="visible")
        time.sleep(2)

        print("Clicking ARRIVE...")
        page.mouse.click(400, 300)
        time.sleep(1)

        print("Clicking Adventurer Basket...")
        page.mouse.click(200, 330)

        time.sleep(2)

        print("Taking screenshot...")
        page.screenshot(path="verification_pet.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    verify_pet()
