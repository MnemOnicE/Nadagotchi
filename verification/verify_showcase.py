from playwright.sync_api import sync_playwright
import time

def verify_showcase():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        # Clear local storage to ensure New Game state
        page.goto("http://localhost:5173/")
        page.evaluate("localStorage.clear()")
        page.reload()

        # Wait for canvas
        page.wait_for_selector("canvas", state="visible")
        # Give it a moment to render StartScene
        time.sleep(2)

        # 1. Click "ARRIVE" (New Game) - Center screen (400, 300)
        page.mouse.click(400, 300)
        time.sleep(1)

        # 2. Click "Adventurer" Archetype - Left side (200, 330)
        page.mouse.click(200, 330)

        # 3. Wait for MainScene / Tutorial
        # Tutorial asks "Yes/No". "No" is at (400 + 60, 300 + 80) = (460, 380).
        time.sleep(2)
        page.mouse.click(460, 380) # Click No on tutorial
        time.sleep(1)

        # 4. Press '3' to open System Tab
        page.keyboard.press("3")
        time.sleep(0.5)

        # 5. Click "Passport" Button
        # It's the first button in System tab.
        # Layout: x starts at 20. Button width approx 130-140. Center roughly (90, 500).
        # y = 600 - 150 + 50 = 500.
        page.mouse.click(90, 500)
        time.sleep(1)

        # 6. Take Screenshot
        page.screenshot(path="verification/verify_showcase.png")
        print("Screenshot taken: verification/verify_showcase.png")

        browser.close()

if __name__ == "__main__":
    verify_showcase()
