**File:** `js/Nadagotchi.js`
**Line:** 500-503
**Description:** In `updateDominantArchetype`, there is a syntax error where an `if` statement is incorrectly placed after `this.dominantArchetype = Phaser.Utils.Array.GetRandom(potentialDominantArchetypes);`. This misplaced `if` statement is also redundant, as the logic to handle the incumbent archetype is already covered. The result is that in a tie where the incumbent is not involved, the archetype is not correctly and deterministically updated, potentially causing unpredictable personality shifts.
**Fix:** The erroneous `if` statement and the non-deterministic call to `Phaser.Utils.Array.GetRandom` have been removed. The logic is now corrected to ensure that when a tie occurs and the incumbent archetype is not involved, the dominant archetype is reliably set to the first archetype in the `potentialDominantArchetypes` array. This makes the outcome predictable, fixes the logical flaw, and prevents flaky tests.

---

**File:** `tests/Nadagotchi.test.js`
**Line:** 296
**Description:** Missing closing braces `});` for the test case 'interact should improve relationships and specific skills based on the NPC', causing syntax errors and preventing subsequent tests from running correctly.
**Fix:** Added the missing `});` to close the test block properly.

---

**File:** `js/Nadagotchi.js`
**Line:** 375
**Description:** Syntax error due to duplicated and conflicting definitions of the `interact` method. The code contains two partial implementations, one starting with `interact(npcName, interactionType)` and another with `interact(npcName, interactionType = 'CHAT')`, leading to a syntax error.
**Fix:** Merged the two method implementations into a single, comprehensive `interact` method that handles both general interactions and specific 'GIFT' logic, ensuring correct syntax and functionality.

---

**File:** `js/MainScene.js`
**Line:** 160
**Description:** Syntax error and duplicate/conflicting method definition for `handleUIAction`. One implementation uses `if/else` and handles furniture placement, while the other uses `switch` and handles NPC interactions. The first implementation is not closed properly.
**Fix:** Merged the logic from both conflicting definitions into a single, unified `handleUIAction` method that uses a `switch` statement for action types and handles furniture placement correctly.

---

**File:** `js/Nadagotchi.js`
**Line:** 318
**Description:** The `craftItem` method allows crafting items defined in `this.recipes` even if the recipe has not been added to `this.discoveredRecipes`. This allows players to craft items they haven't learned yet.
**Fix:** Add a check in `craftItem` to verify that `itemName` is present in `this.discoveredRecipes`. Additionally, ensure default recipes (like "Fancy Bookshelf") are added to `discoveredRecipes` upon initialization.

---

**File:** `js/Nadagotchi.js`
**Line:** 127
**Description:** The game logic allows players to discover recipes ("Logic-Boosting Snack" and "Stamina-Up Tea") through actions, but these recipes are not defined in the `this.recipes` object. As a result, even after discovery, players cannot craft these items, receiving a "I don't know the recipe" error.
**Fix:** Add definitions for "Logic-Boosting Snack" and "Stamina-Up Tea" to `this.recipes` in the `Nadagotchi` constructor, using available materials.

---

**File:** `js/MainScene.js`
**Line:** 210
**Description:** Minigames and career successes grant flat skill and happiness bonuses, allowing players to easily max out stats by grinding a single minigame.
**Fix:** Implemented diminishing returns for skill and happiness gains in `handleWorkResult`. Skill gain now scales inversely with current skill level, and happiness gain decreases as it approaches the maximum.

---

**File:** `js/PersistenceManager.js`
**Line:** 9
**Description:** Game data is saved to `localStorage` as plain JSON, allowing trivial modification (save scumming) by editing the stored string.
**Fix:** Updated `PersistenceManager` to encode save data using Base64 and append a simple hash for integrity verification. The loader now validates the hash and decodes the data, while maintaining backward compatibility for legacy plain JSON saves.
**File:** `js/Nadagotchi.js`
**Line:** 400
**Description:** Although the `Genome` class calculates `isHomozygous<Archetype>` flags, they are not used in `Nadagotchi.js`, resulting in missing gameplay bonuses for pure-bred pets.
**Fix:** Implemented specific stat bonuses in `handleAction` for each homozygous personality trait (e.g., refunds energy for Mischievous, happiness boost for Adventurer).

---

**File:** `js/GeneticsSystem.js`
**Line:** 110
**Description:** The `envMap` used for determining environmental influence on breeding is too sparse, ignoring most inventory items and limiting player agency.
**Fix:** Expanded `envMap` to include high-value crafted items (e.g., 'Fancy Bookshelf') and raw resources, mapping them to relevant genes.

---

**File:** `js/Nadagotchi.js`
**Line:** 660
**Description:** The Artisan quest stage 2 check ("Masterwork Crafting") only verifies the presence of a "Masterwork Chair" in the inventory. This allows players to bypass the crafting requirement by acquiring the item through other means (e.g., cheats or future rewards).
**Fix:** Modified `craftItem` to set a specific flag (`hasCraftedChair`) on the quest object when the required item is crafted during the active quest stage. Updated `_handleArtisanQuest` to check for this flag instead of just inventory presence.
**Line:** 770
**Description:** Tie-breaking for the dominant archetype relies on internal list order (deterministic but arbitrary), which can feel non-intuitive to players who expect their pet's skills to matter.
**Fix:** Updated `updateDominantArchetype` to break ties by comparing the relevant skills associated with each archetype (e.g., Logic+Research for Intellectual) before falling back to list order.

---

**File:** `js/ItemData.js`
**Line:** N/A
**Description:** The `BreedingScene.js` references several items (e.g., 'Ancient Tome', 'Heart Amulet', 'Muse Flower', 'Nutrient Bar', 'Espresso', 'Chamomile') intended for environmental influence during breeding. However, these items are missing from `ItemDefinitions` in `js/ItemData.js` and are not currently obtainable in the game (no recipes or drop sources). This renders the "Inventory-Gated Breeding" security fix effectively a feature disablement for these specific items until they are properly implemented.
**Fix:** Define these items in `ItemDefinitions` and add them to loot tables (e.g., `forage`) or crafting recipes to make them obtainable for legitimate players.

---

**File:** `js/Nadagotchi.js`, `js/Config.js`
**Line:** `Nadagotchi.js` ~790 (interact method)
**Description:** NPC interactions (Chat) do not consume energy but provide significant stat and skill gains (Happiness, Communication, Navigation, etc.). This allows players to spam the interaction button to maximize stats and skills instantly without resource cost, breaking game balance.
**Fix:** Add `ENERGY_COST` to `INTERACT_NPC` in `js/Config.js`. Update `Nadagotchi.interact` to check for sufficient energy and deduct it. If energy is insufficient, return `null` and log a journal entry explaining the fatigue. Update `MainScene` to handle the `null` return by skipping the dialogue modal.
