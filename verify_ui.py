
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 800, "height": 600})

        try:
            await page.goto('http://localhost:5173/', timeout=10000)
        except:
            return

        await page.wait_for_selector('canvas')

        await page.evaluate("""
            localStorage.setItem('nadagotchi_save', JSON.stringify({
                stats: { hunger: 50, energy: 50, happiness: 50 },
                mood: 'neutral',
                dominantArchetype: 'Adventurer',
                location: 'GARDEN',
                currentCareer: 'Scout'
            }));
            localStorage.setItem('nadagotchi_calendar', JSON.stringify({ day: 1, season: 'Spring', year: 1 }));
        """)

        await page.reload()
        await page.wait_for_selector('canvas')

        # Click Enter World
        await page.mouse.click(400, 300)
        await page.wait_for_timeout(3000)

        await page.screenshot(path='verification/verify_main_ui.png')

        # Click SYSTEM Tab
        print('Clicking SYSTEM Tab...')
        await page.mouse.click(340, 410)
        await page.wait_for_timeout(500)

        # Click Journal Button (First row, usually 3rd button?)
        # Let's just click around the grid area.
        # Buttons start at Y = dashboardY + 50 = 390 + 50 = 440.
        # X starts at 20.
        # Journal is usually 3rd in SYSTEM list: Passport, Career, Journal.
        # Passport width ~100. Career ~100. Journal ~100.
        # X ~ 20 + 130 + 130 = 280.
        print('Clicking Journal Button...')
        await page.mouse.click(280, 460)
        await page.wait_for_timeout(1000)

        await page.screenshot(path='verification/verify_journal_ui.png')

        # Close Modal
        await page.mouse.click(610, 130)
        await page.wait_for_timeout(500)

        # Click House to Enter (x=100, y=gameHeight-80 = 390-80 = 310)
        print('Clicking House...')
        await page.mouse.click(100, 310)
        await page.wait_for_timeout(2000)

        await page.screenshot(path='verification/verify_indoor_light.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
