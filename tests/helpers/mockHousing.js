import { jest } from '@jest/globals';

// Shared mocks for Housing and Furniture Placement tests
// These reduce duplication between HousingSystem.test.js and FurniturePlacement.test.js

export const mockSprite = {
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setTint: jest.fn(),
    clearTint: jest.fn(),
    x: 100,
    y: 100,
    destroy: jest.fn(),
    setPosition: jest.fn(),
    setScale: jest.fn().mockReturnThis(),
    setAngle: jest.fn(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setBlendMode: jest.fn().mockReturnThis()
};

export const mockGraphics = {
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    setPosition: jest.fn(),
    clear: jest.fn(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn(),
    setVisible: jest.fn().mockReturnThis()
};

export const mockInput = {
    on: jest.fn(),
    off: jest.fn(),
    setDraggable: jest.fn(),
    setDefaultCursor: jest.fn()
};

export const mockCameras = {
    main: {
        width: 800,
        height: 600,
        setSize: jest.fn(),
        setViewport: jest.fn()
    }
};

export const mockTextures = {
    createCanvas: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({
            createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
            createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
            fillStyle: 'black',
            fillRect: jest.fn()
        }),
        update: jest.fn(),
        setSize: jest.fn(),
        clear: jest.fn(),
        refresh: jest.fn(),
        width: 800,
        height: 600,
        context: {
             createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
             createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
             fillStyle: 'black',
             fillRect: jest.fn()
        }
    })
};

// Returns a fresh copy of the mockAdd object to avoid state pollution between tests
export const createHousingMockAdd = () => ({
    sprite: jest.fn().mockReturnValue(mockSprite),
    graphics: jest.fn().mockReturnValue({
        ...mockGraphics,
        setDepth: jest.fn().mockReturnThis()
    }),
    text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis()
    }),
    image: jest.fn().mockReturnValue(mockSprite),
    rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        fillColor: 0x000000,
        setPosition: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    }),
    tileSprite: jest.fn().mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        x: 0,
        y: 0,
        width: 100,
        height: 100
    }),
    group: jest.fn().mockReturnValue({ get: jest.fn(), create: jest.fn(), add: jest.fn(), clear: jest.fn() }),
    particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
            start: jest.fn(),
            stop: jest.fn(),
            setPosition: jest.fn(),
            setDepth: jest.fn().mockReturnThis(),
            setEmitZone: jest.fn().mockReturnThis(),
            setBounds: jest.fn().mockReturnThis(),
            setQuantity: jest.fn().mockReturnThis(),
            setFrequency: jest.fn().mockReturnThis()
        }),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    })
});
