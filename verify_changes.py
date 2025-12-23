from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to match game config for consistent coordinate interactions
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        # Navigate to the game (local vite server)
        page.goto("http://localhost:5173/")

        # Wait for game to load (the canvas)
        page.wait_for_selector("canvas")

        # --- 1. Pass 'Click to Arrive' Screen ---
        # Center click (400, 300)
        page.mouse.click(400, 300)
        page.wait_for_timeout(500)

        # --- 2. Pass 'Start New Game' Screen ---
        # Assume "New Game" button or interaction needed.
        # Based on previous tests/knowledge, archetype selection might be needed.
        # Click somewhat centrally or on expected button location.
        # Let's try clicking 'Arrive' again if it persists or selection.
        # Clicking 'Adventurer' archetype (approx 200, 330 based on memory/docs)
        page.mouse.click(200, 330)
        page.wait_for_timeout(500)

        # --- 3. Pass 'System Greeter' Tutorial ---
        # The tutorial modal appears. We added .setInteractive to bg, but "No" button should still work.
        # "No" button is at offset (60, 80) from center (400, 300) -> 460, 380.
        page.mouse.click(460, 380)
        page.wait_for_timeout(1000) # Wait for scene resume

        # --- VERIFICATION 1: Initial Y Positions ---
        # We can't easily assert sprite positions in canvas via Playwright without hooking into JS.
        # But we can take a screenshot to visually inspect.
        # Bookshelf (80, 250), Plant (720, 250), Artisan (500, 250).
        # Previously they were at Y=80 (top). Now they should be lower (Y=250).

        page.screenshot(path="/home/jules/verification/mainscene_positions.png")
        print("Screenshot taken: mainscene_positions.png")

        # --- VERIFICATION 2: Job Board Modal Soft-Lock ---
        # Click Job Board Button (Bottom Right, ~670, 540)
        page.mouse.click(670, 540)
        page.wait_for_timeout(500)

        # Modal should be open.
        # Click "outside" the modal buttons but "inside" the modal background/screen to test .setInteractive() blocking.
        # If blocking works, clicks shouldn't pass through to the game world.
        # We can't easily verify "no pass through" visually, but we can verify the modal is visible.
        page.screenshot(path="/home/jules/verification/jobboard_modal.png")
        print("Screenshot taken: jobboard_modal.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
