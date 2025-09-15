class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Load a placeholder spritesheet
        this.load.spritesheet('pet_sprites', 'https://via.placeholder.com/128x32', { frameWidth: 32, frameHeight: 32 });
        // Load the new thought bubble image
        this.load.image('thought_bubble', 'https://via.placeholder.com/32x32/ffffff/000000.png?text=!');
    }

    create() {
        // --- Initialize the Nadagotchi "Brain" ---
        this.nadagotchi = new Nadagotchi('Adventurer');

        // --- Initialize UI ---
        this.sprite = this.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pet_sprites');
        this.thoughtBubble = this.add.sprite(this.sprite.x, this.sprite.y - 40, 'thought_bubble').setVisible(false);
        this.statsText = this.add.text(10, 10, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' });

        // --- Initialize Action Buttons ---
        const feedButton = this.add.text(10, 70, 'Feed', { padding: { x: 10, y: 5 }, backgroundColor: '#008800' }).setInteractive();
        feedButton.on('pointerdown', () => this.nadagotchi.handleAction('FEED'));

        const playButton = this.add.text(80, 70, 'Play', { padding: { x: 10, y: 5 }, backgroundColor: '#000088' }).setInteractive();
        playButton.on('pointerdown', () => this.nadagotchi.handleAction('PLAY'));

        const studyButton = this.add.text(150, 70, 'Study', { padding: { x: 10, y: 5 }, backgroundColor: '#880000' }).setInteractive();
        studyButton.on('pointerdown', () => this.nadagotchi.handleAction('STUDY'));
    }

    update(time, delta) {
        this.nadagotchi.live();
        this.updateStatsUI();
        this.updateSpriteMood();
        this.checkProactiveBehaviors();
    }

    // --- SYSTEM VISUALIZATION METHODS ---

    updateStatsUI() {
        const stats = this.nadagotchi.stats;
        const text = `Archetype: ${this.nadagotchi.dominantArchetype}\n` +
                     `Mood: ${this.nadagotchi.mood}\n` +
                     `Hunger: ${Math.floor(stats.hunger)}\n` +
                     `Energy: ${Math.floor(stats.energy)}\n` +
                     `Happiness: ${Math.floor(stats.happiness)}`;
        this.statsText.setText(text);
    }

    updateSpriteMood() {
        switch(this.nadagotchi.mood) {
            case 'happy': this.sprite.setFrame(0); break;
            case 'neutral': this.sprite.setFrame(1); break;
            case 'sad': this.sprite.setFrame(2); break;
            case 'angry': this.sprite.setFrame(3); break;
            default: this.sprite.setFrame(1);
        }
    }

    checkProactiveBehaviors() {
        if (this.thoughtBubble.visible) return;

        if (this.nadagotchi.mood === 'happy' && this.nadagotchi.dominantArchetype === 'Adventurer') {
            if (Phaser.Math.Between(1, 750) === 1) {
                this.thoughtBubble.setVisible(true);
                this.time.delayedCall(2000, () => {
                    this.thoughtBubble.setVisible(false);
                });
            }
        }
    }
}
