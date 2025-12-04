/**
 * @fileoverview Entry point for the Nadagotchi game.
 * Configures the Phaser game instance, registers all scenes, and initializes the application.
 */

import { MainScene } from './MainScene.js';
import { UIScene } from './UIScene.js';
import { PreloaderScene } from './PreloaderScene.js';
import { BreedingScene } from './BreedingScene.js';
import { LogicPuzzleScene } from './LogicPuzzleScene.js';
import { ScoutMinigameScene } from './ScoutMinigameScene.js';
import { HealerMinigameScene } from './HealerMinigameScene.js';
import { ArtisanMinigameScene } from './ArtisanMinigameScene.js';

/**
 * Phaser Game Configuration.
 * Defines the renderer type, scaling mode, parent container, dimensions, and active scenes.
 * @type {Phaser.Types.Core.GameConfig}
 */
const config = {
    type: Phaser.AUTO, // Auto-detect WebGL or Canvas
    scale: {
        mode: Phaser.Scale.FIT, // Scale to fit window while maintaining aspect ratio
        parent: 'game-container', // DOM element ID to mount the game
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center vertically and horizontally
        width: 800,
        height: 600
    },
    scene: [
        PreloaderScene,        // 1. Loads assets
        MainScene,             // 2. Core gameplay loop
        UIScene,               // 3. UI Overlay
        BreedingScene,         // 4. Legacy/Retirement system
        LogicPuzzleScene,      // 5. Minigames...
        ScoutMinigameScene,
        HealerMinigameScene,
        ArtisanMinigameScene
    ]
};

// Initialize the Phaser Game instance
const game = new Phaser.Game(config);
