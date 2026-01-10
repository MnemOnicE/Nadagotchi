import time
from playwright.sync_api import sync_playwright
import verify_utils

def verify_archetype_animation(archetype, mood, output_filename):
    with sync_playwright() as p:
        page, context, browser = verify_utils.setup_browser(p)
        try:
            print(f"Verifying animation for {archetype} ({mood})...")

            # 1. Inject State
            # We need a pet with the specific archetype and mood
            save_data = {
                "uuid": "anim-test-uuid",
                "mood": mood,
                "dominantArchetype": archetype,
                "personalityPoints": { archetype: 100 }, # Ensure dominance
                "stats": { "hunger": 100, "energy": 100, "happiness": 100 },
                "skills": { "logic": 0, "navigation": 0 },
                "currentCareer": None,
                "inventory": {},
                "age": 1,
                "generation": 1,
                "homeConfig": { "rooms": { "Entryway": { "wallpaper": "wallpaper_default", "flooring": "flooring_default" } } }
            }

            # Set localStorage
            verify_utils.inject_save(page, save_data)

            # 2. Start Game
            verify_utils.start_game(page)

            # 3. Wait for MainScene
            # The game starts. The pet should be in the center.
            # We wait a bit for the animation loop to trigger (MainScene.update calls updateSpriteMood)
            time.sleep(2)

            # 4. Take Screenshot
            page.screenshot(path=output_filename)
            print(f"Screenshot saved to {output_filename}")

        except Exception as e:
            print(f"Error verifying {archetype}: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    # Verify a few key archetypes to ensure distinct poses/positions are captured
    verify_archetype_animation("Adventurer", "happy", "verification/anim_adventurer_happy.png")
    verify_archetype_animation("Nurturer", "happy", "verification/anim_nurturer_happy.png")
    verify_archetype_animation("Recluse", "sad", "verification/anim_recluse_sad.png")
