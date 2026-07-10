/**
 * @fileoverview System for managing pet animations.
 * Handles idle, mood-based, and interaction animations for the procedural pet.
 */

import { Config } from '../Config.js';

/**
 * PetAnimationSystem: Manages animations for the pet sprite.
 * @class PetAnimationSystem
 */
export class PetAnimationSystem {
    /**
     * Creates a new PetAnimationSystem.
     * @param {import('./PetAppearanceSystem.js').PetAppearanceSystem} appearanceSystem - The appearance system.
     */
    constructor(appearanceSystem) {
        this.appearanceSystem = appearanceSystem;
        this.petContainer = null;
        this.petParts = null;
        this.scene = null;
        
        // Animation state
        this.currentAnimation = null;
        this.animationTweens = [];
        this.mood = 'idle';
        
        // Animation timers
        this.blinkTimer = null;
        this.idleTimer = null;
        
        // Animation speeds (in ms)
        this.animationSpeeds = {
            blink: 4000,      // Blink every 4 seconds
            idle: 3000,       // Idle animation cycle
            happy: 2000,      // Happy animation
            sad: 4000,        // Sad animation
            angry: 1000,      // Angry animation (faster)
            excited: 500      // Excited animation
        };
        
        // Blink state
        this.eyesOpen = true;
        this.originalEyeSize = null;
    }

    /**
     * Initializes the animation system with pet sprite references.
     * @param {Phaser.Scene} scene - The Phaser scene.
     * @param {Phaser.GameObjects.Container} container - The pet container.
     * @param {Object} parts - The pet parts object.
     */
    init(scene, container, parts) {
        this.scene = scene;
        this.petContainer = container;
        this.petParts = parts;
        
        // Store original eye size for blinking
        if (parts.eyes?.left) {
            this.originalEyeSize = parts.eyes.left.radius || parts.eyes.left.width * 0.5;
        }
        
        // Start idle animation
        this.playIdle();
    }

    /**
     * Cleans up all active animations.
     */
    cleanup() {
        // Stop all tweens
        this.animationTweens.forEach(tween => {
            if (tween && tween.stop) {
                tween.stop();
            }
        });
        this.animationTweens = [];
        
        // Clear timers
        if (this.blinkTimer) {
            this.blinkTimer.destroy();
            this.blinkTimer = null;
        }
        if (this.idleTimer) {
            this.idleTimer.destroy();
            this.idleTimer = null;
        }
        
        // Reset parts to original positions
        this._resetAllParts();
    }

    /**
     * Plays the idle animation.
     */
    playIdle() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'idle';
        
        // Start blinking
        this._startBlinking();
        
        // Gentle floating motion
        this._floatAnimation();
        
        // Tail wag for pets with tails
        if (this.petParts.tail) {
            this._tailWagAnimation();
        }
    }

    /**
     * Plays happy animation.
     */
    playHappy() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'happy';
        this.mood = 'happy';
        
        // Bounce animation
        this._bounceAnimation();
        
        // Happy tail wag
        if (this.petParts.tail) {
            this._happyTailWag();
        }
        
        // Sparkle effect (optional)
        this._sparkleEffect();
        
        // Blink faster when happy
        this._startBlinking(this.animationSpeeds.blink * 0.7);
    }

    /**
     * Plays sad animation.
     */
    playSad() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'sad';
        this.mood = 'sad';
        
        // Droop animation
        this._droopAnimation();
        
        // Slow blinking when sad
        this._startBlinking(this.animationSpeeds.blink * 1.5);
    }

    /**
     * Plays angry animation.
     */
    playAngry() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'angry';
        this.mood = 'angry';
        
        // Shake animation
        this._shakeAnimation();
        
        // Angry eyes (narrow)
        this._angryEyes();
        
        // Fast blinking when angry
        this._startBlinking(this.animationSpeeds.blink * 0.5);
    }

    /**
     * Plays excited animation.
     */
    playExcited() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'excited';
        
        // Fast bounce
        this._bounceAnimation(0.5, 20);
        
        // Fast tail wag
        if (this.petParts.tail) {
            this._happyTailWag(0.4);
        }
        
        // Very fast blinking
        this._startBlinking(this.animationSpeeds.blink * 0.3);
    }

    /**
     * Plays sleep animation.
     */
    playSleep() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'sleep';
        this.mood = 'sleep';
        
        // Close eyes
        this._closeEyes();
        
        // Gentle breathing
        this._breathingAnimation();
        
        // Stop blinking when sleeping
        if (this.blinkTimer) {
            this.blinkTimer.destroy();
            this.blinkTimer = null;
        }
    }

    /**
     * Plays eat animation.
     */
    playEat() {
        this.stopCurrentAnimation();
        this.currentAnimation = 'eat';
        
        // Chew motion
        this._chewAnimation();
        
        // Stop other animations temporarily
        this._stopTemporary();
    }

    /**
     * Updates the current mood and plays corresponding animation.
     * @param {string} mood - The new mood.
     */
    updateMood(mood) {
        this.mood = mood;
        
        switch (mood) {
            case 'happy':
                this.playHappy();
                break;
            case 'sad':
                this.playSad();
                break;
            case 'angry':
                this.playAngry();
                break;
            case 'sleep':
            case 'tired':
                this.playSleep();
                break;
            case 'excited':
                this.playExcited();
                break;
            default:
                this.playIdle();
        }
    }

    /**
     * Stops the current animation.
     */
    stopCurrentAnimation() {
        // Stop all tweens
        this.animationTweens.forEach(tween => {
            if (tween && tween.stop) {
                tween.stop();
            }
        });
        this.animationTweens = [];
        
        // Reset parts
        this._resetAllParts();
    }

    /**
     * Resets all pet parts to their original positions.
     * @private
     */
    _resetAllParts() {
        // This would reset to original sprite config positions
        // For now, just clear tweens
        this._openEyes();
    }

    /**
     * Starts the blinking animation.
     * @private
     * @param {number} interval - Blink interval in ms.
     */
    _startBlinking(interval = null) {
        // Clear existing timer
        if (this.blinkTimer) {
            this.blinkTimer.destroy();
        }
        
        const blinkInterval = interval || this.animationSpeeds.blink;
        
        this.blinkTimer = this.scene.time.addEvent({
            delay: blinkInterval,
            callback: () => this._blink(),
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Performs a blink animation.
     * @private
     */
    _blink() {
        if (!this.petParts.eyes || this.currentAnimation === 'sleep') return;
        
        // Close eyes
        this._closeEyes();
        
        // Reopen after a short delay
        this.scene.time.delayedCall(150, () => {
            this._openEyes();
        }, [], this);
    }

    /**
     * Closes the pet's eyes.
     * @private
     */
    _closeEyes() {
        if (!this.petParts.eyes) return;
        
        if (this.petParts.eyes.left) {
            this.petParts.eyes.left.setScale(1, 0.1);
        }
        if (this.petParts.eyes.right) {
            this.petParts.eyes.right.setScale(1, 0.1);
        }
    }

    /**
     * Opens the pet's eyes.
     * @private
     */
    _openEyes() {
        if (!this.petParts.eyes) return;
        
        if (this.petParts.eyes.left) {
            this.petParts.eyes.left.setScale(1, 1);
        }
        if (this.petParts.eyes.right) {
            this.petParts.eyes.right.setScale(1, 1);
        }
    }

    /**
     * Creates angry eye effect (narrow eyes).
     * @private
     */
    _angryEyes() {
        if (!this.petParts.eyes) return;
        
        if (this.petParts.eyes.left) {
            this.petParts.eyes.left.setScale(1, 0.3);
        }
        if (this.petParts.eyes.right) {
            this.petParts.eyes.right.setScale(1, 0.3);
        }
    }

    /**
     * Creates floating animation.
     * @private
     */
    _floatAnimation() {
        if (!this.petContainer) return;
        
        const originalY = this.petContainer.y;
        
        const tween = this.scene.tweens.add({
            targets: this.petContainer,
            y: originalY - 5,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates bounce animation.
     * @private
     * @param {number} duration - Bounce duration in seconds.
     * @param {number} height - Bounce height in pixels.
     */
    _bounceAnimation(duration = 0.8, height = 15) {
        if (!this.petContainer) return;
        
        const originalY = this.petContainer.y;
        
        const tween = this.scene.tweens.add({
            targets: this.petContainer,
            y: originalY - height,
            duration: duration * 500,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: -1
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates tail wag animation.
     * @private
     */
    _tailWagAnimation() {
        if (!this.petParts.tail) return;
        
        const originalRotation = this.petParts.tail.rotation || 0;
        
        const tween = this.scene.tweens.add({
            targets: this.petParts.tail,
            rotation: originalRotation + 0.2,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates happy tail wag (faster, wider).
     * @private
     * @param {number} speedMultiplier - Speed multiplier (lower = faster).
     */
    _happyTailWag(speedMultiplier = 1) {
        if (!this.petParts.tail) return;
        
        // Clear existing tail animations
        this.animationTweens = this.animationTweens.filter(t => {
            if (t.targets && t.targets.includes(this.petParts.tail)) {
                t.stop();
                return false;
            }
            return true;
        });
        
        const originalRotation = this.petParts.tail.rotation || 0;
        
        const tween = this.scene.tweens.add({
            targets: this.petParts.tail,
            rotation: originalRotation + 0.5,
            duration: 500 * speedMultiplier,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates droop animation (for sad mood).
     * @private
     */
    _droopAnimation() {
        if (!this.petContainer || !this.petParts.head) return;
        
        const originalHeadY = this.petParts.head.y;
        
        const tween = this.scene.tweens.add({
            targets: this.petParts.head,
            y: originalHeadY + 5,
            duration: 1000,
            ease: 'Sine.easeOut'
        });
        
        // Also droop ears if present
        if (this.petParts.leftEar) {
            const originalEarY = this.petParts.leftEar.y;
            const earTween = this.scene.tweens.add({
                targets: this.petParts.leftEar,
                y: originalEarY + 8,
                duration: 1000,
                ease: 'Sine.easeOut'
            });
            this.animationTweens.push(earTween);
        }
        
        if (this.petParts.rightEar) {
            const originalEarY = this.petParts.rightEar.y;
            const earTween = this.scene.tweens.add({
                targets: this.petParts.rightEar,
                y: originalEarY + 8,
                duration: 1000,
                ease: 'Sine.easeOut'
            });
            this.animationTweens.push(earTween);
        }
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates shake animation (for angry mood).
     * @private
     */
    _shakeAnimation() {
        if (!this.petContainer) return;
        
        const originalX = this.petContainer.x;
        
        const tween = this.scene.tweens.add({
            targets: this.petContainer,
            x: originalX + 5,
            duration: 100,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Reset to center
                this.petContainer.x = originalX;
            }
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates breathing animation (for sleep).
     * @private
     */
    _breathingAnimation() {
        if (!this.petContainer) return;
        
        const originalScaleX = this.petContainer.scaleX;
        const originalScaleY = this.petContainer.scaleY;
        
        const tween = this.scene.tweens.add({
            targets: this.petContainer,
            scaleX: originalScaleX * 1.02,
            scaleY: originalScaleY * 1.02,
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates chew animation (for eat).
     * @private
     */
    _chewAnimation() {
        if (!this.petParts.head) return;
        
        const originalY = this.petParts.head.y;
        
        const tween = this.scene.tweens.add({
            targets: this.petParts.head,
            y: originalY + 3,
            duration: 100,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.petParts.head.y = originalY;
                // Return to idle after eating
                this.scene.time.delayedCall(500, () => this.playIdle(), [], this);
            }
        });
        
        this.animationTweens.push(tween);
    }

    /**
     * Creates sparkle effect (for happy/excited).
     * @private
     */
    _sparkleEffect() {
        if (!this.scene || !this.petContainer) return;
        
        // Create sparkle particles occasionally
        if (Math.random() < 0.3) {
            const sparkle = this.scene.add.circle(
                this.petContainer.x + (Math.random() - 0.5) * 50,
                this.petContainer.y - 30 + (Math.random() - 0.5) * 20,
                3,
                0xFFFF00
            );
            
            // Animate sparkle
            this.scene.tweens.add({
                targets: sparkle,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                onComplete: () => sparkle.destroy()
            });
        }
        
        // Repeat sparkles
        this.scene.time.delayedCall(1000, () => this._sparkleEffect(), [], this);
    }

    /**
     * Stops animations temporarily (for actions like eating).
     * @private
     */
    _stopTemporary() {
        // Store current animation to resume later
        this._tempAnimation = this.currentAnimation;
    }

    /**
     * Resumes the previous animation.
     */
    resumePrevious() {
        if (this._tempAnimation) {
            this.updateMood(this._tempAnimation === 'happy' ? 'happy' : 'idle');
            this._tempAnimation = null;
        }
    }
}
