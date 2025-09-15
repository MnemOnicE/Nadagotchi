const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 240,
    parent: 'game-container',
    backgroundColor: '#cccccc',
    scene: [MainScene, UIScene]
};

const game = new Phaser.Game(config);
