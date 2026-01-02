
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
        print("Entering House...")
        page.mouse.click(100, 520) # House Icon (Bottom Left-ish)
        time.sleep(1)
        page.screenshot(path="verification_housing_entryway.png")
        print("Captured Entryway screenshot.")

        # 2. Go to Living Room
        # "Go to Living Room" is index 0 of 1 connection.
        # X = 800 / 2 = 400. Y = 80.
        print("Navigating to Living Room...")
        page.mouse.click(400, 80)
        time.sleep(1)
        page.screenshot(path="verification_housing_livingroom.png")
        print("Captured Living Room screenshot.")

        # 3. Go to Kitchen
        # Living Room has [Entryway, Kitchen, Bedroom]
        # Index 1 is Kitchen. (Index 0 is Entryway)
        # X = (800 / 4) * 2 = 400. Y = 80.
        print("Navigating to Kitchen...")
        page.mouse.click(400, 80)
        time.sleep(1)
        page.screenshot(path="verification_housing_kitchen.png")
        print("Captured Kitchen screenshot.")

        # 4. Return to Living Room
        # Kitchen has [LivingRoom] (Index 0)
        # X = 400. Y = 80.
        print("Returning to Living Room...")
        page.mouse.click(400, 80)
        time.sleep(1)

        # 5. Go to Bedroom
        # Living Room has [Entryway, Kitchen, Bedroom]
        # Index 2 is Bedroom.
        # X = (800 / 4) * 3 = 600. Y = 80.
        print("Navigating to Bedroom...")
        page.mouse.click(600, 80)
        time.sleep(1)
        page.screenshot(path="verification_housing_bedroom.png")
        print("Captured Bedroom screenshot.")

        browser.close()

if __name__ == "__main__":
    verify_housing_ii()
