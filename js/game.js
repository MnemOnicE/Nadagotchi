/**
 * @fileoverview Entry point for the Nadagotchi game.
 * Configures the Phaser game instance, registers all scenes, and initializes the application.
 */

import { MainScene } from './MainScene.js';
import { UIScene } from './UIScene.js';
import { PreloaderScene } from './PreloaderScene.js';
import { StartScene } from './StartScene.js';
import { BreedingScene } from './BreedingScene.js';
import { ShowcaseScene } from './ShowcaseScene.js';
import { LogicPuzzleScene } from './LogicPuzzleScene.js';
import { ScoutMinigameScene } from './ScoutMinigameScene.js';
import { HealerMinigameScene } from './HealerMinigameScene.js';
import { ArtisanMinigameScene } from './ArtisanMinigameScene.js';
import { ExpeditionScene } from './ExpeditionScene.js'; // Manual Override: Patch Applied.

/**
 * Phaser Game Configuration.
 * Defines the renderer type, scaling mode, parent container, dimensions, and active scenes.
 * @type {Phaser.Types.Core.GameConfig}
 */
const config = {
    type: Phaser.AUTO, // Auto-detect WebGL or Canvas
    scale: {
        mode: Phaser.Scale.RESIZE, // Scale the canvas to fill the parent container
        parent: 'game-container', // DOM element ID to mount the game
        autoCenter: Phaser.Scale.NO_CENTER, // CSS handles centering/sizing
        width: window.innerWidth, // Initial width
        height: window.innerHeight // Initial height
    },
    scene: [
        PreloaderScene,        // 1. Loads assets
        StartScene,            // 2. Main Menu / Onboarding
        MainScene,             // 3. Core gameplay loop
        UIScene,               // 4. UI Overlay
        BreedingScene,         // 5. Legacy/Retirement system
        ShowcaseScene,         // 6. Pet Passport
        LogicPuzzleScene,      // 7. Minigames...
        ScoutMinigameScene,
        HealerMinigameScene,
        ArtisanMinigameScene,
        ExpeditionScene
    ]
};

// Initialize the Phaser Game instance
const game = new Phaser.Game(config);
