## [1.36.0] - 2025-12-24

### Performance
- **Main Loop Optimization:** Refactored `MainScene.update` to reuse the `worldState` object instead of recreating it every frame, reducing garbage collection pressure.

### Changed
- **Quest Safety:** Refactored `QuestSystem.advanceQuest` to validate rewards before consuming quest items, preventing potential item loss if reward application fails ("Transaction Safety").
- **Personality Logic:** Updated `Nadagotchi.updateDominantArchetype` to use a random shuffle when breaking ties between archetypes, eliminating the previous alphabetical/index bias.

### DevOps
- **Dependencies:** Moved `playwright` to `devDependencies` in `package.json` to reduce production bundle size/dependencies.
