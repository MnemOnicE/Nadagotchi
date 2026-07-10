/**
 * @fileoverview System for generating and managing pet visual appearance.
 * Creates procedural pet sprites from genetic data and body part configurations.
 */

import { Config } from '../Config.js';

/**
 * PetAppearanceSystem: Manages the visual representation of the pet.
 * Generates body parts, colors, and markings based on genetic traits.
 * @class PetAppearanceSystem
 */
export class PetAppearanceSystem {
    /**
     * Creates a new PetAppearanceSystem.
     * @param {import('../Nadagotchi.js').Nadagotchi} pet - The Nadagotchi instance.
     */
    constructor(pet) {
        this.pet = pet;
        this.bodyParts = this._generateBodyParts();
        this.colors = this._generateColors();
        this.markings = this._generateMarkings();
    }

    /**
     * Generates body part definitions based on pet genetics.
     * @private
     * @returns {Object} Body part configuration with types and variations.
     */
    _generateBodyParts() {
        // Use genome to influence body part selection if available
        const genome = this.pet.genome;
        const dominantArchetype = this.pet.dominantArchetype;

        // Base body parts with variations
        const headTypes = ['round', 'square', 'pointy', 'heart'];
        const torsoTypes = ['small', 'medium', 'large', 'stocky'];
        const handTypes = ['small', 'medium', 'large', 'paw'];
        const feetTypes = ['small', 'medium', 'large', 'hooved'];

        // Select body parts based on archetype or random
        const seed = genome ? this._hashString(JSON.stringify(genome.dna)) : Math.random();
        const rng = this._seededRandom(seed);

        return {
            head: this._selectWithBias(headTypes, dominantArchetype, 'head', rng),
            torso: this._selectWithBias(torsoTypes, dominantArchetype, 'torso', rng),
            hands: this._selectWithBias(handTypes, dominantArchetype, 'hands', rng),
            feet: this._selectWithBias(feetTypes, dominantArchetype, 'feet', rng)
        };
    }

    /**
     * Generates color scheme for the pet based on genetics.
     * @private
     * @returns {Object} Color configuration with primary, secondary, and accent colors.
     */
    _generateColors() {
        const genome = this.pet.genome;
        const seed = genome ? this._hashString(JSON.stringify(genome.dna)) : Math.random();
        const rng = this._seededRandom(seed + 1); // Different seed for colors

        // Color palettes based on archetype
        const archetypePalettes = {
            Intellectual: { primary: ['#4A6FA5', '#6B8CAE', '#8CA9D6'], secondary: ['#2A3F6A', '#1A2A4A'] },
            Adventurer: { primary: ['#FF8C42', '#FF6B1A', '#E55A2B'], secondary: ['#8B4513', '#A0522D'] },
            Nurturer: { primary: ['#FFB6C1', '#FFA0B4', '#FFC0CB'], secondary: ['#8B4513', '#654321'] },
            Mischievous: { primary: ['#9932CC', '#8A2BE2', '#9370DB'], secondary: ['#4B0082', '#663399'] },
            Recluse: { primary: ['#696969', '#808080', '#A9A9A9'], secondary: ['#000000', '#404040'] }
        };

        const dominantArchetype = this.pet.dominantArchetype;
        const palette = archetypePalettes[dominantArchetype] || archetypePalettes.Intellectual;

        return {
            primary: rng.choice(palette.primary),
            secondary: rng.choice(palette.secondary),
            accent: this._generateAccentColor(rng, palette.primary[0])
        };
    }

    /**
     * Generates markings pattern for the pet.
     * @private
     * @returns {Object} Markings configuration with pattern type and color.
     */
    _generateMarkings() {
        const genome = this.pet.genome;
        const seed = genome ? this._hashString(JSON.stringify(genome.dna)) : Math.random();
        const rng = this._seededRandom(seed + 2); // Different seed for markings

        const markingTypes = ['none', 'stripes', 'spots', 'swirls', 'patches', 'gradient'];
        const markingColors = ['#FFFFFF', '#000000', '#FFD700', '#C0C0C0'];

        const hasMarkings = rng.random() < 0.7; // 70% chance of having markings
        const markingType = hasMarkings ? rng.choice(markingTypes.filter(t => t !== 'none')) : 'none';
        const markingColor = markingType !== 'none' ? rng.choice(markingColors) : null;

        return {
            type: markingType,
            color: markingColor,
            density: hasMarkings ? rng.random() * 0.5 + 0.1 : 0 // 0.1 to 0.6 density
        };
    }

    /**
     * Selects a body part variation with archetype bias.
     * @private
     * @param {Array} options - Available options.
     * @param {string} archetype - Current dominant archetype.
     * @param {string} partType - Type of body part.
     * @param {Function} rng - Random number generator.
     * @returns {string} Selected option.
     */
    _selectWithBias(options, archetype, partType, rng) {
        // Define archetype preferences for each body part
        const preferences = {
            Intellectual: { head: 'round', torso: 'medium', hands: 'medium', feet: 'small' },
            Adventurer: { head: 'square', torso: 'large', hands: 'large', feet: 'large' },
            Nurturer: { head: 'heart', torso: 'medium', hands: 'small', feet: 'small' },
            Mischievous: { head: 'pointy', torso: 'small', hands: 'paw', feet: 'hooved' },
            Recluse: { head: 'round', torso: 'stocky', hands: 'small', feet: 'medium' }
        };

        const pref = preferences[archetype]?.[partType];
        if (pref && options.includes(pref)) {
            // 60% chance to use preferred type
            if (rng.random() < 0.6) {
                return pref;
            }
        }

        // Otherwise random
        return rng.choice(options);
    }

    /**
     * Generates an accent color that complements the primary color.
     * @private
     * @param {Function} rng - Random number generator.
     * @param {string} primaryColor - Primary color hex string.
     * @returns {string} Accent color hex string.
     */
    _generateAccentColor(rng, primaryColor) {
        // Simple complementary color generation
        const colors = [
            '#FFD700', // Gold
            '#FF69B4', // Hot Pink
            '#7CFC00', // Lawn Green
            '#1E90FF', // Dodger Blue
            '#FF4500'  // Orange Red
        ];
        return rng.choice(colors);
    }

    /**
     * Simple hash function for string to generate consistent seeds.
     * @private
     * @param {string} str - String to hash.
     * @returns {number} Hash value.
     */
    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Creates a simple seeded random generator.
     * @private
     * @param {number} seed - Seed value.
     * @returns {Object} Object with random() method.
     */
    _seededRandom(seed) {
        // Simple LCG (Linear Congruential Generator)
        let value = seed || 898989;
        
        const random = () => {
            value = (value * 1103515245 + 12345) % 2147483647;
            return value / 2147483647;
        };
        
        return {
            random: random,
            choice: (array) => {
                return array[Math.floor(random() * array.length)];
            }
        };
    }

    /**
     * Gets the complete appearance configuration.
     * @returns {Object} Full appearance configuration.
     */
    getAppearance() {
        return {
            bodyParts: this.bodyParts,
            colors: this.colors,
            markings: this.markings
        };
    }

    /**
     * Regenerates the pet's appearance based on current state.
     * Call this when genetics change or when loading a saved pet.
     */
    regenerate() {
        this.bodyParts = this._generateBodyParts();
        this.colors = this._generateColors();
        this.markings = this._generateMarkings();
    }

    /**
     * Handles window resize to reposition pet elements.
     * @param {Phaser.Scale.ScaleManager} gameSize - The new game dimensions.
     */
    resize(gameSize) {
        // Store the new size for future reference
        this.currentGameSize = gameSize;
        
        // If a pet container exists, it will be repositioned by the caller
        // The actual sprite elements maintain their relative positions
    }

    /**
     * Creates a sprite configuration for Phaser rendering.
     * @returns {Object} Sprite configuration with all visual properties.
     */
    getSpriteConfig() {
        const appearance = this.getAppearance();
        
        // Define base sizes for different body parts
        const partSizes = {
            head: { small: 40, medium: 50, large: 60 },
            torso: { small: 60, medium: 70, large: 80, stocky: 75 },
            hands: { small: 20, medium: 25, large: 30, paw: 22 },
            feet: { small: 25, medium: 30, large: 35, hooved: 32 }
        };

        // Map body part types to sizes
        const headSize = partSizes.head[appearance.bodyParts.head] || 50;
        const torsoSize = partSizes.torso[appearance.bodyParts.torso] || 70;

        return {
            // Base body configuration
            body: {
                width: torsoSize,
                height: torsoSize * 1.2,
                color: appearance.colors.primary,
                shape: this._getBodyShape(appearance.bodyParts.torso)
            },
            // Head configuration
            head: {
                width: headSize,
                height: headSize,
                color: appearance.colors.secondary,
                shape: appearance.bodyParts.head,
                // Position relative to body
                offsetX: 0,
                offsetY: -torsoSize / 2 - headSize / 2
            },
            // Hands configuration
            hands: {
                left: {
                    width: partSizes.hands[appearance.bodyParts.hands] || 25,
                    height: partSizes.hands[appearance.bodyParts.hands] || 25,
                    color: appearance.colors.secondary,
                    offsetX: -torsoSize / 2 - 10,
                    offsetY: 0
                },
                right: {
                    width: partSizes.hands[appearance.bodyParts.hands] || 25,
                    height: partSizes.hands[appearance.bodyParts.hands] || 25,
                    color: appearance.colors.secondary,
                    offsetX: torsoSize / 2 + 10,
                    offsetY: 0
                }
            },
            // Feet configuration
            feet: {
                left: {
                    width: partSizes.feet[appearance.bodyParts.feet] || 30,
                    height: partSizes.feet[appearance.bodyParts.feet] || 15,
                    color: appearance.colors.secondary,
                    offsetX: -torsoSize / 4,
                    offsetY: torsoSize / 2 + 5
                },
                right: {
                    width: partSizes.feet[appearance.bodyParts.feet] || 30,
                    height: partSizes.feet[appearance.bodyParts.feet] || 15,
                    color: appearance.colors.secondary,
                    offsetX: torsoSize / 4,
                    offsetY: torsoSize / 2 + 5
                }
            },
            // Markings
            markings: appearance.markings,
            // Colors
            colors: appearance.colors
        };
    }

    /**
     * Gets the body shape type for rendering.
     * @private
     * @param {string} torsoType - Torso type.
     * @returns {string} Shape identifier.
     */
    _getBodyShape(torsoType) {
        const shapes = {
            small: 'oval',
            medium: 'rectangle',
            large: 'rounded-rectangle',
            stocky: 'square'
        };
        return shapes[torsoType] || 'rectangle';
    }

    /**
     * Creates Phaser GameObjects for the pet based on sprite config.
     * @param {Phaser.Scene} scene - The Phaser scene to create objects in.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     * @returns {Object} Container with all pet body part GameObjects.
     */
    createPetSprite(scene, x, y) {
        const config = this.getSpriteConfig();
        const container = scene.add.container(x, y);
        const parts = {};

        // Create torso/body
        parts.body = scene.add.rectangle(
            0, 0,
            config.body.width,
            config.body.height,
            this._hexToNumber(config.body.color)
        );
        this._styleShape(parts.body, config.body.shape);
        container.add(parts.body);

        // Create head
        parts.head = scene.add.rectangle(
            config.head.offsetX,
            config.head.offsetY,
            config.head.width,
            config.head.height,
            this._hexToNumber(config.head.color)
        );
        this._styleShape(parts.head, config.head.shape);
        container.add(parts.head);

        // Create hands
        parts.leftHand = scene.add.rectangle(
            config.hands.left.offsetX,
            config.hands.left.offsetY,
            config.hands.left.width,
            config.hands.left.height,
            this._hexToNumber(config.hands.left.color)
        );
        this._styleShape(parts.leftHand, 'circle');
        container.add(parts.leftHand);

        parts.rightHand = scene.add.rectangle(
            config.hands.right.offsetX,
            config.hands.right.offsetY,
            config.hands.right.width,
            config.hands.right.height,
            this._hexToNumber(config.hands.right.color)
        );
        this._styleShape(parts.rightHand, 'circle');
        container.add(parts.rightHand);

        // Create feet
        parts.leftFoot = scene.add.rectangle(
            config.feet.left.offsetX,
            config.feet.left.offsetY,
            config.feet.left.width,
            config.feet.left.height,
            this._hexToNumber(config.feet.left.color)
        );
        this._styleShape(parts.leftFoot, 'rounded-rectangle');
        container.add(parts.leftFoot);

        parts.rightFoot = scene.add.rectangle(
            config.feet.right.offsetX,
            config.feet.right.offsetY,
            config.feet.right.width,
            config.feet.right.height,
            this._hexToNumber(config.feet.right.color)
        );
        this._styleShape(parts.rightFoot, 'rounded-rectangle');
        container.add(parts.rightFoot);

        // Add markings if present
        if (config.markings.type !== 'none') {
            parts.markings = this._createMarkings(scene, config);
            if (parts.markings) {
                container.add(parts.markings);
            }
        }

        // Add eyes (fixed position relative to head)
        parts.eyes = this._createEyes(scene, config.head);
        container.add(parts.eyes.left);
        container.add(parts.eyes.right);

        // Add mouth
        parts.mouth = scene.add.rectangle(
            config.head.offsetX,
            config.head.offsetY + config.head.height / 4,
            config.head.width * 0.4,
            config.head.height * 0.1,
            this._hexToNumber(config.colors.accent)
        );
        container.add(parts.mouth);

        // Store appearance data on container for reference
        container.setData('appearance', this.getAppearance());

        return { container, parts };
    }

    /**
     * Creates eye GameObjects.
     * @private
     * @param {Phaser.Scene} scene - The Phaser scene.
     * @param {Object} headConfig - Head configuration.
     * @returns {Object} Left and right eye GameObjects.
     */
    _createEyes(scene, headConfig) {
        const eyeSize = headConfig.width * 0.15;
        const eyeOffsetX = headConfig.width * 0.2;
        const eyeOffsetY = headConfig.height * 0.15;

        return {
            left: scene.add.circle(
                headConfig.offsetX - eyeOffsetX,
                headConfig.offsetY - eyeOffsetY,
                eyeSize,
                0x000000
            ),
            right: scene.add.circle(
                headConfig.offsetX + eyeOffsetX,
                headConfig.offsetY - eyeOffsetY,
                eyeSize,
                0x000000
            )
        };
    }

    /**
     * Creates markings overlay based on markings config.
     * @private
     * @param {Phaser.Scene} scene - The Phaser scene.
     * @param {Object} config - Sprite configuration.
     * @returns {Phaser.GameObjects.Graphics} Graphics object with markings.
     */
    _createMarkings(scene, config) {
        const graphics = scene.add.graphics({ x: 0, y: 0 });
        const bodyWidth = config.body.width;
        const bodyHeight = config.body.height;

        switch (config.markings.type) {
            case 'stripes':
                this._drawStripes(graphics, bodyWidth, bodyHeight, config.markings);
                break;
            case 'spots':
                this._drawSpots(graphics, bodyWidth, bodyHeight, config.markings);
                break;
            case 'swirls':
                this._drawSwirls(graphics, bodyWidth, bodyHeight, config.markings);
                break;
            case 'patches':
                this._drawPatches(graphics, bodyWidth, bodyHeight, config.markings);
                break;
            case 'gradient':
                this._drawGradient(graphics, bodyWidth, bodyHeight, config.markings, config.colors);
                break;
            default:
                return null;
        }

        return graphics;
    }

    /**
     * Draws stripe markings.
     * @private
     */
    _drawStripes(graphics, width, height, markings) {
        if (!markings.color) return;
        
        const stripeWidth = 10;
        const stripeSpacing = width / 4;
        const color = this._hexToNumber(markings.color);

        graphics.lineStyle(0);
        graphics.fillStyle(color, markings.density);

        // Draw diagonal stripes across body
        for (let i = -width; i < width * 2; i += stripeSpacing) {
            graphics.beginPath();
            graphics.moveTo(i, -height / 2);
            graphics.lineTo(i + stripeSpacing, height / 2);
            graphics.lineTo(i + stripeSpacing - stripeWidth, height / 2);
            graphics.lineTo(i - stripeWidth, -height / 2);
            graphics.closePath();
            graphics.fillPath();
        }
    }

    /**
     * Draws spot markings.
     * @private
     */
    _drawSpots(graphics, width, height, markings) {
        if (!markings.color) return;
        
        const color = this._hexToNumber(markings.color);
        const spotCount = Math.floor(markings.density * 15) + 5; // 5-20 spots
        const spotSize = width * 0.1 * markings.density;

        graphics.fillStyle(color, 0.8);

        for (let i = 0; i < spotCount; i++) {
            const angle = (i / spotCount) * Math.PI * 2;
            const distance = width * 0.4 * (0.5 + Math.random() * 0.5);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance * 0.7;
            graphics.fillCircle(x, y, spotSize * (0.7 + Math.random() * 0.6));
        }
    }

    /**
     * Draws swirl markings.
     * @private
     */
    _drawSwirls(graphics, width, height, markings) {
        if (!markings.color) return;
        
        const color = this._hexToNumber(markings.color);
        const swirlCount = Math.floor(markings.density * 4) + 2; // 2-6 swirls

        graphics.lineStyle(width * 0.02, color, markings.density);

        for (let i = 0; i < swirlCount; i++) {
            const centerX = (Math.random() - 0.5) * width * 0.6;
            const centerY = (Math.random() - 0.5) * height * 0.4;
            const radius = width * 0.2 * (0.5 + markings.density);
            
            graphics.beginPath();
            for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                const r = radius * (0.7 + Math.sin(angle * 3) * 0.3);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r * 0.7;
                if (angle === 0) {
                    graphics.moveTo(x, y);
                } else {
                    graphics.lineTo(x, y);
                }
            }
            graphics.strokePath();
        }
    }

    /**
     * Draws patch markings.
     * @private
     */
    _drawPatches(graphics, width, height, markings) {
        if (!markings.color) return;
        
        const color = this._hexToNumber(markings.color);
        const patchCount = Math.floor(markings.density * 3) + 1; // 1-4 patches

        graphics.fillStyle(color, markings.density * 0.7);

        for (let i = 0; i < patchCount; i++) {
            const patchWidth = width * 0.3 * (0.5 + markings.density);
            const patchHeight = height * 0.4 * (0.5 + markings.density);
            const x = (Math.random() - 0.5) * width * 0.8;
            const y = (Math.random() - 0.5) * height * 0.6;
            
            // Draw rounded rectangle patch
            graphics.fillRoundedRect(x - patchWidth/2, y - patchHeight/2, patchWidth, patchHeight, patchWidth * 0.3);
        }
    }

    /**
     * Draws gradient markings.
     * @private
     */
    _drawGradient(graphics, width, height, markings, colors) {
        // Create gradient from primary to secondary color
        const gradient = graphics.createLinearGradient(
            -width/2, -height/2, width/2, height/2
        );
        gradient.addColorStop(0, this._hexToNumber(colors.primary));
        gradient.addColorStop(1, this._hexToNumber(markings.color || colors.secondary));

        graphics.fillStyle(gradient, markings.density * 0.5);
        graphics.fillRect(-width/2, -height/2, width, height);
    }

    /**
     * Styles a shape based on its type.
     * @private
     * @param {Phaser.GameObjects.Rectangle} shape - The shape to style.
     * @param {string} shapeType - Type of shape.
     */
    _styleShape(shape, shapeType) {
        switch (shapeType) {
            case 'circle':
            case 'oval':
                // Rectangle with rounded corners
                shape.setRadius(shape.width / 2);
                break;
            case 'rounded-rectangle':
                shape.setRadius(shape.width * 0.2);
                break;
            case 'square':
                // Already a rectangle, no changes needed
                break;
            default:
                // Standard rectangle
                break;
        }
    }

    /**
     * Converts hex color string to Phaser number format.
     * @private
     * @param {string} hex - Hex color string (e.g., '#RRGGBB').
     * @returns {number} Phaser color number.
     */
    _hexToNumber(hex) {
        if (!hex || hex === '#FFFFFF') return 0xFFFFFF;
        if (hex === '#000000') return 0x000000;
        
        // Remove # if present
        const cleanHex = hex.replace('#', '');
        
        // Convert to number
        if (cleanHex.length === 6) {
            return parseInt(cleanHex, 16);
        } else if (cleanHex.length === 3) {
            // Shorthand hex (e.g., #ABC -> #AABBCC)
            const fullHex = cleanHex.split('').map(c => c + c).join('');
            return parseInt(fullHex, 16);
        }
        
        return 0xFFFFFF; // Default to white
    }
}
