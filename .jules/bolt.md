## 2025-12-07 - Canvas Redraw Optimization
**Learning:** Phaser `CanvasTexture` operations (`createLinearGradient`, `fillRect`) are expensive when executed every frame in `update()`. Visuals that depend on slowly changing state (like daylight cycle) or static state (idle animations) should use a dirty flag to skip redundant redraws.
**Action:** When implementing procedural textures in update loops, always implement a state tracking mechanism (e.g., `lastState !== currentState`) to prevent wasted CPU/GPU cycles.
