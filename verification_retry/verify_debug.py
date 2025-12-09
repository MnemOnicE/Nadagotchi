
from playwright.sync_api import sync_playwright
import time

def verify_assets_console():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        try:
            page.goto("http://localhost:5173")
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        # Wait for canvas or error
        try:
            page.wait_for_selector("canvas", timeout=5000)
            print("Canvas found.")
        except:
            print("Canvas not found within timeout.")

        # Allow time for scripts to execute and potentially crash or render
        time.sleep(5)

        page.screenshot(path="verification_retry/debug_screenshot.png")
        print("Debug screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_assets_console()
