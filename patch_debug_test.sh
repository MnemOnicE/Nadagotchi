#!/bin/bash
sed -i 's/mockScene = {/mockScene = {\n        nadagotchi: { coins: 0, save: jest.fn() },/g' tests/DebugConsole.test.js
