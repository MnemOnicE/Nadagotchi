
from playwright.sync_api import sync_playwright

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Clear storage
        page.goto("http://localhost:5173")
        page.evaluate("localStorage.clear()")
        page.reload()

        # Wait for canvas
        page.wait_for_selector("canvas", state="visible")
        page.wait_for_timeout(2000)

        viewport = page.viewport_size
        width = viewport['width']
        height = viewport['height']

        print(f"Viewport: {width}x{height}")

        # 2. Click "Arrive"
        # Logic: Button container at (width/2, height/2).
        # Button rect starts at (0,0) inside container.
        # Button size 250x60.
        # So click center of button: (width/2 + 125, height/2 + 30).
        arrive_x = width / 2 + 125
        arrive_y = height / 2 + 30

        print(f"Clicking Arrive at {arrive_x}, {arrive_y}")
        page.mouse.click(arrive_x, arrive_y)
        page.wait_for_timeout(1000)

        # 3. Select Archetype (Adventurer)
        # Logic: x = width/2 - 200. y = height * 0.55. Origin 0.5.
        arch_x = width / 2 - 200
        arch_y = height * 0.55

        print(f"Clicking Archetype at {arch_x}, {arch_y}")
        page.mouse.click(arch_x, arch_y)
        page.wait_for_timeout(2000) # Wait for MainScene load

        # Now in MainScene.
        # Tutorial might appear? "System Greeter".
        # Check logic: StartScene calls `start('MainScene', { startTutorial: true })`.
        # UIScene listens for START_TUTORIAL.
        # Tutorial modal appears.
        # I need to click "No" to close it?
        # "Yes" / "No".
        # ButtonFactory creates them centered.
        # Code: `noBtn = ButtonFactory.createButton(this, width/2 + 60, height/2 + 80, "No", ...)`
        # Container at (width/2 + 60, height/2 + 80).
        # Button size 100x40.
        # Click center: (width/2 + 60 + 50, height/2 + 80 + 20) = (width/2 + 110, height/2 + 100).

        no_x = width / 2 + 110
        no_y = height / 2 + 100
        print(f"Clicking Tutorial No at {no_x}, {no_y}")
        page.mouse.click(no_x, no_y)
        page.wait_for_timeout(1000)

        # 4. Screenshot CARE tab (Default)
        page.screenshot(path="verification/step1_care.png")

        # 5. Press '2' for ACTION tab
        print("Pressing '2'...")
        page.keyboard.press("2")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/step2_action.png")

        # 6. Press '3' for SYSTEM tab
        print("Pressing '3'...")
        page.keyboard.press("3")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/verification.png")

        print("Done.")
        browser.close()

if __name__ == "__main__":
    verify_ux()
