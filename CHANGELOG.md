# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **System**: Implemented `QuestSystem.js` and `QuestDefinitions.js` to manage data-driven quests.
- **Quest**: Ported "Masterwork Crafting" quest to the new system, enabling proper state tracking and stage transitions.
- **Testing**: Added `tests/QuestSystem.test.js` and `tests/QuestIntegration.test.js` to verify quest logic and integration.
- **Gameplay**: Implemented "Friendship Decay" system. Relationships with NPCs now slowly degrade if the player does not interact with them daily.
- **System**: Added `RelationshipSystem.dailyUpdate()` to manage relationship maintenance and `interactedToday` tracking.
- **Tests**: Added `tests/RelationshipSystem.test.js` to verify decay logic and boundary protection.
- **Performance**: Added `tests/Performance_UpdateStats.test.js` to monitor event emission rates and prevent regressions in UI update throttling.

### Changed
- **Performance**: Optimized `MainScene` to throttle `UPDATE_STATS` event emissions to 10Hz (from 60Hz). This significantly reduces overhead in `UIScene` by preventing unnecessary button and text rebuilding every frame.
- **Architecture**: Refactored `RelationshipSystem.js` and `InventorySystem.js` to use `QuestSystem` instead of hardcoded quest logic.
- **Nadagotchi**: Initialized `QuestSystem` in the `Nadagotchi` constructor.
- **UX Improvement**: The "Job Board" button now remains interactive when disabled. Instead of being unresponsive, it dims and provides a toast notification and sound feedback explaining that a career is required.
- **UIScene**: Refactored the "Job Board" button to use `ButtonFactory` for visual consistency with the rest of the UI.
- **Tests**: Updated `tests/UIScene.test.js` to verify the new "soft disable" behavior and feedback mechanisms.

## [0.6.0] - 2023-10-27

### Added
- **Game Balance**: Introduced `Config.js` to centralize all game constants (decay rates, thresholds, skill gains, etc.).
- **Refactoring**: Updated `Nadagotchi.js`, `MainScene.js`, `UIScene.js`, and minigames to use `Config.js` constants instead of hardcoded numbers.
- **Testing**: Added `tests/Config.test.js` to verify configuration integrity.

### Changed
- **Security**: Hardened minigame logic against console tampering by encapsulating state in closures.
- **Reliability**: Improved `MainScene` resource loading to prevent potential race conditions with global textures.

## [0.5.0] - 2023-10-26

### Added
- **Feature**: Added "Genetic Scanner" item and UI modal to inspect pet genotypes.
- **Feature**: Implemented "Homozygous Traits" bonus system (e.g., Photosynthetic, Night Owl).
- **System**: Created `GeneticsSystem.js` to encapsulate breeding and mutation logic.
- **UI**: Added `EventKeys.js` to centralize event strings.

### Fixed
- **Bug**: Fixed infinite loop in `BreedingScene` when selecting environmental factors.
- **Bug**: Corrected `Nadagotchi.js` age calculation to prevent negative values.
