
from playwright.sync_api import sync_playwright
import json
import base64

def setup_browser(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 800, 'height': 600})
    page = context.new_page()
    return page, context, browser

def inject_save(page, data):
    # Navigate to origin to set localStorage
    page.goto("http://localhost:5173")

    # 1. Base64 Encode
    json_str = json.dumps(data)
    encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')

    # 2. Hash (Simple DJB2 implementation matching PersistenceManager)
    def djb2_hash(s):
        hash_val = 0
        if len(s) == 0: return "0"
        for char in s:
            hash_val = ((hash_val << 5) - hash_val) + ord(char)
            hash_val = hash_val & 0xFFFFFFFF # Force 32-bit int
        return str(hash_val)

    salt = data.get('uuid', '')
    str_to_hash = encoded + salt
    hash_val = djb2_hash(str_to_hash)

    # 3. Format: encoded|hash
    save_string = f"{encoded}|{hash_val}"

    page.evaluate(f"localStorage.setItem('nadagotchi_save', '{save_string}')")
    print("Injected Save Data.")

def start_game(page):
    page.reload()
    # Wait for canvas
    page.wait_for_selector("canvas", state="visible")

    # Since we injected a save, the button is 'ENTER WORLD' (Resume)
    # Coordinates: Center (400, 300)
    page.mouse.click(400, 300)
