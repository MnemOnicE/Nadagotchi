import { jest } from '@jest/globals';
import { WikiUI } from '../js/WikiUI.js';
import { setupPhaserMock } from './helpers/mockPhaser.js';

describe('WikiUI', () => {
    let scene;
    let mainScene;
    let wikiUI;

    beforeEach(() => {
        setupPhaserMock();
        mainScene = {
            wikiSystem: {
                categories: ["pets", "items"],
                getEntries: jest.fn().mockReturnValue([])
            }
        };

        scene = new Phaser.Scene();
        scene.children = { bringToTop: jest.fn() };
        scene.scene.get.mockReturnValue(mainScene);
        scene.cameras.main.width = 800;
        scene.cameras.main.height = 600;
        scene.input.on = jest.fn();

        wikiUI = new WikiUI(scene);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(wikiUI.scene).toBe(scene);
            expect(wikiUI.container).toBeNull();
            expect(wikiUI.wikiSystem).toBeNull();
            expect(wikiUI.isVisible).toBe(false);
            expect(wikiUI.background).toBeNull();
            expect(wikiUI.titleText).toBeNull();
            expect(wikiUI.closeBtn).toBeNull();
            expect(wikiUI.categoryContainer).toBeNull();
            expect(wikiUI.entryContainer).toBeNull();
            expect(wikiUI.contentContainer).toBeNull();
            expect(wikiUI.currentCategory).toBeNull();
            expect(wikiUI.scrollOffset).toBe(0);
        });
    });

    describe('create', () => {
        it('should return early if MainScene or wikiSystem is missing', () => {
            scene.scene.get.mockReturnValue(null);
            wikiUI.create();
            expect(wikiUI.container).toBeNull();

            scene.scene.get.mockReturnValue({ wikiSystem: null });
            wikiUI.create();
            expect(wikiUI.container).toBeNull();
        });

        it('should setup UI components and input handlers', () => {
            wikiUI.create();
            expect(wikiUI.wikiSystem).toBe(mainScene.wikiSystem);
            expect(wikiUI.container).toBeDefined();
            expect(scene.add.container).toHaveBeenCalledWith(0, 0);
            expect(wikiUI.container.setDepth).toHaveBeenCalledWith(2000);
            expect(wikiUI.container.setVisible).toHaveBeenCalledWith(false);

            expect(scene.add.rectangle).toHaveBeenCalled(); // overlay + bg
            expect(scene.add.text).toHaveBeenCalled(); // title + closeBtn
            expect(wikiUI.background.setInteractive).toHaveBeenCalled();

            expect(scene.input.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        });
    });

    describe('show', () => {
        it('should create container if it does not exist', () => {
            const createSpy = jest.spyOn(wikiUI, 'create');
            wikiUI.show();
            expect(createSpy).toHaveBeenCalled();
        });

        it('should return if wikiSystem is not set', () => {
            mainScene.wikiSystem = null; // simulate missing system
            wikiUI.show();
            expect(wikiUI.isVisible).toBe(false);
        });

        it('should set visibility, bring to top, and call render methods', () => {
            wikiUI.create();
            const renderCatsSpy = jest.spyOn(wikiUI, 'renderCategories');
            const renderEntriesSpy = jest.spyOn(wikiUI, 'renderEntries');

            wikiUI.show();

            expect(wikiUI.isVisible).toBe(true);
            expect(wikiUI.container.setVisible).toHaveBeenCalledWith(true);
            expect(scene.children.bringToTop).toHaveBeenCalledWith(wikiUI.container);
            expect(wikiUI.currentCategory).toBe("pets");
            expect(renderCatsSpy).toHaveBeenCalled();
            expect(renderEntriesSpy).toHaveBeenCalled();
        });
    });

    describe('hide', () => {
        it('should set isVisible to false, hide container, and resume MainScene', () => {
            wikiUI.create();
            wikiUI.show();
            expect(wikiUI.isVisible).toBe(true);

            wikiUI.hide();

            expect(wikiUI.isVisible).toBe(false);
            expect(wikiUI.container.setVisible).toHaveBeenCalledWith(false);
            expect(scene.scene.resume).toHaveBeenCalledWith("MainScene");
        });
    });

    describe('renderCategories', () => {
        it('should remove all items and recreate category buttons', () => {
            wikiUI.create();
            wikiUI.show();

            expect(wikiUI.categoryContainer.removeAll).toHaveBeenCalledWith(true);
            // 2 categories + 1 for overlay + 1 for background + ... ? Actually, it adds rectangles and text
            // "pets" and "items" -> 2 buttons, each has bg and text = 4 total calls specifically from this method context
            expect(scene.add.rectangle).toHaveBeenCalled();
            expect(scene.add.text).toHaveBeenCalled();
        });

        it('should change currentCategory and re-render on pointerdown', () => {
            wikiUI.create();
            wikiUI.show();
            const renderCatsSpy = jest.spyOn(wikiUI, 'renderCategories');
            const renderEntriesSpy = jest.spyOn(wikiUI, 'renderEntries');

            // Find all rectangles that have a 'pointerdown' listener registered
            const catRects = scene.add.rectangle.mock.results
                .map(res => res.value)
                .filter(rect => rect && rect.listeners && rect.listeners['pointerdown']);

            // The second category button is "items"
            const catRect2 = catRects[1];
            catRect2.emit('pointerdown');

            expect(wikiUI.currentCategory).toBe("items");
            expect(wikiUI.scrollOffset).toBe(0);
            expect(renderCatsSpy).toHaveBeenCalled();
            expect(renderEntriesSpy).toHaveBeenCalled();
        });
    });

    describe('renderEntries', () => {
        beforeEach(() => {
            wikiUI.create();
            wikiUI.show();
        });

        it('should display "No entries discovered yet..." if entries array is empty', () => {
            mainScene.wikiSystem.getEntries.mockReturnValue([]);
            wikiUI.renderEntries();

            expect(wikiUI.entryContainer.removeAll).toHaveBeenCalledWith(true);
            expect(scene.add.text).toHaveBeenCalledWith(10, 20, "No entries discovered yet...", expect.any(Object));
        });

        it('should render entries and respect bounds logic', () => {
            mainScene.wikiSystem.getEntries.mockReturnValue(["Entry1", "Entry2"]);

            // Set modalHeight implicitly via background
            wikiUI.background.height = 800;
            wikiUI.scrollOffset = -10; // Try scrolling

            wikiUI.renderEntries();

            // For 2 entries, height is 80 <= 650 (modalHeight - 150), scrollOffset should be clamped to 0
            expect(wikiUI.scrollOffset).toBe(0);
            expect(scene.add.text).toHaveBeenCalledWith(10, 17, "📖 Entry1", expect.any(Object));
            expect(scene.add.text).toHaveBeenCalledWith(10, 57, "📖 Entry2", expect.any(Object));
        });

        it('should clamp scrollOffset when scrolling too far down or up', () => {
            // Need enough entries to exceed modal height - 150
            const manyEntries = new Array(30).fill("Entry"); // 30 * 40 = 1200 > 650
            mainScene.wikiSystem.getEntries.mockReturnValue(manyEntries);

            wikiUI.background.height = 800; // maxScroll = -(1200 - 650) = -550

            // Try scrolling too far up (positive)
            wikiUI.scrollOffset = 100;
            wikiUI.renderEntries();
            expect(wikiUI.scrollOffset).toBe(0);

            // Try scrolling too far down (negative)
            wikiUI.scrollOffset = -1000;
            wikiUI.renderEntries();
            expect(wikiUI.scrollOffset).toBe(-550); // Clamped to maxScroll
        });
    });

    describe('resize', () => {
        it('should do nothing if not visible', () => {
            const createSpy = jest.spyOn(wikiUI, 'create');
            wikiUI.resize(1);
            expect(createSpy).not.toHaveBeenCalled();
        });

        it('should destroy, create, and show if visible', () => {
            wikiUI.create();
            wikiUI.show();

            const destroySpy = jest.spyOn(wikiUI.container, 'destroy');
            const createSpy = jest.spyOn(wikiUI, 'create');
            const showSpy = jest.spyOn(wikiUI, 'show');

            wikiUI.resize(1);

            expect(destroySpy).toHaveBeenCalled();
            expect(createSpy).toHaveBeenCalled();
            expect(showSpy).toHaveBeenCalled();
        });
    });


    describe('Input handling', () => {
        beforeEach(() => {
            // Need enough entries so scrolling isn't clamped to 0
            mainScene.wikiSystem.getEntries.mockReturnValue(new Array(30).fill("Entry"));
        });

        it('should adjust scrollOffset on wheel event', () => {
            wikiUI.create();
            wikiUI.show();
            const renderEntriesSpy = jest.spyOn(wikiUI, 'renderEntries');

            // Set height to allow scrolling
            wikiUI.background.height = 800;

            // Trigger listener directly
            wikiUI.background.listeners['wheel'](null, 0, 50, 0, null);

            expect(wikiUI.scrollOffset).toBe(-50);
            expect(renderEntriesSpy).toHaveBeenCalled();
        });

        it('should adjust scrollOffset on pointermove when dragging', () => {
            wikiUI.create();
            wikiUI.show();
            const renderEntriesSpy = jest.spyOn(wikiUI, 'renderEntries');

            wikiUI.background.height = 800;

            const pointermoveHandler = scene.input.on.mock.calls.find(c => c[0] === 'pointermove')[1];

            // Not visible (should be ignored, but it is visible here)
            // Not down
            pointermoveHandler({ isDown: false, y: 100, prevPosition: { y: 150 } });
            expect(wikiUI.scrollOffset).toBe(0); // unchanged

            // Down and dragging
            pointermoveHandler({ isDown: true, y: 100, prevPosition: { y: 150 } });
            expect(wikiUI.scrollOffset).toBe(-50);
            expect(renderEntriesSpy).toHaveBeenCalled();
        });
    });
});
