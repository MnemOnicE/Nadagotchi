# Bug Report

**File:** `js/Nadagotchi.js`

**Line Number:** 462

**Description:**
The `updateDominantArchetype` method uses a greater-than-or-equal-to (`>=`) comparison to determine the archetype with the most personality points. This creates a bug when an action causes a new archetype's score to become equal to the current dominant archetype's score. Because the iteration order over the `personalityPoints` object is not guaranteed, the dominant archetype can unpredictably switch to the new, equally-scored archetype. This leads to unstable and unintuitive personality shifts for the user.

**Proposed Fix:**
The comparison operator will be changed from `>=` to `>`. This ensures that the dominant archetype only changes when a new archetype has a strictly higher point value, preventing unpredictable changes in the case of a tie.
