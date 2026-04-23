from playwright.sync_api import sync_playwright
import os

def run_verification(page):
    print("Navigating to http://127.0.0.1:5173/index.html")
    page.goto("http://127.0.0.1:5173/index.html", wait_until="networkidle")
    page.wait_for_timeout(2000)

    # Trigger error
    page.evaluate("""
        window.onerror('XSS TEST: <img src=x onerror=window.xss_done=true>', 'test.js', 123, 456, new Error('Stack Trace Test'));
    """)

    page.wait_for_selector("h3:has-text('CRASH DETECTED')")
    page.wait_for_timeout(1000)

    # Screenshot
    page.screenshot(path="/home/jules/verification/screenshots/error_handler_fix.png")

    # Check XSS
    xss_done = page.evaluate("window.xss_done")
    print(f"XSS Done: {xss_done}")

    # Check if payload is rendered as text
    content = page.locator("body").text_content()
    if '<img src=x onerror=window.xss_done=true>' in content:
        print("Payload correctly rendered as text.")
    else:
        print("Payload NOT found in text content.")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/videos")
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
