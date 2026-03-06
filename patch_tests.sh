#!/bin/bash
# Provide a fallback mock for _load on PersistenceManager in test files where it causes errors
# MainSceneCoverage.test.js
sed -i '/MainScene.prototype.checkMerchantVisibility = jest.fn();/a \
MainScene.prototype.persistence = { _load: jest.fn().mockResolvedValue({}) };\
MainScene.prototype.wikiSystem = { init: jest.fn().mockResolvedValue(true) };' tests/MainSceneCoverage.test.js

# FurnitureRegression.test.js
sed -i '/MainScene.prototype.renderLocation = jest.fn();/a \
MainScene.prototype.persistence = { _load: jest.fn().mockResolvedValue({}) };\
MainScene.prototype.wikiSystem = { init: jest.fn().mockResolvedValue(true) };' tests/FurnitureRegression.test.js
