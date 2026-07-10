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
- **Mobile Responsiveness:** Improved UI for mobile devices with better button layout, safe area handling, and touch optimizations.

### Fixed
- Added missing recipes for `Nutrient Bar`, `Espresso`, and `Chamomile` to make breeding items obtainable through crafting.
- Implemented resize handlers for all minigame scenes (LogicPuzzle, Scout, Healer, Artisan) to properly handle window resizing during gameplay.
- Fixed NPC interaction energy exploit by ensuring interactions return `null` when energy is insufficient, preventing the dialogue modal from appearing.
- Enhanced foraging system with weather effects - rainy weather now yields more items (1.5x multiplier).
- Added comprehensive weather effects configuration for foraging, expeditions, minigames, and stat decay.
- Added energy cost to NPC interactions (5 energy per interaction).

### Added
- **Procedural Pet Appearance System**: Complete body part system with head, torso, hands, feet, ears, tail, and accessories.
  - 6 head types: round, square, pointy, heart, oval, diamond
  - 6 torso types: small, medium, large, stocky, slim, plump
  - 6 hand types: small, medium, large, paw, claw, hoof
  - 6 feet types: small, medium, large, hooved, pawed, clawed
  - 7 ear types: round, pointy, floppy, perked, long, short, bat
  - 7 tail types: none, short, long, curly, bushy, spiked, fluffy
  - 8 accessory types: none, hat, glasses, scarf, bowtie, crown, bandana, wings
  - Archetype-based color palettes (Intellectual=blue, Adventurer=orange, Nurturer=pink, Mischievous=purple, Recluse=gray)
  - 6 marking types: stripes, spots, swirls, patches, gradient, none
  - Deterministic generation from pet DNA for consistent appearance across sessions
  - Feature flag `PROCEDURAL_PETS` to enable/disable (enabled by default)
  - Full test suite (22 tests) for the appearance system
- **Pet Animation System**: Complete animation framework for procedural pets.
  - Blinking eyes (every 4 seconds, mood-dependent speed)
  - Floating idle animation
  - Mood-based animations: happy (bounce + sparkles), sad (droop), angry (shake + narrow eyes), sleep (breathing), excited (fast bounce), eat (chew)
  - Tail animations: normal wag, happy wag (faster)
  - Ear animations: droop when sad
  - Feature flag `ANIMATED_PETS` to enable/disable (enabled by default)
  - Full test suite for the animation system
- **Phase 2.5, 2.6, 2.7**: Procedural Pet System, Extra Programmatic Art, and Enhanced Procedural Art completed
- **Phase 4**: Pet Animation System added
- Updated ROADMAP with Phase 2, 2.5, 2.6, 2.7, and expanded Phase 4

## [0.1.0] - 2024-05-20

### Added
- Initial release of Nadagotchi.
- Core systems: Genetics, Career, Housing, Minigames.

### Added (Unreleased Gameplay Loop Improvements)
- **Dynamic Desire System:** Pets now periodically crave specific actions based on their archetype, granting bonus happiness and skills when fulfilled.
- **Action Combos:** Performing specific sequences of actions (e.g., Meditate -> Study, Play -> Explore) now applies temporary multipliers or discounts.
- **Autonomous Furniture Interactions:** When indoors, pets will now occasionally seek out and interact with placed furniture autonomously, triggering the appropriate events.
### Security
- **Insecure Randomness:** Replaced all fallback usages of `Math.random()` in `GeneticsSystem` with cryptographically secure alternatives (`CryptoUtils.getRandomSafeFloat()` and `CryptoUtils.getRandomSafeInt()`) to prevent predictability and manipulation of game mechanics.
- Fixed an issue where `Config.SECURITY.DNA_SALT` fell back to a hardcoded string `DEVELOPMENT_ONLY_SALT` when the `VITE_DNA_SALT` environment variable was not set. It now dynamically generates a secure local salt using `window.crypto.getRandomValues()` or `crypto.randomBytes()`, persists it securely via `localStorage.setItem('nadagotchi_dna_salt', ...)` in the relevant code path, and then reads it back with `localStorage.getItem('nadagotchi_dna_salt')`.

### Fixed
- Improved test coverage for `ExpeditionSystem` to cover fallback RNG path and missing skill parameters in choices.
