"""
WARNING: DO NOT EXECUTE THIS SCRIPT

This script previously applied line-based patches to js/UIScene.js to comment out
orphaned code blocks. Those patches have already been applied to the source file.

Running this script again would corrupt the file, as it uses hard-coded line numbers
(range 715-722 and 737-756) that are fragile and will break if the file structure changes.

HISTORICAL CONTEXT:
- Lines 715-721: Orphaned overlay container code (already commented in source)
- Lines 737-756: Duplicate/orphaned code blocks (already commented in source)
- The correct runTutorialSequence() method exists at line 848+ in the file

If UIScene.js needs further fixes, use pattern-based search/replace instead of
hard-coded line indices.
"""

# Script disabled - all changes have been applied to source
print(__doc__)
