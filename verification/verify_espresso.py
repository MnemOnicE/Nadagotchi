from playwright.sync_api import sync_playwright

def verify_espresso(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PageError: {exc}"))

    page.goto('http://localhost:5173')

    # Wait for canvas
    page.wait_for_selector('canvas', state='visible')

    # Wait a moment for scene to render
    page.wait_for_timeout(3000)

    # Take screenshot of the Breeding Scene.
    page.screenshot(path="verification/espresso_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_espresso(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
