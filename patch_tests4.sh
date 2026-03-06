#!/bin/bash
sed -i 's/mockScene.nadagotchi.save = jest.fn();/mockScene.nadagotchi = { coins: 0, save: jest.fn() };/g' tests/DebugConsole.test.js
sed -i '/mockScene.nadagotchi = { coins: 0, save: jest.fn() };/d' tests/DebugConsole.test.js
sed -i '/mockScene = {/a \        nadagotchi: { coins: 0, save: jest.fn() },' tests/DebugConsole.test.js

# MainScene / LightingManager mock issue:
# FurnitureRegression.test.js
sed -i '/scene: mockScene/a \            textures: { exists: jest.fn().mockReturnValue(true) },' tests/FurnitureRegression.test.js
# HousingSystem.test.js
sed -i '/scene: mockScene/a \            textures: { exists: jest.fn().mockReturnValue(true) },' tests/HousingSystem.test.js
