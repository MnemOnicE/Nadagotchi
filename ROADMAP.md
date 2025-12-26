# Roadmap

## Phase 1: Core Mechanics (Completed)
- [x] **Personality System:** 8 unique archetypes (Intellectual, Adventurer, etc.) with dominant/recessive genes.
- [x] **Career System:** 4 specialized careers (Innovator, Scout, Healer, Artisan) + 1 Hybrid Career (Archaeologist).
- [x] **Breeding System:** Mendelian inheritance logic with mutation and environmental influence.
- [x] **Quest System:** NPC relationship progression, daily quests, and multi-stage narratives.
- [x] **Inventory System:** Crafting, Foraging, and Consumption logic.
- [x] **Minigames:** Skill-based tasks for each career (Logic Puzzles, Pathfinding, Rhythm, Crafting).
- [x] **Expeditions:** Procedural exploration minigame with risk/reward choices.

## Phase 2: User Experience & Polish (Completed)
- [x] **UI Overhaul:** Responsive, mobile-friendly "Physical Shell" interface.
- [x] **Accessibility:** Keyboard navigation, high-contrast assets, screen reader friendly structure.
- [x] **Code Quality:** Comprehensive JSDoc coverage, unit tests, and rigorous linting.
- [x] **Save Security:** Base64 encoding + Hash Integrity Checks to prevent save scumming.
- [x] **Determinism:** Seeded RNG for replayable but consistent procedural events.
- [x] **Test Coverage:** Critical path verification (90%+ on Systems) and Scene Logic (Preloader/Minigames).
- [x] **Sound System:** Procedural SFX engine (SoundSynthesizer) with input validation.

## Phase 3: Meta-Game & Expansion (In Progress)
- [x] **Housing System:** Drag-and-drop furniture arrangement ("Decoration Mode").
- [ ] **Housing System II:** Wallpapers, flooring, and room expansions.
- [ ] **Social Features:** Asynchronous pet visits via QR codes (extending the "Mystery Egg" system).
- [ ] **Advanced Genetics:** Epigenetics (gameplay affecting gene expression) and 3-trait hybrids.
- [ ] **Accessibility Suite:** Colorblind modes, text-to-speech integration for narrative events.
- [ ] **Localization:** Support for Spanish, French, and Japanese.

## Technical Debt / Infrastructure
- [x] **Vite Migration:** Modern build pipeline.
- [x] **CI/CD:** Automated testing and deployment via GitHub Actions.
- [x] **Documentation:** Centralized `Design.md`, `GUIDE.md`, and Architecture `README.md`.
- [ ] **Performance:** WebGL shader optimization for mobile battery life.
- [ ] **State Management:** Migration to Redux-like state container for UI complexity management.
