# Nadagotchi

Nadagotchi is a virtual pet game inspired by Tamagotchi, built with the Phaser.js game engine. It features a deep, emergent personality system where the pet's mood, archetype, and skills evolve based on player interactions and a dynamic world.

## Core Features

*   **Dynamic Personality System:** Pets have core archetypes (e.g., Adventurer, Nurturer, Intellectual) and their mood shifts based on their needs and the environment.
*   **Skill & Career Progression:** Pets can develop skills like logic, navigation, and empathy, which can unlock unique career paths and mini-games.
*   **Generational Legacy:** "Retire" an elder pet to the Hall of Fame and start a new generation, passing down inherited traits and creating a unique lineage.
*   **Dynamic World:** The game features a day/night cycle, changing weather, and seasonal events that impact the pet's life and mood.
*   **Persistent Data:** The game saves your pet's progress, journal entries, and discovered recipes to your browser's `localStorage`.

## Getting Started

To run the Nadagotchi prototype locally, you need a simple local web server. Python's built-in HTTP server is a great option.

### Prerequisites

*   [Python 3](https://www.python.org/downloads/) installed on your system.

### Running the Game

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/nadagotchi.git
    cd nadagotchi
    ```

2.  **Start the local web server:**
    ```bash
    python -m http.server
    ```
    This command will start a server, typically on port 8000.

3.  **Open the game in your browser:**
    Navigate to `http://localhost:8000` in your web browser. The game should load and start.

## Code Structure

The game's source code is located in the `js/` directory.

*   **`game.js`**: The main entry point. It initializes the Phaser game instance and registers all the scenes.
*   **`Nadagotchi.js`**: The "brain" of the pet. This class manages all of the pet's internal state, including stats, mood, personality, skills, and career. It is not tied to Phaser and contains only pure game logic.
*   **`PersistenceManager.js`**: A utility class for saving and loading all game data to and from `localStorage`.

### Scenes (`js/*Scene.js`)

The game is built using multiple Phaser Scenes that manage different parts of the experience.

*   **`MainScene.js`**: The primary scene for gameplay. It renders the pet, the environment, and runs the main game loop.
*   **`UIScene.js`**: Runs in parallel with `MainScene` to handle all UI elements, such as stats displays, buttons, and modals.
*   **`BreedingScene.js`**: The scene for the Generational Legacy system, where a pet is retired and a new one is created.
*   **Mini-game Scenes**:
    *   `LogicPuzzleScene.js` (Innovator career)
    *   `ScoutMinigameScene.js` (Scout career)
    *   `HealerMinigameScene.js` (Healer career)
    *   `ArtisanMinigameScene.js` (Artisan career)

### World Systems (`js/*.js`)

These classes manage the dynamic world the pet lives in.

*   **`Calendar.js`**: Manages the in-game date and seasons.
*   **`EventManager.js`**: Triggers seasonal festivals and rare, spontaneous events.
*   **`WorldClock.js`**: Manages the 24-hour day/night cycle.
*   **`WeatherSystem.js`**: Manages weather changes and their effects.
"
