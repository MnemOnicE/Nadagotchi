The issue is that `createDOM` method in `js/DebugConsole.js` is quite complex and long.
It sets up the main container, the header row, the FPS display, the content area, and then adds multiple sections with various buttons, before finally appending the container to the document body.

To improve code health (maintainability and readability):
1. Extract the container creation and styling to `_createContainer()`.
2. Extract the header row creation to `_createHeaderRow()`.
3. Extract the FPS display creation to `_createFpsDisplay()`.
4. Extract the content area creation to `_createContentArea()`.
5. Extract the section additions to `_addDefaultSections()`.

This will make `createDOM` much cleaner and easier to read.
