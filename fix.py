"""
WARNING: DO NOT EXECUTE THIS SCRIPT - IT WILL CORRUPT js/UIScene.js

This script performs blind string replacements on js/UIScene.js that are no longer
needed and would cause corruption if run.

CURRENT STATE OF UIScene.js:
- The file already has a properly implemented runTutorialSequence() method at line 848
- The file has duplicate method definitions that need to be cleaned up manually
- Running this script would inject duplicate code and break the syntax

HISTORICAL CONTEXT:
This script was created to fix syntax errors caused by orphaned code blocks:

1. Attempted to insert runTutorialSequence() method definition
   - Searched for: "const overlay = this.add.container(0, 0).setDepth(2000);"
   - Would have inserted method wrapper + variable declarations

2. Attempted to fix showDialogue method boundaries
   - Searched for: "let yOffset = 0; options.forEach(opt => {"
   - Would have inserted large block of tutorial UI code

RECOMMENDED ACTION:
Instead of running this script, the UIScene.js file needs manual cleanup to:
- Remove duplicate method definitions
- Ensure proper method boundaries
- Remove commented-out orphaned code blocks

This file is kept for historical reference only.
"""

import re

# Script disabled - do not execute
print(__doc__)
exit(1)
