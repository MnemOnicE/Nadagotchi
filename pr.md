🎯 **What:** Removed the unused `SoundSynthesizer` import from `js/ExpeditionScene.js` and cleaned up some unused variables that were flagged by ESLint during the process.

💡 **Why:** This improves maintainability by removing unnecessary dependencies and dead code, reducing confusion and keeping the file clean.

✅ **Verification:** Verified by running the full test suite (`npm test`), which passed, and running the linter (`npx eslint js/ExpeditionScene.js`) which now no longer reports errors for this file. The `SoundSynthesizer` was confirmed to not be referenced anywhere in the file.

✨ **Result:** A cleaner `ExpeditionScene.js` file with no unused imports or useless assignments.
