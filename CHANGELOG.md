# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
