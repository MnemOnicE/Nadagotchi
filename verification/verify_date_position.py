from playwright.sync_api import sync_playwright

def verify_date_text(page):
    page.goto("http://localhost:5173")

    width = 800
    height = 600
    page.set_viewport_size({"width": width, "height": height})

    # Wait for game canvas
    page.wait_for_selector("canvas")

    # Wait for game to initialize (canvas visible)
    page.wait_for_timeout(3000)

    # Click "New Game"
    # StartScene code: this.startGameButton = ButtonFactory.createButton(this, width / 2, buttonY, ...
    # buttonY starts at height * 0.5. If existing pet, +80.
    # To be safe, let's assume no pet (incognito/new session) or we might click "Enter World" if pet exists.
    # The screenshot showed "Choose your Welcome Basket" which means I successfully clicked "New Game".
    # But for a robust script, I should probably handle both.
    # But since I am running a fresh incognito instance, likely no existing pet.

    # Click center, slightly lower.
    # If "New Game" is the only button, it's at height * 0.5. (300)
    # If "Enter World" exists, "New Game" is at 300 + 80 = 380.
    # I'll try clicking 300 first. If that takes me to archetype selection, good.
    # Wait, the previous run worked with `height / 2 + 50` = 350.
    # So let's stick to that for the first click.

    page.mouse.click(width / 2, height / 2 + 50)

    page.wait_for_timeout(1000)

    # Now select archetype (Nurturer, center)
    # x = 400, y = 330
    page.mouse.click(400, 330)

    # Wait for MainScene to load
    page.wait_for_timeout(5000)

    # Take screenshot
    page.screenshot(path="verification/date_text_position.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_date_text(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
