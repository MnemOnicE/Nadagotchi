#!/bin/bash
sed -i 's/mockScene.nadagotchi = { coins: 0, save: jest.fn() };/mockScene.nadagotchi = { coins: 0, save: jest.fn() }; mockScene.nadagotchi.save = jest.fn();/g' tests/DebugConsole.test.js

# Patch WikiSystem to check if persistence._load exists
sed -i 's/const data = await this.persistence._load("nadagotchi_wiki");/const data = (this.persistence && this.persistence._load) ? await this.persistence._load("nadagotchi_wiki") : null;/g' js/WikiSystem.js
sed -i 's/await this.persistence._save/if(this.persistence && this.persistence._save) await this.persistence._save/g' js/WikiSystem.js
