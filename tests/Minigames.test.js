
// 1. Setup Global Phaser Mock
global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.config = config;
        }
    },
    Utils: {
        Array: {
            GetRandom: (arr) => arr && arr.length > 0 ? arr[0] : null,
            Shuffle: (arr) => arr // Identity for deterministic testing
        }
    },
    GameObjects: {
        Rectangle: class {}
    }
};

// 2. Import Scenes
const { ArtisanMinigameScene } = require('../js/ArtisanMinigameScene');
const { HealerMinigameScene } = require('../js/HealerMinigameScene');
const { ScoutMinigameScene } = require('../js/ScoutMinigameScene');

// 3. Helper to create a mock rectangle with data capability
const createMockRectangle = () => {
    const data = {};
    const handlers = {};
    return {
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn((event, fn) => {
            handlers[event] = fn;
        }),
        setData: jest.fn((key, value) => {
            if (typeof key === 'object') {
                Object.assign(data, key);
            } else {
                data[key] = value;
            }
        }),
        getData: jest.fn((key) => data[key]),
        setFillStyle: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        // Helper to trigger event manually in tests
        emit: (event, ...args) => {
            if (handlers[event]) handlers[event](...args);
        }
    };
};

const createMockText = () => ({
    setOrigin: jest.fn().mockReturnThis(),
    setText: jest.fn(),
    fill: '',
    fontSize: ''
});

// 4. Common Mock Scene Context
const getMockContext = () => ({
    sys: { events: { once: jest.fn(), on: jest.fn(), off: jest.fn() } },
    time: {
        delayedCall: jest.fn((delay, callback) => callback()), // Immediate execution for tests
        addEvent: jest.fn(() => ({ destroy: jest.fn() }))
    },
    add: {
        text: jest.fn(() => createMockText()),
        rectangle: jest.fn(() => createMockRectangle())
    },
    cameras: {
        main: {
            width: 800,
            height: 600,
            setBackgroundColor: jest.fn()
        }
    },
    scene: {
        stop: jest.fn(),
        resume: jest.fn(),
        get: jest.fn()
    },
    game: {
        events: {
            emit: jest.fn()
        }
    }
});

describe('Minigames Test Suite', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = getMockContext();
        jest.clearAllMocks();
    });

    describe('ArtisanMinigameScene', () => {
        let scene;

        beforeEach(() => {
            scene = new ArtisanMinigameScene();
            Object.assign(scene, mockContext);
        });

        test('create() initializes grid and displays pattern', () => {
            scene.create();
            expect(mockContext.add.rectangle).toHaveBeenCalledTimes(9);
            expect(scene.gridButtons.length).toBe(9);
            expect(scene.pattern.length).toBe(9);
            expect(mockContext.time.delayedCall).toHaveBeenCalled();
            expect(scene.isDisplayingPattern).toBe(false);
        });

        test('handleGridClick ignores input when displaying pattern', () => {
            scene.create();
            // Clear mocks to ignore calls made during create()
            scene.gridButtons.forEach(b => b.setFillStyle.mockClear());

            scene.isDisplayingPattern = true; // Force true
            const button = scene.gridButtons[0];

            scene.handleGridClick(button);

            // Should not toggle
            expect(scene.playerPattern[0]).toBe(false);
            expect(button.setFillStyle).not.toHaveBeenCalled();
        });

        test('handleGridClick correctly updates player pattern', () => {
            scene.create();
            scene.pattern = [true, false, false, false, false, false, false, false, false];
            scene.playerPattern = Array(9).fill(false);

            const button0 = scene.gridButtons[0];
            const button1 = scene.gridButtons[1];

            scene.handleGridClick(button0);
            expect(scene.playerPattern[0]).toBe(true);
            expect(button0.setFillStyle).toHaveBeenCalledWith(0x4169E1);

            scene.handleGridClick(button1);
            expect(scene.playerPattern[1]).toBe(true);

            scene.handleGridClick(button1);
            expect(scene.playerPattern[1]).toBe(false);
        });

        test('Success condition triggers workResult event', () => {
            scene.create();
            scene.pattern = [true, false, false, false, false, false, false, false, false];
            scene.playerPattern = [false, false, false, false, false, false, false, false, false];

            scene.handleGridClick(scene.gridButtons[0]);

            expect(mockContext.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Artisan',
                craftedItem: 'Fancy Bookshelf'
            });
            expect(mockContext.scene.resume).toHaveBeenCalledWith('MainScene');
        });

        test('Failure condition', () => {
             scene.create();
             scene.pattern = [true, false, false, false, false, false, false, false, false];
             scene.playerPattern = [false, false, false, false, false, false, false, false, false];

             scene.handleGridClick(scene.gridButtons[1]); // Wrong button

             expect(mockContext.game.events.emit).toHaveBeenCalledWith('workResult', {
                 success: false,
                 career: 'Artisan'
             });
        });
    });

    describe('HealerMinigameScene', () => {
        let scene;

        beforeEach(() => {
            scene = new HealerMinigameScene();
            Object.assign(scene, mockContext);
        });

        test('create() selects ailment and creates remedy buttons', () => {
            scene.create();
            expect(scene.currentAilment).toEqual(scene.ailments[0]);
            expect(mockContext.add.rectangle).toHaveBeenCalledTimes(3);
        });

        test('Selecting correct remedy sends success event', () => {
            scene.create();
            const correctRemedy = scene.currentAilment.remedy;
            scene.handleRemedyClick(correctRemedy);

            expect(mockContext.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Healer'
            });
        });

        test('Selecting incorrect remedy sends failure event', () => {
            scene.create();
            const wrongRemedy = { name: 'Wrong', emoji: 'X' };
            scene.handleRemedyClick(wrongRemedy);

            expect(mockContext.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: false,
                career: 'Healer'
            });
        });
    });

    describe('ScoutMinigameScene', () => {
        let scene;

        beforeEach(() => {
            scene = new ScoutMinigameScene();
            Object.assign(scene, mockContext);
        });

        test('create() sets up grid and timer', () => {
            scene.create();
            expect(mockContext.add.rectangle).toHaveBeenCalledTimes(12);
            expect(mockContext.time.addEvent).toHaveBeenCalled();
            expect(scene.grid.length).toBe(12);
        });

        test('handleCardClick ignores already revealed cards', () => {
            scene.create();
            const card = createMockRectangle();
            card.getData.mockImplementation((k) => k === 'revealed' ? true : null);

            scene.handleCardClick(card);

            expect(card.setFillStyle).not.toHaveBeenCalled();
            expect(scene.firstSelection).toBeNull();
        });

        test('handleCardClick ignores clicks when two cards selected', () => {
            scene.create();
            scene.firstSelection = {};
            scene.secondSelection = {};

            const card = createMockRectangle();
            card.getData.mockReturnValue(false); // not revealed

            scene.handleCardClick(card);

            expect(card.setFillStyle).not.toHaveBeenCalled();
        });

        test('handleCardClick reveals card', () => {
            scene.create();
            const mockCard = createMockRectangle();
            const mockText = createMockText();
            mockCard.getData.mockImplementation((key) => {
                if (key === 'iconText') return mockText;
                if (key === 'icon') return 'A';
                if (key === 'revealed') return false;
            });

            scene.handleCardClick(mockCard);

            expect(mockText.setText).toHaveBeenCalledWith('A');
            expect(mockCard.setData).toHaveBeenCalledWith('revealed', true);
            expect(scene.firstSelection).toBe(mockCard);
        });

        test('Matching pair logic', () => {
            scene.create();
            const card1 = createMockRectangle();
            const text1 = createMockText();
            card1.getData.mockImplementation((k) => {
                if (k === 'iconText') return text1;
                if (k === 'icon') return 'A';
                return false;
            });

            const card2 = createMockRectangle();
            const text2 = createMockText();
            card2.getData.mockImplementation((k) => {
                if (k === 'iconText') return text2;
                if (k === 'icon') return 'A'; // MATCH
                return false;
            });

            scene.handleCardClick(card1);
            scene.handleCardClick(card2);

            expect(scene.matchesFound).toBe(1);
            expect(scene.firstSelection).toBeNull();
            expect(scene.secondSelection).toBeNull();
        });

        test('Mismatch pair logic', () => {
            scene.create();
            const card1 = createMockRectangle();
            const text1 = createMockText();
            card1.getData.mockImplementation((k) => {
                if (k === 'iconText') return text1;
                if (k === 'icon') return 'A';
                if (k === 'revealed') return card1._revealed;
            });
            card1.setData.mockImplementation((k, v) => { if(k==='revealed') card1._revealed = v; });

            const card2 = createMockRectangle();
            const text2 = createMockText();
            card2.getData.mockImplementation((k) => {
                if (k === 'iconText') return text2;
                if (k === 'icon') return 'B'; // MISMATCH
                if (k === 'revealed') return card2._revealed;
            });
            card2.setData.mockImplementation((k, v) => { if(k==='revealed') card2._revealed = v; });

            scene.handleCardClick(card1);
            scene.handleCardClick(card2);

            expect(mockContext.time.delayedCall).toHaveBeenCalled();
            expect(text1.setText).toHaveBeenCalledWith('');
            expect(card1.setData).toHaveBeenCalledWith('revealed', false);
            expect(scene.firstSelection).toBeNull();
        });

        test('Win condition', () => {
            scene.create();
            scene.matchesFound = 5;

            const card1 = createMockRectangle();
            card1.getData = (k) => k==='icon' ? 'A' : (k==='iconText' ? createMockText() : false);
            const card2 = createMockRectangle();
            card2.getData = (k) => k==='icon' ? 'A' : (k==='iconText' ? createMockText() : false);

            scene.handleCardClick(card1);
            scene.handleCardClick(card2);

            expect(mockContext.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: true,
                career: 'Scout'
            });
        });

        test('Timer expiration', () => {
            scene.create();
            scene.timeLeft = 1;
            scene.updateTimer(); // 1 -> 0

            expect(scene.timeLeft).toBe(0);
            expect(mockContext.game.events.emit).toHaveBeenCalledWith('workResult', {
                success: false,
                career: 'Scout'
            });
        });
    });
});
