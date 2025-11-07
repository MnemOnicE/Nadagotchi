# Bug Reporting

This document outlines the process for reporting and tracking bugs.

## How to Report a Bug

1.  **Search for existing issues:** Before submitting a new bug report, search the existing issues to see if the bug has already been reported.
2.  **Create a new issue:** If the bug has not already been reported, create a new issue and use the "Bug Report" template.
3.  **Provide detailed information:** Fill out the bug report template with as much detail as possible, including:
    *   A clear and concise description of the bug.
    *   Steps to reproduce the bug.
    *   The expected behavior.
    *   The actual behavior.
    *   Your environment (e.g., operating system, browser, etc.).

## Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

---

## Active Bug Reports

### Legacy Files in Root Directory

**Describe the bug**
The repository contains two files in the root directory, `game.js` and `style.css`, that appear to be dead code from a legacy, pre-Phaser version of the project.

**To Reproduce**
1.  Observe the file `Nadagotchi-main/game.js` (root).
2.  Observe the file `Nadagotchi-main/style.css` (root).
3.  Compare their contents to the current Phaser architecture (e.g., `index.html` does not load them, `js/game.js` is the real entry point, and `style.css` targets IDs like `game-world` that don't exist).

**Expected behavior**
The repository should only contain code that is actively used by the project to avoid confusion for new developers.

**Recommendation**
These two files (`game.js` and `style.css` in the root) should be deleted to clean up the repository.

### Happiness Stat Can Become Negative

**Describe the bug**
In `js/Nadagotchi.js`, the `live` method decrements the `happiness` stat for the 'Adventurer' archetype in 'Rainy' weather. However, unlike the `hunger` and `energy` stats, there is no check to prevent `happiness` from falling below zero. This can lead to an invalid state where the pet's happiness is a negative value, which could have unforeseen consequences in other parts of the game logic.

**To Reproduce**
Steps to reproduce the behavior:
1. Create a new `Nadagotchi` with the 'Adventurer' archetype.
2. Set the `worldState` to `{ weather: "Rainy" }`.
3. Call the `live()` method repeatedly in a loop.
4. Observe that the `nadagotchi.stats.happiness` value will eventually become negative.

**Expected behavior**
The `happiness` stat should never fall below 0, similar to the `hunger` and `energy` stats. It should be capped at a minimum of 0.

**File and Line Number**
- **File:** `js/Nadagotchi.js`
- **Line:** Approximately line 90, within the `live` method. The issue is the absence of a `if (this.stats.happiness < 0) this.stats.happiness = 0;` check after the happiness stat is decremented.

**Strategy for Fixing**
Add a bounds check immediately after the line that decrements happiness to ensure it cannot go below zero. Specifically, add `if (this.stats.happiness < 0) this.stats.happiness = 0;`.
