#!/bin/bash
sed -i 's/this.persistence.loadRaw/this.persistence._load/g' js/WikiSystem.js
sed -i 's/this.persistence.saveRaw/this.persistence._save/g' js/WikiSystem.js
