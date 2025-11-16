/**
 * @fileoverview This script initializes the Phaser game instance when the window loads.
 * It sets up the game configuration, including renderer type, dimensions, scenes, and scaling.
 */

window.onload = function() {
    /**
     * The main configuration object for the Phaser game.
     * @type {Phaser.Types.Core.GameConfig}
     */
    const config = {
        /** @type {number} Uses WebGL if available, otherwise falls back to Canvas. */
        type: Phaser.AUTO,
        /** @type {number} The width of the game canvas, set to the browser window's inner width. */
        width: window.innerWidth,
        /** @type {number} The height of the game canvas, set to the browser window's inner height. */
        height: window.innerHeight,
        /** @type {string} The ID of the DOM element to which the game canvas will be appended. */
        parent: 'game-container',
        /** @type {Array<Phaser.Scene>} An array of all scenes used in the game. The first scene in the array is the one that starts automatically. */
        scene: [MainScene, UIScene, BreedingScene, LogicPuzzleScene, ScoutMinigameScene, HealerMinigameScene, ArtisanMinigameScene],
        /** @type {Phaser.Types.Core.ScaleConfig} Configuration for how the game canvas should be scaled. */
        scale: {
            /** @type {Phaser.Scale.ScaleModeType} The scale mode. FIT attempts to scale the game to fit the parent container, maintaining aspect ratio. */
            mode: Phaser.Scale.FIT,
            /** @type {Phaser.Scale.CenterType} The auto-centering mode. CENTER_BOTH centers the canvas both horizontally and vertically. */
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    /**
     * The global Phaser game instance.
     * @type {Phaser.Game}
     */
    const game = new Phaser.Game(config);
};
