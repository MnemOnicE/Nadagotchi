
from playwright.sync_api import sync_playwright
import time
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 800, "height": 600})

        # 1. Navigate to game to initialize localStorage availability
        print("Navigating to game...")
        page.goto("http://localhost:5173/")

        # 2. Inject Legacy Save State
        save_data = {
            "uuid": "test-uuid-123",
            "mood": "neutral",
            "dominantArchetype": "Adventurer",
            "stats": {"hunger": 100, "energy": 100, "happiness": 100},
            "skills": {"logic": 0, "navigation": 0, "research": 0},
            "inventory": {"Fancy Bookshelf": 1}, # KEY ITEM
            "recipes": {"Fancy Bookshelf": {}},
            "discoveredRecipes": ["Fancy Bookshelf"],
            "age": 1,
            "generation": 1,
            "relationships": {},
            "location": "Home"
        }

        print("Injecting Save Data...")
        page.evaluate(f"localStorage.setItem('nadagotchi_save', '{json.dumps(save_data)}');")

        # 3. Reload to pick up save
        print("Reloading...")
        page.reload()

        # 4. Wait for canvas
        try:
            page.wait_for_selector("canvas", timeout=10000)
        except Exception:
            print("Canvas not found!")
            browser.close()
            return

        # 5. Handle Start Screen - Click "ENTER WORLD" (Resume)
        # Coordinates: 400, 300 (Center)
        time.sleep(2)
        print("Clicking 'ENTER WORLD'...")
        page.mouse.click(400, 300)

        # 6. Wait for Main Scene
        time.sleep(2)

        # 7. Open "SYSTEM" tab
        # Tab 3 (SYSTEM) x pos ~280, y ~410
        print("Opening SYSTEM tab...")
        page.mouse.click(280, 410)
        time.sleep(1)

        # 8. Click "Decorate"
        # In the grid. We can try to find it by text via OCR? No.
        # Let's try clicking the likely position.
        # "Passport", "Career", "Journal", "Inventory", "Recipes", "Hobbies", "Achievements", "Showcase", "Decorate"
        # It's the 9th button.
        # Grid logic in UIScene:
        # x starts at 20. Width varies.
        # This is hard to guess.
        # BUT wait! I added code to `UIScene.js` to enable "Move Furniture" button IN the modal.
        # If I can't reliably click "Decorate", I can't open the modal.

        # Alternative: The "Decorate" button text length is 8 chars. width = 8*12 + 40 = 136.
        # Let's try to calculate.
        # Row 1: Passport (~136), Career (~112), Journal (~124), Inventory (~148). Total > 500. Wraps?
        # Game width 800.
        # 20 + 136 + 15 + 112 + 15 + 124 + 15 + 148 = 585. Fits in one row?
        # Row 2: Recipes (~124), Hobbies (~124), Achievements (~184), Showcase (~136).
        # Row 3: Decorate (~136), Settings (~136), Retire.
        # So "Decorate" should be at the start of Row 3?
        # Or Row 2 if wrapping is different.

        # Let's try a "blind" click strategy or use image recognition (not available).
        # OR: I can use my earlier trick of `page.evaluate` to EMIT the event, effectively bypassing the button click!
        # The game instance is local, BUT events are global on `game.events`.
        # Is `game` global? `window.game`?
        # `js/game.js` defines `const game = new Phaser.Game(config);`. It does NOT attach to window.
        # So I cannot access `game` from console.

        # Okay, I must click.
        # Let's try to take a screenshot of the System tab first to see where the button is.
        print("Taking screenshot of System Tab...")
        page.screenshot(path="verification/system_tab.png")

        # Based on visual, I will guess coordinates.
        # Let's assume it's near (100, 500).
        print("Attempting to click 'Decorate' at estimated coords...")
        page.mouse.click(100, 500)
        time.sleep(1)

        # 9. Verify Decorate Modal
        print("Taking screenshot of Decorate Modal...")
        page.screenshot(path="verification/decorate_modal.png")

        # 10. Click "Move Furniture"
        # Bottom of modal. Center X=400. Y=440.
        print("Clicking 'Move Furniture'...")
        page.mouse.click(400, 440)
        time.sleep(1)

        print("Taking screenshot of Decoration Mode...")
        page.screenshot(path="verification/decoration_mode.png")

        browser.close()

if __name__ == "__main__":
    run()
