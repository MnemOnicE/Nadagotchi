# Roadmap

This document outlines the planned future direction of the Nadagotchi project.

---

## Phase 1: Core Gameplay Loop (Complete)

This phase focused on building the fundamental mechanics of the game: caring for the Nadagotchi, influencing its personality, and seeing it grow.

### **Version 0.1: Project Foundation**
-   [x] Establish core project documentation.

### **Version 0.2: Personality & Interaction**
-   [x] Implement the "Explore" action to deepen the personality system.

### **Version 0.3: Skill & Growth**
-   [x] Implement mood-based skill development ('Study' action).

### **Version 0.4: Meaningful Progression**
-   [x] Implement Job Board for Unlocked Careers.

---

## Phase 1.5: Architectural Improvements (Complete)

This phase focused on improving the underlying code structure to ensure scalability and maintainability.

### **Version 0.5: UI Refactoring**
-   [x] **Refactor UI into a dedicated scene (`UIScene`).**
-   [x] Establish event-based communication between game and UI scenes.
-   [x] **Optimize for Mobile:** The game is now fully responsive and playable on both desktop and mobile devices.
-   [ ] Add comprehensive tests for the UI scene and its events.

---

## Phase 2: Advanced Systems (Upcoming)

This phase will introduce more complex, long-term systems that give the game replayability and depth.

### **Version 0.6/0.7: The Career System**
-   [ ] **Flesh out the Career System:**
    -   [x] Implement the logic for achieving the "Innovator" career based on skill thresholds (e.g., `logic > 10`).
    -   [x] Create a visual in-game notification when a career is unlocked.
    -   [x] Add logic for at least one other career path (e.g., "Scout" for Adventurers).
    -   [x] Add logic for "Nurturer" and "Recluse" careers.

### **Version 1.0: Public Release**
-   [ ] Implement all core features from Phases 1, 1.5 & 2.
-   [ ] Achieve a stable, well-tested state.
-   [ ] Prepare for a public release.
