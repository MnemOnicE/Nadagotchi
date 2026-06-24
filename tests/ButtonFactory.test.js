import { jest } from '@jest/globals';
import { setupPhaserMock, mockGameObject } from './helpers/mockPhaser.js';

// Setup Phaser mock
setupPhaserMock();

// Mock SoundSynthesizer
jest.mock('../js/utils/SoundSynthesizer.js', () => {
    return {
        SoundSynthesizer: {
            instance: {
                playClick: jest.fn(),
                playFailure: jest.fn()
            }
        }
    };
});

const { ButtonFactory } = require('../js/ButtonFactory.js');
const { SoundSynthesizer } = require('../js/utils/SoundSynthesizer.js');

describe('ButtonFactory', () => {
    let scene;
    let mockContainer;
    let mockShadow;
    let mockHitZone;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create specific mocks for things we need to test interactions with
        mockContainer = {
            ...mockGameObject(),
            add: jest.fn(),
            x: 0,
            y: 0
        };

        mockShadow = {
            ...mockGameObject(),
            setOrigin: jest.fn().mockReturnThis(),
            setVisible: jest.fn()
        };

        mockHitZone = {
            ...mockGameObject(),
            setOrigin: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn((event, callback) => {
                mockHitZone.listeners[event] = callback;
                return mockHitZone;
            })
        };

        scene = {
            add: {
                container: jest.fn().mockReturnValue(mockContainer),
                rectangle: jest.fn().mockReturnValue(mockShadow),
                text: jest.fn().mockReturnValue({
                    ...mockGameObject(),
                    setOrigin: jest.fn().mockReturnThis()
                }),
                zone: jest.fn().mockReturnValue(mockHitZone)
            },
            tweens: {
                add: jest.fn()
            }
        };

        // For hover overlay and other rectangles, mock scene.add.rectangle to return slightly different mocks if needed
        // but returning mockShadow for all rectangles is mostly fine for testing logic if we just check the calls
        const originalRectangle = scene.add.rectangle;
        scene.add.rectangle = jest.fn((x, y, w, h, color, alpha) => {
             const rect = { ...mockGameObject(), setOrigin: jest.fn().mockReturnThis(), visible: true };
             if (color === 0x000000 && alpha === 0.3) {
                 mockShadow = rect; // capture shadow specifically
                 mockShadow.setVisible = jest.fn(v => { mockShadow.visible = v; return mockShadow; });
             }
             return rect;
        });

    });

    test('createButton returns a container with default styling', () => {
        const callback = jest.fn();
        const btn = ButtonFactory.createButton(scene, 100, 200, 'Click Me', callback);

        expect(scene.add.container).toHaveBeenCalledWith(100, 200);
        expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'Click Me', expect.objectContaining({
            fontFamily: 'VT323',
            fontSize: '24px',
            color: '#4A4A4A'
        }));

        // bg
        expect(scene.add.rectangle).toHaveBeenCalledWith(-50, -20, 100, 40, 0xD8A373);

        expect(btn).toBe(mockContainer);
        expect(btn.width).toBe(100);
        expect(btn.height).toBe(40);
        expect(mockHitZone.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
    });

    test('createButton applies custom styling options', () => {
        const options = {
            width: 200,
            height: 60,
            color: 0xFF0000,
            textColor: '#FFFFFF',
            fontSize: '32px'
        };
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Custom', jest.fn(), options);

        expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'Custom', expect.objectContaining({
            fontSize: '32px',
            color: '#FFFFFF'
        }));

        expect(scene.add.rectangle).toHaveBeenCalledWith(-100, -30, 200, 60, 0xFF0000);

        expect(btn.width).toBe(200);
        expect(btn.height).toBe(60);
    });

    test('pointerdown triggers callback and press effect', () => {
        const callback = jest.fn();
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Test', callback);

        expect(mockHitZone.listeners['pointerdown']).toBeDefined();

        // Initial pos
        const initialX = btn.x;
        const initialY = btn.y;

        mockHitZone.emit('pointerdown');

        expect(SoundSynthesizer.instance.playClick).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
        expect(btn.x).toBe(initialX + 2);
        expect(btn.y).toBe(initialY + 2);
        expect(mockShadow.setVisible).toHaveBeenCalledWith(false);
    });

    test('pointerdown plays failure sound when disabled without custom handler', () => {
        const callback = jest.fn();
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Disabled', callback);

        btn.setDisabled(true);
        expect(btn.isDisabled).toBe(true);

        mockHitZone.emit('pointerdown');

        expect(SoundSynthesizer.instance.playFailure).toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    test('pointerdown triggers onDisabledClick when disabled', () => {
        const callback = jest.fn();
        const onDisabledClick = jest.fn();
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Disabled', callback, { onDisabledClick });

        btn.setDisabled(true);

        mockHitZone.emit('pointerdown');

        expect(onDisabledClick).toHaveBeenCalled();
        expect(SoundSynthesizer.instance.playFailure).not.toHaveBeenCalled(); // Handled by custom callback
        expect(callback).not.toHaveBeenCalled();
    });

    test('pointerover triggers hover tween when not disabled', () => {
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Hover', jest.fn());

        mockHitZone.emit('pointerover');

        expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            alpha: 0.2,
            duration: 100
        }));
    });

    test('pointerover does nothing when disabled', () => {
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Hover Disabled', jest.fn());
        btn.setDisabled(true);

        mockHitZone.emit('pointerover');

        expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    test('pointerup and pointerout trigger reset state', () => {
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Reset', jest.fn());

        // First simulate down to hide shadow
        mockHitZone.emit('pointerdown');
        expect(mockShadow.visible).toBe(false);
        const pressedX = btn.x;
        const pressedY = btn.y;

        // Reset via pointerup
        mockHitZone.emit('pointerup');

        expect(btn.x).toBe(pressedX - 2);
        expect(btn.y).toBe(pressedY - 2);
        expect(mockShadow.setVisible).toHaveBeenCalledWith(true);

        expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            alpha: 0,
            duration: 100
        }));

        // Reset scene.tweens mock
        scene.tweens.add.mockClear();
        mockShadow.setVisible.mockClear();

        // pointerout without shadow hidden (should only do tween)
        mockHitZone.emit('pointerout');
        expect(mockShadow.setVisible).not.toHaveBeenCalled();
        expect(scene.tweens.add).toHaveBeenCalled();
    });

    test('setDisabled visually updates alpha', () => {
        const btn = ButtonFactory.createButton(scene, 0, 0, 'Toggle', jest.fn());

        btn.setDisabled(true);
        expect(btn.setAlpha).toHaveBeenCalledWith(0.6);

        btn.setDisabled(false);
        expect(btn.setAlpha).toHaveBeenCalledWith(1.0);
    });
});
