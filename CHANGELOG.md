# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-09-16

### Added
- **Career Achievement System:** Implemented the core logic for the career system. The Nadagotchi can now achieve the "Innovator" career by reaching a logic skill level of 10.
- **Visual Career Notification:** Added a temporary, on-screen notification that appears when the player unlocks a new career, providing immediate visual feedback.

### Changed
- In `js/Nadagotchi.js`, added a new `_updateCareer()` method that is checked on every game tick to handle career progression.
- In `js/MainScene.js`, a new `checkCareerUnlock()` method now manages the visual notification to ensure it only appears once per achievement.

## [0.5.0] - 2025-09-15

### Changed
- **UI Refactoring:** Overhauled the UI system by separating it into a dedicated `UIScene`.
  - `MainScene` now only handles core game logic and the pet's visual representation.
  - The new `UIScene` manages all UI elements, including stats text and action buttons.
  - Communication between the two scenes is now handled via Phaser's event emitter, creating a more robust and decoupled architecture.
- **Upgraded Pet Art:** Replaced the original placeholder art with a new 16x16 pixel art spritesheet to give the pet a distinct visual style. (Note: Using a placeholder until final asset is available).
- **Fixed Missing Textures:** Replaced unreliable placeholder image URLs with a more stable service (`placehold.co`).

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
