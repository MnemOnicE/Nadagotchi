# Nadagotchi

[![Deploy](https://github.com/MnemOnicE/Nadagotchi/actions/workflows/deploy.yml/badge.svg)](https://github.com/MnemOnicE/Nadagotchi/actions/workflows/deploy.yml) ![License](https://img.shields.io/badge/license-ISC-blue?style=flat-square) ![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Phaser](https://img.shields.io/badge/Phaser-3.55.2-brightgreen?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white) ![Jest](https://img.shields.io/badge/Jest-30.2.0-C21325?style=flat-square&logo=jest&logoColor=white)

**A complex, reactive virtual pet simulation built with Phaser 3.**

## High-Level Purpose

Nadagotchi is designed to be more than a simple "feed and clean" simulator. It is an exploration of:
*   **Emergent Personality:** A pet's behavior and needs are driven by a dynamic personality system (Archetypes) that evolves based on player actions.
*   **Genetic Legacy:** A Mendelian-inspired genetics engine allows traits to be passed down through generations, creating a long-term lineage strategy.
*   **Living World:** A rigorous clock system, dynamic weather, seasonal festivals, and NPC interactions create a world that feels alive and reactive.

The software architecture is built to be modular, event-driven, and testable, separating core simulation logic (`Nadagotchi.js`, `GeneticsSystem.js`) from the presentation layer (`Phaser Scenes`).

## Installation & Setup

### Prerequisites
*   **Node.js** (v14 or higher)
*   **npm** (Node Package Manager)

### Step-by-Step Guide

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd nadagotchi
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    Starts a local Vite server with hot-reloading.
    ```bash
    npm run dev
    ```
    Access the game at `http://localhost:5173` (or similar).

4.  **Run Tests**
    Executes the Jest test suite.
    ```bash
    npm test
    ```

5.  **Build for Production**
    Generates optimized static assets in the `dist/` folder.
    ```bash
    npm run build
    ```

## Usage Examples

### Simulation Core (Headless)
You can instantiate the core pet logic independently of the graphics engine, useful for testing or server-side simulation.

```javascript
import { Nadagotchi } from './js/Nadagotchi.js';

// Create a new pet with the 'Intellectual' archetype
const pet = new Nadagotchi('Intellectual');

// Simulate a game tick
// Pass in the current world state (Weather, Time, etc.)
pet.live({
    weather: 'Rainy',
    time: 'Day',
    season: 'Autumn'
});

// Perform an action
pet.handleAction('STUDY');

console.log(`Current Mood: ${pet.mood}`); // e.g., 'happy'
console.log(`Logic Skill: ${pet.skills.logic}`);
```

### Event System
The game uses a centralized event bus for decoupling logic from UI.

```javascript
import { EventKeys } from './js/EventKeys.js';

// In a Scene (e.g., MainScene.js)
// Listen for UI actions
this.game.events.on(EventKeys.UI_ACTION, (actionType, data) => {
    if (actionType === EventKeys.FEED) {
        this.nadagotchi.handleAction('FEED');
    }
});

// Emit an event (e.g., from a button click in UIScene.js)
this.game.events.emit(EventKeys.UI_ACTION, EventKeys.FEED);
```

## File Structure

### Core Systems (`js/`)
*   **`Nadagotchi.js`**: The "Brain" of the pet. Manages state, stats, skills, and the main lifecycle loop (`live()`).
*   **`GeneticsSystem.js`**: Handles DNA generation, inheritance, mutation, and phenotype calculation.
*   **`Config.js`**: Central configuration for game balance (stat decay rates, thresholds).
*   **`ItemData.js`**: Static definitions for items and crafting recipes.
*   **`EventKeys.js`**: Constant registry for all system events.

### Managers (`js/`)
*   **`PersistenceManager.js`**: Handles saving/loading data to `localStorage` with integrity checks (hashing).
*   **`EventManager.js`**: Manages seasonal festivals and spontaneous world events.
*   **`Calendar.js`**: Tracks days and seasons.
*   **`WorldClock.js`**: Manages the day/night cycle and time transitions.
*   **`WeatherSystem.js`**: Controls dynamic weather changes.
*   **`NarrativeSystem.js`**: Generates procedural text for journals and advice.

### Scenes (`js/`)
*   **`PreloaderScene.js`**: Generates procedural assets and handles loading.
*   **`MainScene.js`**: The primary gameplay view. Renders the world and the pet.
*   **`UIScene.js`**: The "Physical Shell" dashboard. Manages UI, buttons, and modals.
*   **`BreedingScene.js`**: UI for the retirement and legacy system.
*   **`*MinigameScene.js`**: Specialized scenes for career mini-games (Logic, Scout, Healer, Artisan).

### Entry Point
*   **`js/game.js`**: Initializes the Phaser Game instance and registers scenes.
