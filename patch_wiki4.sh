#!/bin/bash
cat << 'INNER_EOF' > js/WikiSystem.js
export class WikiSystem {
    constructor(persistenceManager) {
        this.persistence = persistenceManager;
        this.entries = {}; // e.g. { "pets": ["Slime", "Robot"], "items": ["Apple"] }
        this.categories = ["pets", "items", "careers", "locations", "mechanics"];
        this.isReady = false;
    }

    async init() {
        await this.load();
        this.isReady = true;
    }

    async load() {
        const data = (this.persistence && this.persistence._load) ? await this.persistence._load("nadagotchi_wiki") : null;
        if (data) {
            this.entries = data.entries || {};
            // Ensure all categories exist
            this.categories.forEach(cat => {
                if (!this.entries[cat]) {
                    this.entries[cat] = [];
                }
            });
        } else {
            // Initialize empty categories
            this.categories.forEach(cat => {
                this.entries[cat] = [];
            });
            await this.save();
        }
    }

    async save() {
        if (this.persistence && this.persistence._save) {
            await this.persistence._save("nadagotchi_wiki", {
                entries: this.entries
            });
        }
    }

    async unlockEntry(category, entryId) {
        if (!this.categories.includes(category)) {
            console.warn(`Invalid wiki category: ${category}`);
            return false;
        }

        if (!this.entries[category].includes(entryId)) {
            this.entries[category].push(entryId);
            await this.save();
            return true; // Newly unlocked
        }
        return false; // Already unlocked
    }

    hasEntry(category, entryId) {
        return this.entries[category] && this.entries[category].includes(entryId);
    }

    getEntries(category) {
        return this.entries[category] || [];
    }
}
INNER_EOF
