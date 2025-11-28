import { MainScene } from './MainScene.js';
import { UIScene } from './UIScene.js';
import { PreloaderScene } from './PreloaderScene.js';
import { BreedingScene } from './BreedingScene.js';
import { LogicPuzzleScene } from './LogicPuzzleScene.js';
import { ScoutMinigameScene } from './ScoutMinigameScene.js';
import { HealerMinigameScene } from './HealerMinigameScene.js';
import { ArtisanMinigameScene } from './ArtisanMinigameScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: [
        PreloaderScene,
        MainScene,
        UIScene,
        BreedingScene,
        LogicPuzzleScene,
        ScoutMinigameScene,
        HealerMinigameScene,
        ArtisanMinigameScene
    ]
};

const game = new Phaser.Game(config);
