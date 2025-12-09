# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.19.0] - 2025-12-07

### Security
- **Hardened Persistence:** Updated `PersistenceManager` to salt the save file hash with the pet's unique UUID. This binds the save data to a specific pet instance, preventing save swapping and replay attacks.
- **Event System Validation:** Secured the `WORK_RESULT` event in `MainScene.js`. The scene now validates that a minigame was legitimately active before processing rewards, blocking console-based event injection exploits.
- **Resource Check Enforcement:** Updated `Nadagotchi.js` to strictly check for sufficient resources (Energy, Hunger) before executing actions. This fixes the "Zombie Pet" exploit where players could farm stats with 0 Energy.
- **Minigame State Protection:** Refactored all minigame scenes (`Artisan`, `Logic`, `Scout`, `Healer`) to use closures for game state (patterns, solutions). This prevents players from reading the solution from the browser console (`game.scene...`).
- **Inventory-Gated Breeding:** Updated `BreedingScene.js` to enforce strict inventory checks for all environmental influence items. Players can no longer select genetic modifiers they do not own.
- **Recipe Logic:** Updated `discoverRecipe` to return `false` if a recipe is already known, allowing strict quest progression checks and preventing reward farming.

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

## [1.9.0] - 2025-12-01

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

## [1.8.0] - 2025-11-30

### Added
- **Genetics System Backend:** Implemented `GeneticsSystem.js` with a Mendelian-inspired inheritance model using `Genome` class (Genotype/Phenotype).
- **Metabolism & Traits:** Integrated `metabolism` stat and Legacy Traits ("Night Owl", "Photosynthetic") into `Nadagotchi.js` life cycle.
- **Environmental Influence:** Updated breeding logic to allow items like "Nutrient Bar" and "Ancient Tome" to influence specific genes.
- **Unit Tests:** Added `tests/Genetics.test.js` covering recessive inheritance, mutation, and environmental dominance.

### Changed
- **Nadagotchi Integration:** Updated `Nadagotchi` constructor to use the new `Genome` class and support legacy save migration.
- **Breeding Scene:** Added "Nutrient Bar" to the breeding item selection to support metabolism modification.

## [1.7.0] - 2025-11-30

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

## [1.6.0] - 2025-11-30

### Added
- **Comprehensive Minigame Test Coverage:** Implemented a robust test suite (`tests/Minigames.test.js`) covering the Artisan, Healer, and Scout career mini-games.
  - Achieved ~98% test coverage for all three mini-game scenes.
  - Verified critical game loops, win/loss conditions, input handling, and event emission logic.
  - Added mocks for Phaser's `Scene`, `Time`, and `Input` systems to ensure reliable, deterministic testing.

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
