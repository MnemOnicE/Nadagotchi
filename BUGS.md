# Bug Report

**File:** `js/Nadagotchi.js`

**Line Number:** 401

**Description:**
The `updateDominantArchetype` method uses a strict greater-than (`>`) comparison to determine the archetype with the most personality points. This creates a bug when an action causes a new archetype's score to become equal to the current dominant archetype's score. The new archetype is not selected, and the dominant archetype only changes when the new score is strictly greater. This results in a delay in the archetype changing, which means the user does not get the immediate benefits (like mood changes or different skill gains) of their actions in the same turn.

**Proposed Fix:**
The comparison operator will be changed from `>` to `>=`. This ensures that in the case of a tie, the archetype that was just updated will become the new dominant archetype, making the change immediate and aligning the game's logic with the player's actions.
