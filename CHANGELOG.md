# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Living Garden System:** The garden now feels alive with spawning debris!
    - **Debris:** Weeds, Small Rocks, and yes, Pet Poop now spawn daily in the garden.
    - **Cleaning:** Clicking debris removes it, costing Energy but granting rewards (Skill XP, Happiness, or Resources like Sticks/Stones).
    - **Penalties:** Neglecting the garden (too much debris) accelerates Happiness decay.
- **Visual Weather Effects:** Added particle systems for Rain, Snow, and Falling Leaves to enhance immersion.
- **Physical Traveling Merchant:** The merchant now appears as a character in the garden during events. Clicking them allows you to barter (e.g., trade Berries for Rare Candy).
- **New Assets:** Procedurally generated textures for Weeds, Rocks, Poop, Merchant, and Weather Particles.

### Fixed
- Fixed critical syntax errors in `GeneticsSystem.js` and `PersistenceManager.js` caused by duplicate variable declarations, which were blocking the test suite.
- Fixed an issue where `TravelingMerchant` events were text-only notifications.
- Resolved "Deterministic Trap" regression in `Nadagotchi` tests caused by new random tie-breaker logic.
- Fixed critical syntax error in `UIScene.js` blocking application load.
- Fixed "Validate-First" leak in `QuestSystem` and `InventorySystem` by adding `canAddItem` checks.
- Fixed race condition in `ExpeditionScene` ensuring `resume` is called before `stop`.
- Added missing recipes (`Stamina-Up Tea`, `Metabolism-Slowing Tonic`) to `ItemData.js`.
- Fixed recurring interaction logic in `RelationshipSystem.js`.

### Changed
- **Performance Optimization:** Optimized `SkyManager` update loop by throttling expensive canvas repaints. Redraws now only occur when the `daylightFactor` changes by more than 0.01 or at least 3 seconds have passed.
- Refactored test suite to use a centralized `mockPhaser` helper, reducing code duplication.
- Hardened test environment with robust mocks for Phaser Events, Zones, and Particles.

## [0.1.0] - 2024-05-20

### Added
- Initial release of Nadagotchi.
- Core systems: Genetics, Career, Housing, Minigames.
