import { PreloaderScene } from './PreloaderScene.js';
import { StartScene } from './StartScene.js';
import { MainScene } from './MainScene.js';
import { UIScene } from './UIScene.js';
import { BreedingScene } from './BreedingScene.js';
import { ShowcaseScene } from './ShowcaseScene.js';
import { GhostScene } from './GhostScene.js';
// Minigames
import { LogicPuzzleScene } from './LogicPuzzleScene.js';
import { ScoutMinigameScene } from './ScoutMinigameScene.js';
import { HealerMinigameScene } from './HealerMinigameScene.js';
import { ArtisanMinigameScene } from './ArtisanMinigameScene.js';
import { ExpeditionScene } from './ExpeditionScene.js';
// New Minigames
import { DanceMinigameScene } from './DanceMinigameScene.js';
import { StudyMinigameScene } from './StudyMinigameScene.js';

/**
 * @fileoverview Main entry point for the Phaser game.
 * Initializes the game configuration and registers all scenes.
 */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        PreloaderScene,
        StartScene,
        MainScene,
        UIScene,
        BreedingScene,
        ShowcaseScene,
        GhostScene,
        LogicPuzzleScene,
        ScoutMinigameScene,
        HealerMinigameScene,
        ArtisanMinigameScene,
        ExpeditionScene,
        DanceMinigameScene,
        StudyMinigameScene
    ],
    pixelArt: true, // For retro feel
    dom: {
        createContainer: true
    }
};

const game = new Phaser.Game(config);
