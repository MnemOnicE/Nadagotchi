# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.41.0] - 2025-12-24

### Added
- **New Item:** Added "Clear Water" (Consumable) to `js/ItemData.js`.
  - **Functionality:** Consuming "Clear Water" restores 5 Energy and 2 Happiness.
  - **Integration:** This resolves a data integrity issue where "Clear Water" was used as a reward in `ExpeditionDefinitions.js` but was not defined as a real item.
  - **Testing:** Added `tests/ClearWater.test.js` to verify the item definition and consumption logic.

## [1.40.0] - 2025-12-24

### Added
- **Expedition Enhancements:** Implemented weighted node selection and biome filtering for the Expedition system.
  - **Weighted Selection:** Nodes now have weighted probabilities (e.g., Rare nodes appear less frequently), allowing for more controlled encounter rarity.
  - **Biome Filtering:** Added `biome` support to `ExpeditionSystem.generatePath`. Nodes can now be restricted to specific biomes (e.g., "Forest", "Desert"), or remain generic if no biome is specified.
  - **Logic:** Refactored `generatePath` to accept a `biome` argument (defaulting to 'Forest') and filter nodes strictly based on the biome's `biomes` list.
  - **Tests:** Updated `tests/Expedition.test.js` to verify weighted selection probabilities and correct biome filtering.

## [1.39.0] - 2025-12-24

### Security
- **Verified Fix:** Confirmed and hardened the inventory validation fix in `Nadagotchi.calculateOffspring`.
  - Refactored `tests/InventoryCheck.test.js` to serve as a permanent regression test, ensuring that breeding logic correctly ignores injected environmental items not present in the user's inventory.
  - This closes the loop on a previously identified vulnerability where unowned items could be used to manipulate genetic outcomes.

## [1.38.0] - 2025-12-24

### Added
- **Housing System:** Implemented a draggable furniture system ("Decoration Mode").
  - **Decoration Mode:** Players can toggle "Move Furniture" in the "Decorate" menu to enter an edit mode where placed furniture can be dragged and repositioned.
  - **Visual Feedback:** Added a "Placement Indicator" and cursor changes to signal the active mode.
  - **Persistence:** Furniture positions are saved and restored correctly, maintaining the player's custom layout.
  - **Testing:** Added `tests/HousingSystem.test.js` to verify mode switching, drag logic, and persistence.

## [1.37.0] - 2025-12-24

### Added
- **Scene Verification:** Added `tests/PreloaderScene.test.js` covering 94% of the `PreloaderScene`.
  - Verifies asset loading, procedural texture generation (including emojis and pixel art), and scene transition logic.
  - This eliminates a major blind spot in the automated test suite (previously 0% coverage).
- **Sound Documentation & Validation:** Overhauled `js/utils/SoundSynthesizer.js`.
  - Added comprehensive JSDoc for all methods (`playTone`, `generateNoise`, `applyEnvelope`).
  - Implemented strict input validation for frequency, duration, and volume to prevent audio subsystem crashes or errors.
  - Enforced Singleton pattern usage in tests to prevent state leakage.

### Fixed
- **Input Leak:** Fixed a bug in `MainScene.js` where disabling "Placement Mode" removed *all* 'pointermove' listeners instead of just the specific handler.
  - This prevents potential conflicts with other systems that rely on pointer events.
- **Test Stability:** Fixed regressions in `Security.test.js` and `ExploitScaling.test.js` caused by improper mocking of the `SoundSynthesizer` singleton.

## [1.36.1] - 2025-12-24

### Fixed
- **Expedition Scene Hang:** Fixed a critical bug where players would get stuck in the Expedition mini-game after completing the 3 choices. The "Return Home" button logic was corrected to ensure the main scene is resumed before stopping the mini-game scene, preventing a race condition where the scene context was lost. Also removed duplicate "Expedition Complete" text.

## [1.36.0] - 2025-12-24

### Performance
- **Main Loop Optimization:** Refactored `MainScene.update` to reuse the `worldState` object instead of recreating it every frame, reducing garbage collection pressure.

### Changed
- **Quest Safety:** Refactored `QuestSystem.advanceQuest` to validate rewards before consuming quest items, preventing potential item loss if reward application fails ("Transaction Safety").
- **Personality Logic:** Updated `Nadagotchi.updateDominantArchetype` to use a random shuffle when breaking ties between archetypes, eliminating the previous alphabetical/index bias.

### DevOps
- **Dependencies:** Moved `playwright` to `devDependencies` in `package.json` to reduce production bundle size/dependencies.

## [1.35.0] - 2025-12-23

### Added
- **Ghost Pets System:** Implemented a system for verifying and parsing serialized pet DNA ("Mystery Eggs") from external sources.
  - **GhostSystem:** Added `js/systems/GhostSystem.js` to handle DNA string validation (regex checks) and parsing, ensuring security against injection attacks.
  - **GhostScene:** Added `js/GhostScene.js` as a visual interface ("The Ether") to view these spirits.
  - **Integration:** Registered `GhostScene` in `js/game.js` and updated the roadmap.

## [1.34.0] - 2025-12-23

### Added
- **Expedition Minigame:** Implemented a procedural "Expedition" minigame accessible via the `EXPLORE` action.
  - **Procedural Generation:** Expeditions are generated dynamically based on the current season and weather, utilizing the new `ExpeditionSystem` and `ExpeditionDefinitions`.
  - **Interactive Encounters:** Players face choices in various nodes (e.g., "Old Oak", "Frozen Pond") that test their skills (Navigation, Resilience, Logic).
  - **Rewards:** Successful expeditions yield loot, XP, and stat boosts, while failures carry risks.
  - **Scene Integration:** Added `ExpeditionScene.js` to handle the visuals and wired it to `MainScene.js` via the `EventKeys.EXPLORE` event.
  - **Unit Tests:** Added `tests/Expedition.test.js` to verify path generation and choice resolution logic.

## [1.33.0] - 2025-12-23

### Changed
- **Visual Assets:** Replaced the procedurally generated "Bookshelf" world object with a dedicated pixel-art asset (`bookshelf_64x64.png`).
  - The craftable "Fancy Bookshelf" retains its procedural generation logic as requested.
  - Updated `PreloaderScene.js` to load the new asset, prioritizing it over the procedural generation for the `bookshelf` key.
- **Pet Sprites:** Replaced the procedurally generated pet sprite with a new pixel-art spritesheet (`pet_spritesheet.png`).
  - Updated mood mapping to align with the new assets: Happy, Angry, Tired (Sad), and Content (Neutral).

## [1.32.0] - 2025-12-07

### Added
- **Career UI & Management:** Implemented a comprehensive frontend for the Career system.
  - **Career Modal:** Added a new "Career Profile" modal in `UIScene` that displays current career stats (Title, Level, XP, Bonuses) and allows switching between unlocked careers.
  - **Job Board Hub:** Upgraded the "Job Board" button to open a hub menu, offering options to "Start Shift" or "Manage Career".
  - **System Integration:** Added a "Career" button to the "SYSTEM" tab for easy access.
  - **Switching Logic:** Connected the UI to the backend `switchCareer` logic, enabling true career flexibility.
- **Weather-Dynamic Quests:** Enhanced the Quest System to generate daily quests based on current Weather conditions.
  - **Logic:** Updated `QuestSystem.generateDailyQuest` to pool templates from both Season and Weather.
  - **Content:** Added new weather-specific quest templates (e.g., "Craft Hot Cocoa" during Rain, "Gather Firewood" in Winter).
  - **New Items:** Added `Hot Cocoa` (Consumable) and `Muse Flower` (Material) to support these new quests.
  - **Inventory:** Updated `InventorySystem` to allow foraging `Muse Flower` in Autumn.

## [1.31.0] - 2025-12-07

### Added
- **Career Progression System:** Implemented a robust leveling system for careers.
  - **Levels & XP:** Added levels 1-5 for all careers (e.g., Innovator Lv1: Lab Assistant -> Lv5: Nobel Laureate). Pets earn XP from successful work days.
  - **Promotions:** Reaching XP thresholds triggers a promotion event with a unique title and permanent pay/happiness bonuses.
  - **Infrastructure:** Created `js/CareerDefinitions.js` to manage career data and updated `Nadagotchi.js` to track `careerXP` and `careerLevels`.
- **Dynamic Daily Quests:** Implemented a procedural quest system to encourage varied gameplay.
  - **Procedural Generation:** Daily quests are generated based on the current season and weather (e.g., "Forage Firewood in Winter").
  - **Integration:** Quests are integrated into the `RelationshipSystem`, requiring players to interact with specific NPCs to complete tasks.
  - **Reward Loop:** Completing quests grants significant Career XP and Relationship boosts, closing the loop between Foraging, Crafting, and Social systems.

## [1.28.0] - 2025-12-07

### Added
- **Showcase System (Pet Passport):** Implemented a visual "Showcase" modal in `UIScene.js` that displays a "Pet Passport".
  - **Passport Card:** Renders a stylized ID card featuring the pet's sprite, archetype, generation, career, and age.
  - **UI Integration:** Added a "Showcase" button to the "SYSTEM" tab in the main dashboard.
- **New Items:** Added missing items to `ItemData.js` to support the Breeding and Crafting systems:
  - **Tools:** 'Genetic Scanner', 'Ancient Tome', 'Heart Amulet'.
  - **Consumables:** 'Nutrient Bar', 'Espresso', 'Chamomile'.
  - **Materials:** 'Muse Flower'.
  - This resolves a data integrity issue where the Genetics System referenced items that did not exist in the game.
## [1.30.0] - 2025-12-07

### Added
- **Responsive Design Support:** Switched the Phaser game configuration from `FIT` to `RESIZE` mode, allowing the game canvas to adapt dynamically to any screen aspect ratio (specifically improving mobile portrait experience).
- **Dynamic UI Modals:** Refactored `js/UIScene.js` to use `Phaser.GameObjects.Container` for all modal windows. Implemented a `resizeModals` system that keeps windows centered and correctly sized even when the browser window is resized or rotated.

### Changed
- **CSS Layout:** Updated `style.css` to ensure the game container fully occupies the viewport without scrollbars.

## [1.29.0] - 2025-12-07

### Added
- **Pet Passport (Showcase System):** Implemented a dedicated "Showcase Scene" to view the pet's detailed profile and genetic data.
  - **Architecture:** Created `js/ShowcaseScene.js` as a lightweight overlay scene that pauses the main game, improving performance and separation of concerns compared to the previous modal-heavy approach.
  - **Feature:** Displays a high-resolution visualization of the pet (mood-dependent), career stats, generation, and a copyable DNA string for the "Mystery Egg" exchange.
  - **UX:** Replaced the "Genetic Scanner" persistent button with a "Passport" entry in the System tab, decluttering the main HUD while making genetic data more accessible.
  - **Integration:** Registered `OPEN_SHOWCASE` event in `EventKeys.js` and updated `UIScene.js` to handle the transition.

## [1.28.0] - 2025-12-07

### Added
- **UX Discoverability ("Soft Disable"):** Improved the interface by showing unavailable actions (e.g., "Work" before having a career) in a disabled, interactive state instead of hiding them entirely.
  - **Feedback:** Clicking a disabled action now plays a failure sound and displays a "Toast" notification explaining why the action is locked (e.g., "You need a Career first!").
  - **Button Factory:** Updated `ButtonFactory.js` to support a standardized `setDisabled` state with visual dimming and optional click handlers.
  - **UIScene:** Updated the 'ACTION' and 'SYSTEM' tabs to render disabled buttons for locked features like "Work" and "Retire", significantly improving feature discoverability for new players.

## [1.27.0] - 2025-12-07

### Added
- **Pet Export/Import ("Mystery Egg Exchange"):** Implemented a system to share pets via secure DNA strings.
  - **Genetics Serialization:** Added `GeneticsSystem.serialize()` and `deserialize()` to convert a pet's genome into a Base64-encoded, checksum-protected string.
  - **Security:** The export format includes a hash salt to prevent casual tampering (stat hacking) of the DNA string.
  - **Export Logic:** Added `Nadagotchi.exportDNA()` to generate the code and `Nadagotchi.generateDataFromDNA()` to create a new pet data object from an imported code.
  - **Unit Tests:** Added `tests/GeneticsSerialization.test.js` to verify integrity checks and data restoration.

## [1.26.1] - 2025-12-07

### Performance
- **UI Update Throttling:** Optimized the `MainScene` game loop to throttle `UPDATE_STATS` event emissions to 10Hz (every 100ms) instead of running every frame (60Hz).
  - This resolves a critical performance bottleneck where the `UIScene` was destroying and recreating action buttons every single frame while the 'ACTION' or 'SYSTEM' tabs were active.
  - Significantly reduces garbage collection pressure and CPU usage for UI rendering without impacting perceived responsiveness.

## [1.26.0] - 2025-12-07

### Refactored
- **Inventory System:** Extracted inventory management logic (crafting, foraging, consumption, placement) from `js/Nadagotchi.js` into a dedicated `js/systems/InventorySystem.js`.
  - This continues the effort to decompose the `Nadagotchi` "God Object" into manageable systems.
  - Updated `js/systems/RelationshipSystem.js` to utilize the new `InventorySystem`.
  - Maintained backward compatibility for save files (data structure remains on the pet instance).

## [1.25.0] - 2025-12-07

### Performance
- **Render Loop Optimization:** Optimized `MainScene.js` to significantly reduce CPU usage during the game loop.
  - **Sky Rendering:** Implemented a dirty-check for `drawSky` to skip expensive gradient and star generation when the daylight factor hasn't changed (approx. 80% of frames).
  - **Lighting Effects:** Optimized `drawLight` to skip radial gradient regeneration when the pet is stationary (idle).
  - These changes reduce the per-frame overhead of procedural texture generation without affecting visual fidelity.

### Fixed
- **Test Suite Stability:** Fixed broken tests in `tests/DayCycle.test.js` (missing mocks) and `tests/ExploitArtisanQuest.test.js` (outdated method call) to ensure reliable CI verification.

## [1.24.0] - 2025-12-07

### Added
- **Achievements UI:** Implemented a visual modal in `UIScene.js` to view unlocked achievements.
  - Added an "Achievements" button to the "SYSTEM" tab.
  - The modal lists all achievements, showing icon/name/description for unlocked ones and a locked state for others.
  - Added `OPEN_ACHIEVEMENTS` event key to support this feature.

## [1.23.0] - 2025-12-07

### Refactored
- **Codebase Architecture:** Extracted NPC and quest interaction logic from the monolithic `Nadagotchi.js` into a dedicated `RelationshipSystem.js` (`js/systems/RelationshipSystem.js`).
  - This improves maintainability, reduces the complexity of the main `Nadagotchi` class (God Object refactor), and isolates game subsystems.
  - The `RelationshipSystem` operates on the pet's existing data structure, ensuring 100% backward compatibility with save files.

### Added
- **Procedural Pet Animations:** Implemented dynamic idle animations in `MainScene.js` using Phaser Tweens. The pet now reacts visually to its mood:
  - **Happy:** Bouncing/Hopping.
  - **Sad:** Slow swaying.
  - **Angry:** Shaking.
  - **Neutral:** Gentle breathing.
- **Procedural Sound System:** Implemented `js/utils/SoundSynthesizer.js`, a Web Audio API-based sound engine that generates retro-style SFX (blips, chimes, buzzes) without loading external assets.
  - **Interaction Sounds:** UI buttons now emit a satisfying "click" sound.
  - **Feedback Sounds:** Minigames and careers now have "success" and "failure" audio cues.
  - **Achievement Chime:** Unlocking an achievement triggers a celebratory rising chime.

## [1.22.0] - 2025-12-07

### Added
- **Production Build Configuration:** Added `vite.config.js` to ensure deterministic builds and handle base path configuration for production deployments (e.g., GitHub Pages).
- **Progressive Web App (PWA) Support:**
  - Added `public/manifest.json` and generated PWA icons to make Nadagotchi installable on mobile and desktop devices.
  - Implemented a `service-worker.js` with a runtime caching strategy (Stale-While-Revalidate) to provide offline functionality for hashed assets.
- **CI/CD Pipeline:** Created `.github/workflows/deploy.yml` to automate the build and verification process. The pipeline installs dependencies, runs all unit tests, and builds the project on every push to `main`.
- **Mobile Optimization:** Added `viewport` and `theme-color` meta tags to `index.html` to ensure the game renders correctly on mobile devices without unwanted scaling.

### Fixed
- **Test Suite Stability:** Fixed critical failures in the test suite to ensure a passing build for production.
  - Refactored `tests/Minigames.test.js` and `tests/LogicPuzzleScene.test.js` to correctly simulate user input events instead of relying on inaccessible closure-scoped variables.
  - Fixed `tests/ExploitScaling.test.js` by correctly resetting the `activeMinigameCareer` security flag between test cases.
  - Fixed `tests/SeasonalCrafting.test.js` by updating the mock strategy to align with the new `SeededRandom` implementation used in `Nadagotchi.js`.

## [1.21.1] - 2025-12-07

### Fixed
- **UI Modal Stacking:** Fixed a usability issue in `UIScene.js` where menu windows (Inventory, Journal, etc.) would stack on top of each other, obscuring content.
  - Implemented an exclusive visibility system: opening any menu (Journal, Recipes, Inventory, Settings, Scanner, etc.) now automatically closes any other open menus.
  - This restores the expected "single active window" behavior and fixes the issue where players had to manually close top-level windows to reveal others beneath them.

## [1.21.0] - 2025-12-07

### Added
- **Responsive UI Controls:** Implemented hover states (brightness boost) for all Neo-Retro buttons (`ButtonFactory.js`) to improve tactile feedback and UI responsiveness.
- **Keyboard Navigation:** Added keyboard shortcuts for the main dashboard tabs in `UIScene.js` (1: Care, 2: Action, 3: System, 4: Ancestors) to improve accessibility and navigation speed.
## [1.20.2] - 2025-12-07

### Security
- **Backend Inventory Validation:** Implemented server-side (logic-layer) validation in `Nadagotchi.calculateOffspring` to prevent item injection exploits.
  - The method now filters incoming `environmentalFactors` against the pet's actual inventory, ensuring that only owned items can influence the next generation's genetics.
  - This complements the existing UI-side filtering in `BreedingScene.js`, providing a robust defense-in-depth solution.

## [1.20.1] - 2025-12-07

### Fixed
- **Infinite Chat Exploit:** Fixed a game balance bug where NPC interactions (`CHAT`) provided significant stat and skill gains (Happiness, Communication, Navigation) without consuming any energy.
  - Added an `ENERGY_COST` of 5 to the `INTERACT_NPC` configuration.
  - Updated `Nadagotchi.interact` to enforce this cost and prevent interaction when exhausted.
  - Updated `MainScene` to gracefully handle failed interactions by suppressing the dialogue modal.

## [1.20.0] - 2025-12-07

### Added
- **Seeded RNG:** Implemented a `SeededRandom` class (Mulberry32) to ensure deterministic game logic. The `universeSeed` is generated once at the start of a lineage ("Big Bang") and persists across saves, enabling true replayability and preventing "save scumming" of random events.
- **Achievement System:** Implemented a headless `AchievementManager` that subscribes to game events to track player milestones.
  - **Achievements:** Defined initial achievements: "First Craft", "Novice Explorer", "Socialite", "Scholar".
  - **UI Toast:** Added a visual "Toast" notification system to `UIScene.js` that slides down from the top of the screen when an achievement is unlocked.
  - **Unit Tests:** Added `tests/SeededRNG.test.js` to verify determinism and `tests/Achievement.test.js` to verify event tracking.

### Changed
- **Genetics System:** Refactored `GeneticsSystem.js` and `Genome` to accept an RNG instance, making breeding outcomes fully deterministic based on the universe seed.
- **Nadagotchi Logic:** Updated `Nadagotchi.js` to use the seeded RNG for UUID generation, offspring calculation, recipe discovery, and foraging drops.
- **Event Keys:** Added `ACHIEVEMENT_UNLOCKED` to `EventKeys.js`.

## [1.19.0] - 2025-12-07

### Security
- **Hardened Persistence:** Updated `PersistenceManager` to salt the save file hash with the pet's unique UUID. This binds the save data to a specific pet instance, preventing save swapping and replay attacks.
- **Event System Validation:** Secured the `WORK_RESULT` event in `MainScene.js`. The scene now validates that a minigame was legitimately active before processing rewards, blocking console-based event injection exploits.
- **Resource Check Enforcement:** Updated `Nadagotchi.js` to strictly check for sufficient resources (Energy, Hunger) before executing actions. This fixes the "Zombie Pet" exploit where players could farm stats with 0 Energy.
- **Minigame State Protection:** Refactored all minigame scenes (`Artisan`, `Logic`, `Scout`, `Healer`) to use closures for game state (patterns, solutions). This prevents players from reading the solution from the browser console (`game.scene...`).
- **Inventory-Gated Breeding:** Updated `BreedingScene.js` to enforce strict inventory checks for all environmental influence items. Players can no longer select genetic modifiers they do not own.
- **Recipe Logic:** Updated `discoverRecipe` to return `false` if a recipe is already known, allowing strict quest progression checks and preventing reward farming.

## [1.18.1] - 2025-12-07

### Fixed
- **Invisible Furniture Placement:** Fixed a logic bug in `MainScene.js` where furniture could be placed in the UI dashboard area (bottom 25% of the screen), causing the item to be consumed but rendered outside the visible camera viewport. Placement in this area is now blocked to prevent item loss.

## [1.18.0] - 2025-12-07

### Added
- **Settings Menu:** Implemented a persistent "Settings" menu accessible from the System tab.
  - **Volume Control:** Added UI controls for game volume (visual feedback).
  - **Game Speed Control:** Added buttons to toggle between Normal (1x), Fast (2x), and Hyper (5x) game speeds.
  - **Persistence:** Settings are automatically saved to `localStorage` and restored on game load.
- **Framerate Independence:** Refactored the core simulation loop (`Nadagotchi.live`) to use delta-time (`dt`) for calculations.
  - This ensures the game simulation runs at the correct speed regardless of the device's framerate.
  - This architecture enables the "Game Speed" feature to work by simply scaling the delta-time passed to the simulation.

### Changed
- **Config Update:** Updated `js/Config.js` to include global settings defaults and time-based constants for the simulation loop.

## [1.17.0] - 2025-12-07

### Added
- **First Time User Experience (FTUE):** Implemented a dedicated "Start Scene" for new and returning players.
  - **Main Menu:** A "Town Gate" themed start screen that allows players to "Enter World" (Resume) or "Arrive" (New Game).
  - **Archetype Selection:** New players can now choose their starting personality by selecting one of three "Welcome Baskets" (Adventurer, Nurturer, Intellectual), replacing the default forced archetype.
  - **Interactive Onboarding:** Added a skippable "System Greeter" tutorial in `UIScene.js` that highlights key interface elements (Stats, Tabs, Actions) for new users.
  - **New Assets:** Updated `PreloaderScene.js` to procedurally generate assets for the baskets and menu background.

## [1.16.0] - 2025-12-07

### Added
- **Comprehensive Code Documentation:** Added thorough JSDoc docstrings to every class, method, and function in the codebase (`js/*.js`). This includes parameter types, return values, and file-level overviews to elevate code quality and maintainability.
- **System Architecture Guide:** Added a new `README.md` serving as a high-level architectural guide, including installation steps, usage examples, and a file structure breakdown.

## [1.15.1] - 2025-12-06

### Fixed
- **Infinite Furniture Glitch:** Fixed a critical bug in `MainScene.js` where placing furniture items did not remove them from the player's inventory, allowing for infinite duplication of decorative items. Added a new `placeItem` method to `Nadagotchi.js` to securely handle item consumption during placement.

## [1.15.0] - 2025-12-06

### Added
- **Inventory System:** Implemented a comprehensive Inventory/Item Management system.
  - **Item Definitions:** Created `js/ItemData.js` with metadata (description, type, emoji) for all game items.
  - **Inventory UI:** Added a dedicated "Inventory" button to the `SYSTEM` tab in `js/UIScene.js`, opening a modal that lists all owned items with descriptions.
  - **Consumable Items:** Implemented functionality to "Use" consumable items directly from the inventory.
    - **Berries:** Restore hunger and energy.
    - **Logic-Boosting Snack:** Boosts energy, happiness, and Logic skill.
    - **Stamina-Up Tea:** Restores a large amount of energy.
    - **Metabolism-Slowing Tonic:** Permanently reduces the pet's metabolism gene (gene therapy).

## [1.14.0] - 2025-12-06

### Changed
- **Roadmap Update:** Updated `ROADMAP.md` to include new milestones for Phase 2 and Phase 3, addressing user feedback on missing QOL and inventory features.
  - **In-Game Settings/Options:** Added a future work item for persistent sound, music, and gameplay speed settings (Phase 2).
  - **Inventory/Item Management UI:** Added a future work item for a dedicated inventory modal to view item details and quantities (Phase 2).
  - **Achievement Tracking System:** Refined the "Meta-Game" section to explicitly mention backend logic for tracking specific milestones like "Breed 5 Generations" (Phase 3).
## [1.13.1] - 2025-12-06

### Added
- **Game Guide:** Created `GUIDE.md`, a comprehensive player-facing manual detailing core stats, personality archetypes, careers, and the genetics system.
- **Integration Tests:** Added `tests/LiveLoopIntegration.test.js` to verify the complex interaction of environmental factors, traits (e.g., Night Owl), and metabolism in the main game loop.
- **Exploit Tests:** Added `tests/ExploitArtisanQuest.test.js` to strictly verify that quest progression cannot be bypassed by item injection.

### Fixed
- **Double Stat Application:** Fixed a critical bug in `js/Nadagotchi.js` where certain actions (PLAY, INTERACT_PLANT, EXPLORE, CRAFT) were applying stat changes twice—once using the new `Config` values and again with legacy hardcoded values—resulting in incorrect energy costs and happiness gains.
- **Code Redundancy:** Removed duplicated recipe definitions from the `Nadagotchi` constructor, fully enforcing the Single Source of Truth principle with `js/ItemData.js`.

## [1.13.0] - 2025-12-06

### Changed
- **Codebase Refactoring:** Extensive refactoring to improve maintainability and reduce fragility.
  - **Centralized Configuration:** Extracted all magic numbers and balance constants from `js/Nadagotchi.js` to a new `js/Config.js` file.
  - **Event Key Management:** Introduced `js/EventKeys.js` to manage all event strings as constants, eliminating "magic strings" and preventing silent failures in scene communication.
  - **Data Decoupling:** Moved recipe and item definitions from the `Nadagotchi` constructor to a static `js/ItemData.js` file.
  - **Scene Updates:** Updated `MainScene.js`, `UIScene.js`, and all minigame scenes to utilize the new `EventKeys` for robust event handling.

## [1.13.0] - 2025-12-05

### Fixed
- **Work Reward Exploit:** Implemented diminishing returns for skill and happiness gains in work minigames. Skill gain now scales inversely with the current skill level (preventing easy mastery), and happiness gain decreases as the pet approaches maximum happiness.
- **Save Scumming Exploit:** Enhanced the `PersistenceManager` to obfuscate save data using Base64 encoding and added a hash integrity check to detect tampering. Legacy plain JSON saves are still supported for backward compatibility.
- **Quest Logic Bypass:** Fixed a logic flaw in the Artisan "Masterwork Crafting" quest. The quest stage 2 completion now strictly requires the "Masterwork Chair" to be crafted while the quest is active (tracking a `hasCraftedChair` flag), preventing players from bypassing the requirement by cheating the item into their inventory.

## [1.12.1] - 2025-12-05

### Added
- **Homozygous Personality Bonuses:** Implemented passive gameplay bonuses for pets with homozygous personality genes, deepening the genetic strategy.
  - **Intellectual:** Grants a happiness boost when studying.
  - **Adventurer:** Grants additional happiness when exploring.
  - **Nurturer:** Increases empathy gain when caring for plants.
  - **Mischievous:** Refunds energy when playing.
  - **Recluse:** Boosts focus gain when meditating.
- **Expanded Breeding Influence:** Significantly expanded the `GeneticsSystem` environment map (`envMap`) to allow a wider range of items to influence offspring traits.
  - **Crafted Items:** 'Fancy Bookshelf' (Intellectual), 'Masterwork Chair' (Recluse), 'Logic-Boosting Snack' (Intellectual), 'Stamina-Up Tea' (Adventurer).
  - **Resources:** 'Shiny Stone' (Mischievous), 'Frostbloom' (Recluse), 'Berries' (Nurturer).
- **Unit Tests:** Added `tests/FeatureEnhancements.test.js` covering the new bonuses, expanded breeding logic, and tie-breaking rules.

### Changed
- **Personality Tie-Breaking:** Refined the `updateDominantArchetype` logic in `Nadagotchi.js`. Instead of falling back to a deterministic list order, ties for the dominant archetype are now broken by comparing the pet's relevant skills (e.g., Logic + Research for Intellectual vs. Navigation for Adventurer). This makes personality shifts feel more earned and logical.

## [1.12.0] - 2025-12-05

### Added
- **NPC Quest System:** Introduced a new quest system framework in `js/Nadagotchi.js`.
- **Masterwork Crafting Quest:** Implemented a unique, multi-stage quest for the "Master Artisan" NPC.
  - Reaching relationship level 5 triggers the "Masterwork Crafting" quest line.
  - Players must gather materials ("Sticks") to learn a new recipe ("Masterwork Chair").
  - Crafting and delivering the "Masterwork Chair" completes the quest, granting "Master Artisan" recognition and a permanent skill boost to future interactions.
- **New Recipe:** Added "Masterwork Chair" to the recipe definitions.
- **Hybrid Career System:** Introduced the concept of "Hybrid Careers" which require high levels in multiple personality traits and skills, rewarding diverse playstyles.
  - **"Archaeologist" Career:** The first hybrid career, requiring high 'Adventurer' AND 'Intellectual' personality points, plus high 'Navigation' and 'Research' skills.
  - **"Research" Skill:** A new skill that is developed alongside Logic when studying or interacting with bookshelves.
- **Dynamic Work System:** Updated the `ScoutMinigameScene` to support dynamic career contexts. It can now be reused for the "Archaeologist" career (representing fieldwork/digs) with appropriate text updates.
- **Unit Tests:** Added `tests/HybridCareer.test.js` to verify the unlocking conditions and skill progression for the new hybrid system.

### Changed
- **Nadagotchi Logic:** Updated `js/Nadagotchi.js` to initialize the 'Research' skill (with legacy migration) and included it in the `STUDY` and bookshelf interaction loops.
- **MainScene:** Updated `startWorkMinigame` and `handleWorkResult` to correctly route the Archaeologist career to the Scout minigame and award dual skill gains (Navigation + Research) upon success.
- **UI:** Updated `js/UIScene.js` to display the 'Research' skill in the stats dashboard.
- **Seasonal Foraging & Crafting:** Enhanced the `forage` system in `js/Nadagotchi.js` to be season-aware. Players can now find "Frostbloom" exclusively during the "Winter" season.
- **Genetic Crafting Loop:** Introduced a new recipe, "Metabolism-Slowing Tonic", which requires the seasonal "Frostbloom" to craft.
- **Crafting-Genetics Integration:** The "Metabolism-Slowing Tonic" can now be used in the `BreedingScene` (if in inventory) to significantly lower the offspring's metabolism (gene value: 2), creating a direct gameplay link between crafting and the genetics engine.
- **Season Tracking:** Updated `MainScene.js` and `Nadagotchi.js` to correctly propagate the current season from the `Calendar` to the pet's brain logic.
- **Unit Tests:** Added `tests/SeasonalCrafting.test.js` to verify seasonal drops, recipe existence, and genetic effects.
- **Hall of Ancestors:** Implemented the "Hall of Ancestors" system to commemorate retired pets.
  - Added a new "ANCESTORS" tab to the `UIScene`.
  - The tab displays a list of retired pets (from `PersistenceManager`).
  - Clicking an ancestor opens a modal with their detailed stats and a unique "Ancestral Advice" quote based on their dominant archetype.
  - Implemented `NarrativeSystem.getAdvice()` to generate wisdom from ancestors.
- **Homozygous Trait Bonuses:** Implemented gameplay rewards for pets with consistent genetic traits, adding strategic depth to breeding.
  - **Enhanced Metabolism:** Pets with a homozygous `metabolism` gene (two identical alleles) now possess a higher maximum energy capacity (+5 Max Energy, total 105).
  - **Emotional Resilience:** Pets with a homozygous `moodSensitivity` gene recover their 'Happy' mood more easily, requiring lower stats (75% instead of 80%) to reach that state.
- **Unit Tests:** Added `tests/HomozygousBonuses.test.js` to verify the detection and application of these genetic bonuses.
### Changed
- **Astronomical Festivals:** Aligned seasonal festivals with astronomical concepts (Equinoxes and Solstices). All festivals now occur on the 14th day of the season (Mid-Season) to reflect the "Clock Rigor" concept.
  - Spring: Spring Equinox Festival
  - Summer: Summer Solstice Celebration
  - Autumn: Autumn Equinox Feast
  - Winter: Winter Solstice Festival

## [1.11.2] - 2025-12-05

### Fixed
- **Determinism in Personality:** Fixed a regression in `js/Nadagotchi.js` where the `updateDominantArchetype` method was using random selection for tie-breaking in production environments, contradicting the intended deterministic design. Removed the `Phaser.Utils.Array.GetRandom` call to ensure consistent behavior across all environments.

## [1.11.1] - 2025-12-05

### Fixed
- **Uncraftable Recipes:** Fixed a bug in `js/Nadagotchi.js` where discoverable recipes "Logic-Boosting Snack" and "Stamina-Up Tea" were missing their definitions, causing crafting to fail.

## [1.11.0] - 2025-12-05

### Added
- **Tamagotchi Journal:** Implemented an automated narrative system in `js/NarrativeSystem.js` and `js/Nadagotchi.js`.
  - Significant events such as mood changes, weather shifts, and age milestones now automatically generate personalized journal entries based on the pet's archetype.
- **Enhanced Recipe Book:** Updated `js/UIScene.js` to display detailed information for discovered recipes.
  - The Recipe Book now shows the description and required materials for each recipe, serving as a functional reference for the player.

## [1.10.0] - 2025-12-01

### Added
- **Passive Traits Activation:** The `live()` simulation loop in `js/Nadagotchi.js` now actively uses the pet's genetic traits (`specialAbility`) to modify stat decay.
  - **"Photosynthetic":** Reduces energy decay by 50% during the "Day" cycle.
  - **"Night Owl":** Reduces energy decay by 20% during the "Night" cycle.
- **Dynamic Metabolism:** The `metabolism` phenotype now scales both hunger and energy decay rates (from 0.2x to 2.0x), making high-metabolism pets more demanding but energetic.
- **Genetic Scanner Tool:** Added a "Genetic Scanner" button to the UI (`js/UIScene.js`) which is revealed if the player owns the scanner item. Clicking it displays the pet's raw Genotype (alleles), highlighting heterozygous traits.
- **Expanded Breeding Options:** Added "Chamomile" to the breeding scene, which lowers metabolism (calming effect).

### Changed
- **Genetics System Config:** Updated `js/GeneticsSystem.js` and `js/BreedingScene.js` to use descriptive item names (e.g., "Ancient Tome", "Espresso") instead of internal IDs, improving clarity and matching the UI.
- **Legacy Logic:** Deprecated the old `legacyTraits` array usage in the main simulation loop, replacing it with direct checks against the new `Genome` system.

## [0.9.0] - 2025-12-01

### Added
- **Refined Genetics System:** Implemented advanced Mendelian-inspired logic in `js/GeneticsSystem.js`.
  - **Random Defaults:** New Genomes (Generation 1) are now initialized with random "Wild" genes (value 10-30) instead of static values, creating more variety.
  - **Metabolism Averaging:** The `metabolism` phenotype is now calculated as the average of its two alleles, allowing for nuanced physiological traits.
  - **Homozygous Traits:** Added logic to detect homozygous traits (two identical alleles), flagging them in the phenotype (`isHomozygous: true`) for future bonus effects.
  - **New Breeding Item:** Added "Espresso" (☕) to the breeding item selection, which specifically targets and boosts the `metabolism` gene.
- **Unit Tests:** Updated `tests/Genetics.test.js` to verify random default generation, average calculation for metabolism, homozygous detection, and the new item logic.

### Changed
- **Nadagotchi Integration:** Updated `js/Nadagotchi.js` to utilize the new random default generation for Genomes. The "starter pet" bias is now applied as a boost on top of this random wild background, ensuring the player's choice remains significant but organic.
- **Breeding Scene UI:** Updated `js/BreedingScene.js` to include the "Espresso" item in the selection panel and improved the layout spacing to accommodate the new option.

## [0.8.0] - 2025-11-30

### Added
- **Genetics System Backend:** Implemented `GeneticsSystem.js` with a Mendelian-inspired inheritance model using `Genome` class (Genotype/Phenotype).
- **Metabolism & Traits:** Integrated `metabolism` stat and Legacy Traits ("Night Owl", "Photosynthetic") into `Nadagotchi.js` life cycle.
- **Environmental Influence:** Updated breeding logic to allow items like "Nutrient Bar" and "Ancient Tome" to influence specific genes.
- **Unit Tests:** Added `tests/Genetics.test.js` covering recessive inheritance, mutation, and environmental dominance.

### Changed
- **Nadagotchi Integration:** Updated `Nadagotchi` constructor to use the new `Genome` class and support legacy save migration.
- **Breeding Scene:** Added "Nutrient Bar" to the breeding item selection to support metabolism modification.

## [0.7.0] - 2025-11-30

### Changed
- **Modern Architecture (Vite & ES Modules):** Migrated the entire codebase from vanilla JavaScript (global scope) to modern ES6 Modules bundled with Vite.
  - Replaced `<script>` tags in `index.html` with a single module entry point.
  - Converted all classes (`Nadagotchi`, `MainScene`, etc.) to use `export class` and explicit `import` statements.
  - Configured Vite for development and production builds (`npm run dev`, `npm run build`).
  - Updated Jest configuration to use `babel-jest` for testing ES modules, removing the custom transformer hack.
- **Centralized Asset Management:** Implemented a dedicated `PreloaderScene` to handle asset generation and loading.
  - Moved procedural texture generation logic from `MainScene.preload()` to `PreloaderScene`.
  - Added a visual loading bar to `PreloaderScene` to provide feedback during initialization.
  - `MainScene` now focuses purely on gameplay logic and rendering.

## [0.6.0] - 2025-11-30

### Added
- **Comprehensive Minigame Test Coverage:** Implemented a robust test suite (`tests/Minigames.test.js`) covering the Artisan, Healer, and Scout career mini-games.
  - Achieved ~98% test coverage for all three mini-game scenes.
  - Verified critical game loops, win/loss conditions, input handling, and event emission logic.
  - Added mocks for Phaser's `Scene`, `Time`, and `Input` systems to ensure reliable, deterministic testing.

## [0.5.6] - 2025-11-29

### Fixed
- **UI Button System:** Restored the missing `js/ButtonFactory.js` and integrated it into `js/UIScene.js`.
  - Implemented the `ButtonFactory` class to generate responsive, "Neo-Retro" 3D-style buttons.
  - Updated the `UIScene` responsive layout to correctly calculate the dimensions of the new 3D button containers, ensuring no overlap on mobile or desktop.
  - Fixed unit tests in `tests/legacy.test.js` to support the new `ButtonFactory` dependency.

## [0.5.5] - 2025-11-29

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

## [0.5.4] - 2025-11-28

### Fixed
- **Crafting Logic Exploit:** Fixed a bug in `Nadagotchi.js` where players could craft items they had not yet discovered (i.e., not in `discoveredRecipes`). Added a validation check to `craftItem`.
- **Default Recipe Initialization:** Ensured that default recipes (like "Fancy Bookshelf") are automatically added to the player's discovered recipes for new games, preserving the intended progression flow.

## [0.5.3] - 2025-11-27

### Fixed
- **UI Overlap Issues:**
  - Resolved overlapping text in the top-left corner by moving the Date/Time display to the top-right corner.
  - Resolved button overlap in the bottom action bar by splitting the action buttons into two distinct rows (Core Actions and Menus), ensuring they no longer conflict with the "Job Board" button on smaller screens.
- **Critical Syntax Error:** Fixed a mangled and duplicated `handleUIAction` method in `js/MainScene.js` that was preventing the game from running correctly.

## [0.5.2] - 2025-11-16

### Fixed
- **Syntax Error in MainScene:** Fixed a duplicated and conflicting `handleUIAction` method definition in `js/MainScene.js` that caused syntax errors and prevented tests from running.
- **Runtime Error (Black Screen):** Fixed a crash caused by using `addDynamicTexture` (a Phaser 3.60+ feature) in an environment using an older Phaser version. Replaced it with `createCanvas`, restoring correct rendering of the sky and game scene.

## [0.5.1] - 2025-11-16

### Fixed
- **Syntax Error in Core Logic:** Fixed a duplicated and conflicting method definition in `js/Nadagotchi.js` that caused syntax errors and potential logic bugs in NPC interactions.
- **Test Suite Syntax Error:** Fixed missing closing braces in `tests/Nadagotchi.test.js`, restoring the integrity of the test suite and ensuring all tests run correctly.

## [0.5.0] - 2025-11-16

### Added
- **Expanded NPC Interactions:** Replaced the generic "friend" NPC with a cast of three distinct, career-focused NPCs: the "Grizzled Scout," "Master Artisan," and "Sickly Villager."
  - Interacting with these NPCs now provides small skill gains in their respective career paths (Navigation, Crafting, and Empathy), creating a more interconnected game world and rewarding social engagement.
  - Added unique sprites and interaction handlers for each new NPC in `MainScene.js`.

## [0.4.1] - 2025-11-16

### Fixed
- **Incorrect Tie-Breaking Logic:** Fixed a bug in `updateDominantArchetype` where a tie for the dominant archetype was not correctly handling the incumbent. The logic now correctly prioritizes the existing archetype in a tie, or chooses randomly if the incumbent is not involved.

## [0.4.0] - 2025-11-16
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
