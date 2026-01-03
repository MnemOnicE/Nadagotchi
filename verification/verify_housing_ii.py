
import sys
import os
import time
from playwright.sync_api import sync_playwright

def start_game(page):
    # Navigate to the game (local vite server)
    page.goto("http://localhost:5173/")
    # Wait for game to load (the canvas)
    page.wait_for_selector("canvas")

def verify_housing_ii():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        print("Starting Game...")
        start_game(page)

        # New Game -> Select Archetype -> Skip Tutorial
        print("Navigating through New Game flow...")
        page.mouse.click(400, 300) # ARRIVE (New Game)
        time.sleep(1)
        page.mouse.click(200, 330) # Select Adventurer (Left basket)
        time.sleep(1)
        page.mouse.click(460, 380) # Dismiss Tutorial (No)
        time.sleep(2)

        # 1. Enter House (Entryway)
        print("Entering House (via evaluate)...")
        # Direct call to bypass input flakiness and verify Rendering System
        page.evaluate("window.mainScene.enterHouse()")
        time.sleep(1)
        page.screenshot(path="verification_housing_entryway.png")
        print("Captured Entryway screenshot.")

        # 2. Go to Living Room
        print("Navigating to Living Room (via evaluate)...")
        page.evaluate("window.mainScene.changeRoom('LivingRoom')")
        time.sleep(1)
        page.screenshot(path="verification_housing_livingroom.png")
        print("Captured Living Room screenshot.")

        # 3. Go to Kitchen
        print("Navigating to Kitchen (via evaluate)...")
        page.evaluate("window.mainScene.changeRoom('Kitchen')")
        time.sleep(1)
        page.screenshot(path="verification_housing_kitchen.png")
        print("Captured Kitchen screenshot.")

        # 4. Go to Bedroom (Jump for speed, skipping return to LivingRoom)
        print("Navigating to Bedroom (via evaluate)...")
        page.evaluate("window.mainScene.changeRoom('Bedroom')")
        time.sleep(1)
        page.screenshot(path="verification_housing_bedroom.png")
        print("Captured Bedroom screenshot.")

        browser.close()

if __name__ == "__main__":
    verify_housing_ii()
