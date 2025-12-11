from playwright.sync_api import sync_playwright, Page

def debug_clicks(page: Page):
    print("Navigating...")
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", state="visible")
    page.wait_for_timeout(2000)

    # 1. New Game
    print("Clicking New Game...")
    page.mouse.click(640, 360)
    page.wait_for_timeout(1000)

    # 2. Adventurer
    print("Clicking Adventurer...")
    page.mouse.click(440, 400)
    page.wait_for_timeout(4000) # Give plenty of time for scene start and tutorial

    page.screenshot(path="verification/debug_1_greeter.png")

    # 3. Click No
    print("Clicking No...")
    page.mouse.click(700, 440)
    page.wait_for_timeout(1000)

    page.screenshot(path="verification/debug_2_after_no.png")

    # 4. Click System
    print("Clicking System...")
    page.mouse.click(280, 560)
    page.wait_for_timeout(1000)

    page.screenshot(path="verification/debug_3_system.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()
        try:
            debug_clicks(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
