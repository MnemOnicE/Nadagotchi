class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Load a placeholder image from an external service
        this.load.image('pet', 'https://via.placeholder.com/32');
    }

    create() {
        // Create an instance of our Nadagotchi data class
        this.nadagotchi_data = new Nadagotchi('Adventurer');

        // Add the placeholder sprite to the center of the screen
        this.sprite = this.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pet');

        // Attach the data object to the sprite
        this.sprite.setData('instance', this.nadagotchi_data);

        // Display the stats and store the text object for updates
        this.statsText = this.add.text(10, 10, this.getStatsText());

        // Create a clickable "Feed" button
        const feedButton = this.add.text(10, 70, 'Feed Me!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            backgroundColor: '#4D4D4D',
            color: '#ffffff',
            padding: { x: 10, y: 5 }
        });
        feedButton.setInteractive();
        feedButton.on('pointerdown', () => {
            this.nadagotchi_data.feed();
        });

        // Create a clickable "Play" button
        const playButton = this.add.text(100, 70, 'Play', {
            fontFamily: 'Arial',
            fontSize: '16px',
            backgroundColor: '#4D4D4D',
            color: '#ffffff',
            padding: { x: 10, y: 5 }
        });
        playButton.setInteractive();
        playButton.on('pointerdown', () => {
            this.nadagotchi_data.play();
        });
    }

    update() {
        // Decrease hunger over time
        this.nadagotchi_data.stats.hunger -= 0.015; // Adjust for desired speed
        if (this.nadagotchi_data.stats.hunger < 0) {
            this.nadagotchi_data.stats.hunger = 0;
        }

        // Update the UI text to show the current hunger
        this.statsText.setText(this.getStatsText());
    }

    getStatsText() {
        // Helper function to format the stats text
        return `Archetype: ${this.nadagotchi_data.getArchetype()}\nMood: ${this.nadagotchi_data.getMood()}\nHunger: ${Math.floor(this.nadagotchi_data.stats.hunger)}`;
    }
}
