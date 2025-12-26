# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Housing System Enhancements:**
  - Implemented "Pick Up" functionality for placed furniture. In "Decorate Mode", clicking a placed item now removes it from the world and selects it for moving.
  - Added visual feedback (notifications) for invalid furniture placement (e.g., trying to place in the dashboard area).
- **Code Hygiene:**
  - Added `shutdown()` method to `MainScene.js` to properly clean up event listeners and prevent memory leaks.
- **Tests:**
  - Added `tests/HousingSystem.test.js` to verify backend inventory logic for returning items.
  - Added `tests/FurniturePlacement.test.js` (renamed from `BugReproduction_FurniturePlacement.test.js`) as a permanent regression test for placement logic.

### Fixed
- Fixed an issue where furniture could be placed inside the UI dashboard area.
- Fixed potential memory leaks in `MainScene` due to unremoved event listeners.

## [0.2.0] - 2024-05-20

### Added
- **Core Loop:**
  - Implemented `live()` loop with metabolic rates and genetic modifiers.
  - Added `SoundSynthesizer` for procedural audio.
- **Security:**
  - Added Base64 + Hash verification for save files (`PersistenceManager`).
  - Implemented `GhostSystem` for safe DNA import/export.
- **UI:**
  - Complete "Physical Shell" UI overhaul with responsive layout.
  - Added "Decorate Mode" foundation.

### Fixed
- Resolved issues with minigame state leakage.
- Fixed RNG determinism in breeding logic.
