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
    -   [x] Refined the personality system's tie-breaking logic to be skill-based and deterministic.

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
-   **[x] Hybrid Career System:**
    -   [x] Developed a "multi-classing" system to allow for hybrid careers.
    -   [x] Implemented the "Archaeologist" career (Adventurer + Intellectual).
    -   [x] Implemented the "Research" skill and integrated it into study loops.
-   **[ ] Future Work:**
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
        -   [x] Refined festival timing to align with astronomical events (Equinoxes/Solstices) for "Clock Rigor".
-   **[ ] Future Work:**
    -   [x] Allow for deeper home customization with player-placed furniture.
    -   [x] **Inventory/Item Management UI:** Develop a dedicated UI modal for viewing all items, quantities, and descriptions, which is currently missing but required.
    -   [x] Expand NPC interactions with more complex dialogues and relationship-based events.
        -   [x] Implemented multi-stage quest system (e.g., Masterwork Crafting).
        -   [x] Hardened quest logic to prevent progression exploits.

### **III. Technical Foundation & Architecture**
-   **[x] Modern Tooling & Architecture:**
    -   [x] Migrated codebase to ES6 Modules with `import`/`export`.
    -   [x] Implemented Vite for development and building.
    -   [x] Centralized asset management in a dedicated `PreloaderScene`.
    -   [x] Standardized unit testing with Jest and Babel.
    -   [x] Refactored codebase to use centralized Configuration and Event Keys for better maintainability.
    -   [x] Cleanup and Documentation: Created `GUIDE.md` and removed redundant logic from core classes.
    -   [x] **Refactoring:** Extracted NPC and Quest logic from `Nadagotchi.js` into `RelationshipSystem.js` and Inventory logic into `InventorySystem.js` to decouple core systems.
-   **[x] Security & Balance:**
    -   [x] Implemented save data obfuscation with UUID salting and integrity verification to prevent tampering and save swapping.
    -   [x] Hardened event system and action handlers to prevent console injection and logic exploits.
    -   [x] Implemented diminishing returns logic for minigame rewards to ensure long-term progression balance.
-   **[x] Settings & Accessibility:**
    -   [x] **In-Game Settings/Options:** Implemented persistent settings for volume and gameplay speed.
    -   [x] Refactored core loop to be delta-time based to support variable game speeds and framerate independence.
    -   [x] **Accessibility & Polish:** Implemented keyboard navigation for tabs and improved button visual feedback (hover states).
    -   [x] **UI Window Management:** Implemented exclusive window management to prevent menu stacking (Inventory over Journal, etc.).
-   **[x] Production Readiness:**
    -   [x] **PWA Support:** Implemented Service Worker and Web Manifest for installable, offline-capable app.
    -   [x] **CI/CD:** Established GitHub Actions workflow for automated testing and building.
    -   [x] **Build Config:** Configured Vite for optimized production builds.

---

## **Phase 3: Generational & Meta-Game Systems (In Progress)**

This phase will introduce long-term replayability and a deeper sense of history and accomplishment.

### **IV. Generational Legacy & Breeding System**
-   **[x] Initial Implementation:**
    -   [x] Design the "Breeding Den" UI and environment.
    -   [x] Develop the core mechanic for "Personality Gene" inheritance.
    -   [x] Create unique egg designs that hint at the offspring's inherited traits.
-   **[x] Advanced Features (Genetics Engine):**
    -   [x] **GeneticsSystem:** Implemented a backend logic layer (Genotype/Phenotype) supporting Mendelian-inspired inheritance.
    -   [x] **Traits & Metabolism:** Wired passive traits (Night Owl/Photosynthetic) and Metabolism to directly affect the `live()` simulation loop (stats decay).
    -   [x] **Environmental Influence:** Integrated item-based gene modification (e.g., "Espresso", "Chamomile") into the breeding process.
        -   [x] Expanded influence to include crafted items and resources.
    -   [x] **Genetic Scanner:** Implemented a UI tool to allow players to inspect the raw Genotype (alleles), highlighting heterozygous traits.
    -   [x] **Randomness & Mutation:** Added mutation logic and random "wild" gene generation for deeper variety.
    -   [x] **Homozygous Bonuses:** Implemented specific stat and gameplay bonuses for pets with homozygous genes (Personality & Physio).
-   **[x] Hall of Ancestors:**
    -   [x] Introduce a "Hall of Ancestors" to commemorate retired pets.
    -   [x] Ancestors offer advice based on their personality.

### **V. Meta-Game & Community Features**
-   **[x] Initial Implementation:**
    -   [x] Create the "Tamagotchi Journal" to automatically log significant events and create a personal narrative.
    -   [x] Develop a "Recipe/Crafting Book" to collect and reference discovered recipes.
    -   [x] **Genetics Loop:** Connected crafting and seasons to genetics via specific items (e.g., "Metabolism-Slowing Tonic").
-   **[x] First Time User Experience:**
    -   [x] **Onboarding Flow:** Implemented a comprehensive start screen and tutorial system (Town Gate Theme) to guide new players.
-   **[ ] Advanced Features:**
    -   [x] **Achievement Tracking System:** Implement backend logic to track milestones (e.g., "Breed 5 Generations," "Master a Career"), serving as the next logical step after stabilizing the core game loop.
    -   [x] **Achievements UI:** Implement frontend UI to visualize unlocked achievements.
    -   [ ] Introduce a "Showcase System" for sharing pet snapshots and achievements.
    -   [ ] Develop the "Mystery Egg Exchange" for asynchronous sharing of genetic data with friends (Prerequisites met: Seeded RNG).
