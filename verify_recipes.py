from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 800, 'height': 600})

    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.goto("http://localhost:5173")

    # Wait for game to load
    page.wait_for_timeout(3000)

    # Click Action Tab
    print("Clicking Action Tab")
    page.mouse.click(210, 477)
    page.wait_for_timeout(1000)

    # Click Craft Button
    print("Clicking Craft Button")
    page.mouse.click(324, 520)
    page.wait_for_timeout(2000)

    page.screenshot(path="/home/jules/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
