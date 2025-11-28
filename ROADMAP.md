# Nadagotchi Project Roadmap

This document outlines the development plan for the Nadagotchi project, inspired by the detailed vision in `Design.md`. Our goal is to create a deeply engaging and reactive virtual pet experience.

---

## **Phase 1: Core Simulation & Personality (Complete)**

This foundational phase focused on bringing the Nadagotchi to life with a dynamic personality and core interactive systems.

-   **[x] Version 0.1: Project Foundation:** Established core documentation.
-   **[x] Version 0.2: Foundational Personality System:** Implemented core archetypes and mood responses.
-   **[x] Version 0.3: Basic Interaction & Growth:** Introduced early actions ('Explore', 'Study') to influence personality and skills.
-   **[x] Version 0.5: UI Refactoring:** Separated UI into a dedicated `UIScene` for better scalability and implemented a responsive, mobile-first design.
-   **[x] Version 1.2: Core Test Coverage:** Added crucial unit tests for `PersistenceManager.js` and `Nadagotchi.js` to ensure stability.
    -   [x] Fixed a bug in the personality system's tie-breaking logic to ensure predictable behavior.

---

## **Phase 2: Progression & A Living World (In Progress)**

This phase focuses on building out the primary gameplay loops, giving players clear goals and a more interactive environment.

### **I. Career/Life Path System & Skill Development**
-   **[x] Foundational Career System:**
    -   [x] Implemented logic for core careers (Innovator, Scout, Healer, Artisan).
    -   [x] Added in-game notifications for unlocking new careers.
    -   [x] Created a Job Board for unlocked career paths.
-   **[x] Initial Mini-Game Implementation:**
    -   [x] Designed and implemented the 'Logic Puzzle' mini-game for the Innovator career.
-   **[x] Career Mini-Games:**
    -   [x] Designed and implemented unique, engaging mini-games for the Scout, Healer, and Artisan careers.
     -   [x] Implemented comprehensive test coverage for all career mini-games.
-   **[ ] Future Work:**
    -   [ ] Develop a "multi-classing" system to allow for hybrid careers (e.g., Archaeologist from Adventurer + Intellectual skills).
    -   [ ] Introduce NPC "mentors" in career-specific guilds to guide skill development.

### **II. Dynamic World Events & Environmental Interaction**
-   **[x] Interactive Home Environment:**
    -   [x] Added clickable objects and furniture in the pet's home for organic skill-building.
-   **[x] Exploration & Foraging System:**
    -   [x] Implemented a system for discovering new locations and finding crafting resources.
-   **[x] Social & Relationship System:**
    -   [x] Pets can now build foundational relationships with other characters.
    -   [x] Replaced the generic 'friend' with a cast of career-focused NPCs (Scout, Artisan, Healer) to create a more interconnected world.
-   **[x] Dynamic World System:**
    -   [x] Implemented a full Day/Night cycle and dynamic Weather System that affects mood and activities.
    -   [x] Introduced seasonal festivals and rare, spontaneous events (e.g., 'Traveling Merchant').
-   **[ ] Future Work:**
    -   [ ] Allow for deeper home customization with player-placed furniture.
    -   [ ] Expand NPC interactions with more complex dialogues and relationship-based events.

### **III. Technical Foundation & Architecture**
-   **[x] Modern Tooling & Architecture:**
    -   [x] Migrated codebase to ES6 Modules with `import`/`export`.
    -   [x] Implemented Vite for development and building.
    -   [x] Centralized asset management in a dedicated `PreloaderScene`.
    -   [x] Standardized unit testing with Jest and Babel.

---

## **Phase 3: Generational & Meta-Game Systems (Upcoming)**

This phase will introduce long-term replayability and a deeper sense of history and accomplishment.

### **IV. Generational Legacy & Breeding System**
-   **[ ] Initial Implementation:**
    -   [ ] Design the "Breeding Den" UI and environment. *(Backend logic implemented, UI pending)*
    -   [ ] Develop the core mechanic for "Personality Gene" inheritance.
    -   [ ] Create unique egg designs that hint at the offspring's inherited traits.
-   **[ ] Advanced Features:**
    -   [ ] Implement rare, inheritable "Legacy Traits" that grant unique abilities.
    -   [ ] Introduce a "Hall of Ancestors" to commemorate retired pets.
    -   [ ] Allow player actions to influence offspring traits ("Nurture over Nature").

### **V. Meta-Game & Community Features**
-   **[ ] Initial Implementation:**
    -   [ ] Create the "Tamagotchi Journal" to automatically log significant events and create a personal narrative.
    -   [ ] Develop a "Recipe/Crafting Book" to collect and reference discovered recipes.
-   **[ ] Advanced Features:**
    -   [ ] Implement an in-game achievement and milestone system.
    -   [ ] Introduce a "Showcase System" for sharing pet snapshots and achievements.
    -   [ ] Develop the "Mystery Egg Exchange" for asynchronous sharing of genetic data with friends.
