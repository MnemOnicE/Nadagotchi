import { ToastManager } from '../js/systems/ToastManager.js';

describe('ToastManager', () => {
    let mockScene;
    let toastManager;
    let mockContainer;

    beforeEach(() => {
        // Mock Container
        mockContainer = {
            add: jest.fn(),
            destroy: jest.fn(),
            setOrigin: jest.fn().mockReturnThis(),
            setStrokeStyle: jest.fn().mockReturnThis()
        };

        // Mock Scene
        mockScene = {
            cameras: {
                main: { width: 800, height: 600 }
            },
            add: {
                container: jest.fn().mockReturnValue(mockContainer),
                rectangle: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis(),
                    setStrokeStyle: jest.fn().mockReturnThis()
                }),
                text: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis()
                })
            },
            tweens: {
                add: jest.fn()
            }
        };

        toastManager = new ToastManager(mockScene);
    });

    test('show() with default style (GOLD) should create correct elements', () => {
        toastManager.show({ title: 'Test', message: 'Message', icon: 'X' });

        // Should create container
        expect(mockScene.add.container).toHaveBeenCalled();

        // Should create background (Gold)
        expect(mockScene.add.rectangle).toHaveBeenCalledWith(
            expect.any(Number), expect.any(Number),
            300, 80, 0xFFD700
        );

        // Should create text elements (Icon, Title, Message)
        expect(mockScene.add.text).toHaveBeenCalledTimes(3);

        // Should start tween
        expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            targets: mockContainer,
            y: 20,
            duration: 500,
            hold: 3000,
            yoyo: true
        }));
    });

    test('show() with DARK style should create correct elements', () => {
        toastManager.show({ title: 'Test', message: 'Message', style: 'DARK' });

        // Should create container at bottom
        expect(mockScene.add.container).toHaveBeenCalledWith(
            expect.any(Number),
            500 // 600 - 100
        );

        // Should create background (Dark)
        expect(mockScene.add.rectangle).toHaveBeenCalledWith(
            expect.any(Number), expect.any(Number),
            300, 60, 0x333333
        );

        // Should create single text element
        expect(mockScene.add.text).toHaveBeenCalledTimes(1);
        expect(mockScene.add.text).toHaveBeenCalledWith(
            expect.any(Number), expect.any(Number),
            'Test: Message',
            expect.any(Object)
        );

        // Should start tween (Fade out)
        expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            targets: mockContainer,
            alpha: 0,
            duration: 500,
            delay: 2000
        }));
    });

    test('show() respects custom duration', () => {
        toastManager.show({ title: 'T', message: 'M', duration: 5000 });

        expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            hold: 5000
        }));
    });
});
