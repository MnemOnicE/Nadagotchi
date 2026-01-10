import time
from playwright.sync_api import sync_playwright
import verify_utils

def verify_lighting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use verify_utils to setup browser and context
        page, context, browser = verify_utils.setup_browser(p)

        # 1. Inject Game State (Time = Night)
        # We need a state where time is 'Night'.
        # According to logic, Night/Dusk triggers visibility.
        # We can try to manipulate worldState via JS execution.

        print("Starting game...")
        verify_utils.start_game(page)

        # Wait for game to load
        time.sleep(2)

        # Force Night time via console injection
        # MainScene stores worldState.
        print("Injecting Night state...")
        page.evaluate("""
            const scene = window.mainScene;
            if (scene) {
                scene.worldState.time = 'Night';
                // Trigger update manually or wait for loop
                scene.lightingManager.update();
            }
        """)

        time.sleep(1)

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification_lighting.png")

        browser.close()

if __name__ == "__main__":
    verify_lighting()
