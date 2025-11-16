# Bug Report

**File:** `js/Nadagotchi.js`

**Line Number:** 462

**Description:**
The `updateDominantArchetype` method had flawed logic for handling tie-breaking in personality points. If there was a tie and the current dominant archetype wasn't one of the tied archetypes, the new dominant archetype was always the first one in the list of potential archetypes, rather than a random one. This was due to a misplaced `if` statement that made the random selection logic unreachable.

**Proposed Fix:**
The misplaced `if` statement was moved to ensure that `Phaser.Utils.Array.GetRandom` is called correctly, allowing a random archetype to be chosen in a tie-breaking scenario. A permanent non-regression test was also added to `tests/Nadagotchi_archetype_tiebreak.test.js` to verify the fix and prevent future regressions.
