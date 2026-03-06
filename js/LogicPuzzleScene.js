import { EventKeys } from './EventKeys.js';
import { Config } from './Config.js';                    endGame(true);
                } else {
                    canPlayerClick = false;
                    this.time.delayedCall(1000, () => generateSequence());
                }
            }
        };

        const createColorButton = (x, y, color, name) => {
            const button = this.add.rectangle(x, y, 80, 80, color).setInteractive({ useHandCursor: true });
            button.name = name;
            button.on('pointerdown', () => handlePlayerClick(name));
            return button;
        };

        const playSequence = () => {
            canPlayerClick = false;
            let delay = 500;
            sequence.forEach(colorName => {
                this.time.delayedCall(delay, () => {
                    const button = colorButtons[colorName];
                    this.tweens.add({ targets: button, alpha: 0.2, duration: 250, yoyo: true });
                });
                delay += 500;
            });
            this.time.delayedCall(delay, () => { canPlayerClick = true; });
        };

        const generateSequence = () => {
            playerSequence = [];
            sequence = [];
            const colors = ['red', 'green', 'blue', 'yellow'];
            for (let i = 0; i < level; i++) {
                sequence.push(Phaser.Utils.Array.GetRandom(colors));
            }
            playSequence();
        };

        // --- Initialization ---
        colorButtons.red = createColorButton(this.cameras.main.width / 2 - 100, 200, 0xff0000, 'red');
        colorButtons.green = createColorButton(this.cameras.main.width / 2, 200, 0x00ff00, 'green');
        colorButtons.blue = createColorButton(this.cameras.main.width / 2 + 100, 200, 0x0000ff, 'blue');
        colorButtons.yellow = createColorButton(this.cameras.main.width / 2, 300, 0xffff00, 'yellow');

        this.time.delayedCall(1000, () => generateSequence());
    }
}
