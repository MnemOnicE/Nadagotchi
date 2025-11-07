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
