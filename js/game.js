window.onload = function() {
    const config = {
        type: Phaser.AUTO,
        width: 480,
        height: 320,
        parent: 'game-container',
        scene: [MainScene, UIScene]
    };

    const game = new Phaser.Game(config);
};
