# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.6] - 2025-11-29

### Fixed
- **UI Button System:** Restored the missing `js/ButtonFactory.js` and integrated it into `js/UIScene.js`.
  - Implemented the `ButtonFactory` class to generate responsive, "Neo-Retro" 3D-style buttons.
  - Updated the `UIScene` responsive layout to correctly calculate the dimensions of the new 3D button containers, ensuring no overlap on mobile or desktop.
  - Fixed unit tests in `tests/legacy.test.js` to support the new `ButtonFactory` dependency.

## [1.5.5] - 2025-11-29

### Changed
- **UI Overhaul ("The Physical Shell"):** Completely redesigned the interface to resemble a physical device dashboard.
  - **Zero Overlap:** The game world viewport is resized to reserve the bottom 25% of the screen for a dedicated UI Control Deck, ensuring controls never obscure gameplay.
  - **Neo-Retro Aesthetics:** Introduced a new "Chunky 3D" visual style for buttons using the 'VT323' pixel font and a specific color palette (#A3B8A2 shell, #D8A373 accents).
  - **Categorized Controls:** Actions are now organized into three tabs: "CARE", "ACTION", and "SYSTEM", reducing screen clutter while maintaining accessibility.
  - **Responsive Dashboard:** The UI layout and game viewport dynamically adapt to screen resize events.
- **Responsive UI:** Completely overhauled the `UIScene` to use a responsive, touch-friendly interface.
  - Buttons are now larger and use a "wrapping" layout that anchors to the bottom of the screen to fit any device orientation.
  - Action buttons are dynamically arranged to prevent overlap and ensure accessibility on smaller screens.
  - Modals are now sized relative to the screen dimensions (`this.cameras.main.width/height`) to ensure they fit within the viewport.

## [1.5.4] - 2025-11-28

### Fixed
- **Crafting Logic Exploit:** Fixed a bug in `Nadagotchi.js` where players could craft items they had not yet discovered (i.e., not in `discoveredRecipes`). Added a validation check to `craftItem`.
- **Default Recipe Initialization:** Ensured that default recipes (like "Fancy Bookshelf") are automatically added to the player's discovered recipes for new games, preserving the intended progression flow.

## [1.5.3] - 2025-11-27

### Fixed
- **UI Overlap Issues:**
  - Resolved overlapping text in the top-left corner by moving the Date/Time display to the top-right corner.
  - Resolved button overlap in the bottom action bar by splitting the action buttons into two distinct rows (Core Actions and Menus), ensuring they no longer conflict with the "Job Board" button on smaller screens.
- **Critical Syntax Error:** Fixed a mangled and duplicated `handleUIAction` method in `js/MainScene.js` that was preventing the game from running correctly.

## [1.5.2] - 2025-11-16

### Fixed
- **Syntax Error in MainScene:** Fixed a duplicated and conflicting `handleUIAction` method definition in `js/MainScene.js` that caused syntax errors and prevented tests from running.
- **Runtime Error (Black Screen):** Fixed a crash caused by using `addDynamicTexture` (a Phaser 3.60+ feature) in an environment using an older Phaser version. Replaced it with `createCanvas`, restoring correct rendering of the sky and game scene.

## [1.5.1] - 2025-11-16

### Fixed
- **Syntax Error in Core Logic:** Fixed a duplicated and conflicting method definition in `js/Nadagotchi.js` that caused syntax errors and potential logic bugs in NPC interactions.
- **Test Suite Syntax Error:** Fixed missing closing braces in `tests/Nadagotchi.test.js`, restoring the integrity of the test suite and ensuring all tests run correctly.

## [1.5.0] - 2025-11-16

### Added
- **Expanded NPC Interactions:** Replaced the generic "friend" NPC with a cast of three distinct, career-focused NPCs: the "Grizzled Scout," "Master Artisan," and "Sickly Villager."
  - Interacting with these NPCs now provides small skill gains in their respective career paths (Navigation, Crafting, and Empathy), creating a more interconnected game world and rewarding social engagement.
  - Added unique sprites and interaction handlers for each new NPC in `MainScene.js`.

## [1.4.1] - 2025-11-16

### Fixed
- **Incorrect Tie-Breaking Logic:** Fixed a bug in `updateDominantArchetype` where a tie for the dominant archetype was not correctly handling the incumbent. The logic now correctly prioritizes the existing archetype in a tie, or chooses randomly if the incumbent is not involved.

## [1.4.0] - 2025-11-16

### Added
- **Comprehensive Code Documentation:** Added detailed JSDoc comments to every class, method, and function across all JavaScript files in the `js/` directory. This improves code clarity, maintainability, and makes the codebase significantly easier for new developers to understand.

### Changed
- **Updated README:** Replaced the existing `README.md`, which was a copy of the design document, with a comprehensive guide for developers. The new README now includes a project overview, local setup and running instructions, and a detailed breakdown of the code structure.

### Fixed
- **Unpredictable Personality Tie-Breaking:** Fixed a logical flaw in `Nadagotchi.js`'s `updateDominantArchetype` method that caused unpredictable behavior when handling ties for the dominant archetype.

## [1.3.2] - 2025-11-16

### Fixed
- **Unpredictable Personality Tie-Breaking:** Fixed a bug in `updateDominantArchetype` where a tie in personality points would be broken unpredictably based on object property iteration order. The logic now ensures that the incumbent dominant archetype will always win a tie, preventing unexpected personality shifts.

## [1.3.1] - 2025-11-16

### Fixed
- **Stagnant Personality Bug:** Fixed a bug in `updateDominantArchetype` where the dominant archetype would not change if another archetype's score was equal to it. The logic now correctly handles ties by allowing a personality shift, making the system more dynamic.

## [1.3.0] - 2025-11-12

### Added
- **Seasonal Festivals and Spontaneous Events:** Implemented a dynamic event system that introduces seasonal festivals (e.g., "Spring Bloom Festival") and rare, spontaneous events (e.g., "Traveling Merchant").
  - **`js/Calendar.js`:** A new class to manage the in-game date, including days and seasons.
  - **`js/EventManager.js`:** A new class to define and manage all in-game events.
  - The main game loop now advances the calendar, checks for active events, and displays them to the player.
  - Active events can now directly influence the Nadagotchi's mood and stats.
- **New Career Mini-Games:** Designed and implemented unique, engaging mini-games for the Scout, Healer, and Artisan careers.
  - **Scout:** A timed "match the pairs" game (`ScoutMinigameScene.js`).
  - **Healer:** A diagnostic game where the player chooses the correct remedy for a symptom (`HealerMinigameScene.js`).
  - **Artisan:** A pattern-matching game where the player replicates a displayed pattern (`ArtisanMinigameScene.js`).
- **Mini-Game Integration:** Integrated the new mini-games into the main game loop. The `MainScene` now launches the appropriate mini-game when the "Work" button is clicked, based on the pet's current career.

### Fixed
- **Case-Insensitive Actions:** Fixed a bug in `js/Nadagotchi.js` where player actions were case-sensitive. Actions are now converted to uppercase to ensure commands like 'feed' and 'FEED' are treated the same.

## [1.2.0] - 2025-11-10

### Added
- **Test Coverage:** Added unit tests for `PersistenceManager.js` and `Nadagotchi.js`.
  - `PersistenceManager.js`: Added tests for all methods.
  - `Nadagotchi.js`: Added tests for the `live` and `updateDominantArchetype` methods.

## [1.1.0] - 2025-11-09

### Added
- **Hobby and Crafting System:** Implemented a new hobby system allowing the Nadagotchi to practice skills like painting and music. A new crafting system allows the pet to use foraged items.
- **Exploration and Foraging System:** The Nadagotchi can now explore different locations and forage for items, which are added to its inventory.
- **Social and Relationship System:** A new social system allows the Nadagotchi to build relationships with NPCs.

### Fixed
- **Critical Black Screen Regression:** Fixed a race condition in `js/MainScene.js` where the `resize` event could be called before the scene's objects were fully created, causing a fatal error that prevented the game from rendering.

## [1.0.0] - 2025-11-09

### Added
- **Interactive Home Environment:** The pet's home is now interactive. Added a clickable "Bookshelf" and "Potted Plant" that provide skill gains and mood boosts, deepening the core simulation.
- **Career Mini-Games:** The "Job Board" for the 'Innovator' career now launches an interactive logic puzzle mini-game. Success grants significant skill and happiness rewards, making careers more engaging.
- **`js/LogicPuzzleScene.js`:** A new scene for the Innovator's career mini-game.

### Changed
- The `STUDY` action in `Nadagotchi.js` has been refactored and its functionality is now primarily handled by the new interactive bookshelf.
- The `CARE_FOR_PLANT` action has been removed and its functionality is replaced by the new interactive plant.
- The "Care" button was removed from `UIScene.js` as it is now redundant.

## [0.9.0] - 2025-11-07

### Changed
- **Responsive Design:** The game now dynamically scales to fit the browser window, making it fully playable on both desktop and mobile devices.
  - `js/game.js` was updated to use Phaser's Scale Manager.
  - `js/MainScene.js` now handles resize events to keep the pet centered.
  - `index.html` and `style.css` were modified to support a full-screen layout.

### Fixed
- **Stale Mood Calculation:** Fixed a critical bug in `js/Nadagotchi.js` where skill gains were calculated using the pet's mood *before* an action was processed, not after. This resulted in incorrect skill gains for actions that also changed the pet's mood (e.g., a sad 'Intellectual' pet studying). The logic has been refactored to calculate the mood multiplier *after* any mood changes occur.
- **Negative Happiness Bug:** Fixed a bug in `js/Nadagotchi.js` where the `happiness` stat for the 'Adventurer' archetype could become negative in 'Rainy' weather. A bounds check was added to ensure `happiness` does not fall below 0.

### Removed
- **Legacy Files:** Deleted the unused `game.js` and `style.css` files from the root directory to clean up the project structure.

## [0.8.0] - 2025-11-07

### Added
- "Healer" and "Artisan" career paths.
- New skills: `empathy`, `focus`, `crafting`.
- New player actions: "Care for Plant", "Meditate", "Craft Item".
- New UI buttons and stats display for the new actions/skills.

## [0.7.0] - 2025-11-07

### Added
- **"Scout" Career Path:** Implemented the "Scout" career path, unlocking for 'Adventurer' archetypes when `skills.navigation > 10`.
  - Added skill gain for `navigation` to the 'EXPLORE' action in `Nadagotchi.js`.
  - Added a case for "Scout" in the `openJobBoard()` method in `UIScene.js`.
  - The `Nav Skill` is now displayed in the stats UI.
- **Career Unlock Notification:** A visual, non-blocking notification now appears for 3 seconds when a new career is unlocked.
  - `Nadagotchi.js` now has a `newCareerUnlocked` flag.
  - `UIScene.js` checks for this flag in `updateStatsUI()` and calls a new `showCareerNotification()` method to display the temporary message.

### Fixed
- **Mood Logic Bug:** Fixed a critical bug in `Nadagotchi.js`'s `live()` method where the 'angry' state (`hunger < 10`) was unreachable because the 'sad' state (`hunger < 30`) was checked first. The conditional logic has been re-ordered.

## [0.6.0] - 2025-11-07

### Added
- **Career System Logic:** Implemented the logic for career progression as outlined in the roadmap.
  - Added an `updateCareer()` method to `Nadagotchi.js`.
  - This method is called at the end of `handleAction()` to check if skill thresholds have been met.
  - The "Innovator" career is now automatically assigned if the Nadagotchi's dominant archetype is 'Intellectual' and its 'logic' skill is greater than 10.

### Changed
- `Nadagotchi.js`: `handleAction()` now calls `updateCareer()` after `updateDominantArchetype()`.

## [0.5.0] - 2025-09-14

### Changed
- **UI Refactoring:** Overhauled the UI system by separating it into a dedicated `UIScene`.
  - `MainScene` now only handles core game logic and the pet's visual representation.
  - The new `UIScene` manages all UI elements, including stats text and action buttons.
  - Communication between the two scenes is now handled via Phaser's event emitter, creating a more robust and decoupled architecture.
- **Fixed Missing Textures:** Replaced unreliable placeholder image URLs with a more stable service (`placehold.co`) to prevent missing texture errors.

### Added
- **`js/UIScene.js`:** A new file containing the dedicated scene for all UI components.

## [0.4.0] - 2025-09-14

### Added
- **Career-Specific Job Board:** Implemented a new "Job Board" UI element.
  - The button is initially disabled and becomes active only when the Nadagotchi achieves a career (`currentCareer` is not null).
  - Clicking the button triggers a career-specific action. Currently, it logs a message to the console for the 'Innovator' career.
- **Career Display in UI:** The Nadagotchi's current career is now displayed in the stats panel, making it easy for the player to see their progress.

### Changed
- Modified `js/MainScene.js` to add the Job Board button, its activation logic in the `update` loop, and the new `openJobBoard()` method.

## [0.3.0] - 2025-09-14

### Added
- **Mood-Based Skill Gain:** The 'STUDY' action's effectiveness is now influenced by the Nadagotchi's mood.
  - A `moodMultiplier` is applied to logic skill gains: `happy` (1.5x), `neutral` (1.0x), `sad` (0.5x), and `angry` (0.2x).
- **Logic Skill UI:** The current logic skill level is now displayed in the main UI, providing clear feedback to the player.

### Changed
- Updated `Nadagotchi.js` to include the mood multiplier logic in the `handleAction` method.
- Updated `MainScene.js` to display the logic skill in `updateStatsUI`.

## [0.2.0] - 2025-09-14

### Added
- **"Explore" Action:** Implemented a new 'EXPLORE' action for the Nadagotchi.
  - This action has unique effects based on the pet's dominant archetype, providing a significant happiness boost to 'Adventurer' types and a negative effect on 'Recluse' types.
- **Proactive Behavior Hint:** A happy 'Adventurer' will now show a magnifying glass thought bubble, hinting to the player to use the new 'Explore' action.
- **UI Button:** Added an "Explore" button to the main game scene.

### Changed
- Added detailed retroactive comments to `js/Nadagotchi.js` and `js/MainScene.js` to improve code clarity and documentation.

## [0.1.0] - 2025-09-14

### Added

- Initial project setup.
- `AGENTS.md`: Instructions for AI agents.
- `CHANGELOG.md`: To track project history.
- `ROADMAP.md`: Outlining the future direction of the project.
- `BEST_PRACTICES.md`: Guidelines for developers.
- `BUGS.md`: Process for reporting and tracking bugs.
