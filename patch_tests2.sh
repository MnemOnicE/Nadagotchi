#!/bin/bash
sed -i 's/MainScene.prototype.persistence = { _load: jest.fn().mockResolvedValue({}) };/MainScene.prototype.persistence = { _load: jest.fn().mockResolvedValue({}), _save: jest.fn().mockResolvedValue(true) };/g' tests/MainSceneCoverage.test.js
sed -i 's/MainScene.prototype.persistence = { _load: jest.fn().mockResolvedValue({}) };/MainScene.prototype.persistence = { _load: jest.fn().mockResolvedValue({}), _save: jest.fn().mockResolvedValue(true) };/g' tests/FurnitureRegression.test.js
sed -i 's/expect(mockUIScene.showToast).toHaveBeenCalledWith("Not Implemented", expect.stringContaining("No currency system"), expect.any(String));/expect(mockUIScene.showToast).toHaveBeenCalledWith("Added Coins", "+1000 Coins", "💰");/g' tests/DebugConsole.test.js
sed -i '/mockUIScene.showToast = jest.fn();/a \        mockScene.nadagotchi = { coins: 0, save: jest.fn() };' tests/DebugConsole.test.js
