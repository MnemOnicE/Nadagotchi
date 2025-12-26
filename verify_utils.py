
import json
import time

def setup_browser(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Ensure localStorage is accessible by navigating to the page first
    context = browser.new_context(viewport={'width': 800, 'height': 600})
    page = context.new_page()
    return page, context, browser

def inject_save(page, save_data):
    """
    Injects save data into localStorage for "nadagotchi_save".
    This allows the game to detect an existing save and show "RESUME" / "ENTER WORLD".
    """
    # Navigate to the domain first so localStorage access is allowed
    # We use a simple lightweight check or just go to index
    if page.url == "about:blank":
        try:
            page.goto("http://localhost:5173/")
        except Exception as e:
            print(f"Failed to navigate for injection: {e}")
            return

    legacy_save = json.dumps(save_data)
    page.evaluate(f"localStorage.setItem('nadagotchi_save', '{legacy_save}')")

def start_game(page, saved=False):
    """
    Handles the flow from Start Screen to Main Scene.
    If 'saved' is True, it expects to click "ENTER WORLD".
    If 'saved' is False, it expects to click "ARRIVE" -> "Archetype Basket".
    """
    print("Navigating to game...")
    # If we are already on the page (from injection), we might need to reload or just continue
    if page.url != "http://localhost:5173/":
        try:
            page.goto("http://localhost:5173/")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return False
    else:
        # If we injected data, we must reload for the game to read it on init
        page.reload()

    try:
        page.wait_for_selector("canvas", state="visible", timeout=10000)
    except:
        print("Canvas not found.")
        return False

    # Wait for Preloader to finish
    time.sleep(4)

    if saved:
        print("Clicking ENTER WORLD (Resume)...")
        # Resume button is at 400, 300
        page.mouse.click(400, 300)
        time.sleep(2)

        # Check if tutorial appears (it shouldn't for resumed games usually, but verify_furniture checks for it)
        # If the save data was injected manually without proper flags, maybe?
        # But let's assume if it's there, we click "No" (460, 380) just in case.
        # We can't easily know if it's there without visual check, so blind click is risky but common.
        # Ideally, we don't click unless we know.
        # But if the game is already in MainScene, clicking 460, 380 might click something else.
        # 460, 380 is in the main view area.
        pass

    else:
        print("Clicking ARRIVE (New Game)...")
        # ARRIVE is at 400, 300 if no save exists.
        # If a save exists but we want new game, ARRIVE is at 400, 380.
        # But if saved=False, we assume we didn't inject a save.
        page.mouse.click(400, 300)
        time.sleep(2)

        print("Clicking Adventurer Basket...")
        page.mouse.click(200, 330)
        time.sleep(2)

        print("Dismissing Tutorial (if any)...")
        # "No" is around 460, 380
        page.mouse.click(460, 380)
        time.sleep(1)

    return True

def get_default_save_data():
    return {
        "uuid": "test-uuid-generic",
        "mood": "happy",
        "dominantArchetype": "Adventurer",
        "personalityPoints": {"Adventurer": 10},
        "stats": {"hunger": 100, "energy": 100, "happiness": 100},
        "skills": {},
        "inventory": {},
        "age": 0,
        "generation": 1,
        "isLegacyReady": False,
        "legacyTraits": [],
        "moodSensitivity": 5,
        "hobbies": {"painting": 0, "music": 0},
        "relationships": {},
        "quests": {},
        "location": "Home"
    }
