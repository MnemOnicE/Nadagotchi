
import { jest } from '@jest/globals';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();
global.localStorage = localStorageMock;

// Mock Phaser
global.Phaser = {
    Scene: class {
        constructor(config) { this.key = config.key; }
        add = {
            text: () => {
                const obj = {
                    setOrigin: function() { return this; },
                    setInteractive: function() { return this; },
                    on: function() { return this; },
                    setBackgroundColor: function() { return this; },
                    setVisible: function() { return this; },
                    setText: function() { return this; },
                    disableInteractive: function() { return this; }
                };
                return obj;
            },
            image: () => {
                const obj = {
                    setOrigin: function() { return this; },
                    setBlendMode: function() { return this; },
                    setVisible: function() { return this; }
                };
                return obj;
            },
            sprite: () => {
                const obj = {
                    setScale: function() { return this; },
                    setInteractive: function() { return this; },
                    on: function() { return this; },
                    setPosition: function() { return this; },
                    setVisible: function() { return this; },
                    setFrame: function() { return this; }
                };
                return obj;
            },
            container: () => {
                const obj = {
                    add: function() { return this; },
                    setSize: function() { return this; },
                    setInteractive: function() { return this; },
                    on: function() { return this; },
                    setAlpha: function() { return this; },
                    destroy: function() {}
                };
                return obj;
            },
            graphics: () => {
                const obj = {
                    fillStyle: function() { return this; },
                    fillRect: function() { return this; },
                    fillRoundedRect: function() { return this; },
                    lineStyle: function() { return this; },
                    strokeRoundedRect: function() { return this; },
                    fillEllipse: function() { return this; },
                    generateTexture: function() {},
                    destroy: function() {},
                    clear: function() {}
                };
                return obj;
            },
            rectangle: () => {
                const obj = {
                    setInteractive: function() { return this; },
                    on: function() { return this; },
                    setData: function() { return this; },
                    getData: function() {},
                    setFillStyle: function() { return this; },
                    setStrokeStyle: function() { return this; }
                };
                return obj;
            },
            particles: () => ({ createEmitter: () => {} })
        };
        make = { graphics: () => ({ fillStyle: () => ({ fillRect: () => {}, generateTexture: () => {}, destroy: () => {} }) }) };
        cameras = { main: { setBackgroundColor: () => {}, width: 800, height: 600, setSize: () => {}, setViewport: () => {} } };
        time = { delayedCall: (d, cb) => cb(), addEvent: () => {} };
        game = { events: { emit: jest.fn(), on: jest.fn() } };
        scene = { stop: jest.fn(), resume: jest.fn(), launch: jest.fn(), pause: jest.fn(), get: jest.fn() };
        tweens = { add: () => {} };
        scale = { on: () => {}, width: 800, height: 600 };
        textures = { get: () => ({ getFrameNames: () => [] }), createCanvas: () => ({ context: { createLinearGradient: () => ({ addColorStop: () => {} }), fillRect: () => {}, createRadialGradient: () => ({ addColorStop: () => {} }) }, refresh: () => {}, setSize: () => {}, clear: () => {}, width: 800, height: 600 }) };
        input = { on: () => {}, off: () => {} };
    },
    Utils: {
        Array: {
            GetRandom: (arr) => arr[0],
            Shuffle: (arr) => arr
        }
    },
    Math: {
        Between: () => 1
    },
    Display: {
        Color: {
            Interpolate: { ColorWithColor: () => ({r:0, g:0, b:0}) }
        }
    }
};

// Mock SoundSynthesizer Singleton
jest.mock('../js/utils/SoundSynthesizer.js', () => ({
    SoundSynthesizer: {
        instance: {
            playSuccess: jest.fn(),
            playFailure: jest.fn(),
            playClick: jest.fn(),
            playChime: jest.fn()
        }
    }
}));

let Nadagotchi, PersistenceManager, MainScene, ArtisanMinigameScene, Config;

beforeAll(async () => {
    Nadagotchi = (await import('../js/Nadagotchi.js')).Nadagotchi;
    PersistenceManager = (await import('../js/PersistenceManager.js')).PersistenceManager;
    MainScene = (await import('../js/MainScene.js')).MainScene;
    ArtisanMinigameScene = (await import('../js/ArtisanMinigameScene.js')).ArtisanMinigameScene;
    Config = (await import('../js/Config.js')).Config;
});

describe('Security Hardening', () => {
    let nadagotchi;
    let persistence;

    beforeEach(() => {
        localStorage.clear();
        nadagotchi = new Nadagotchi('Adventurer');
        persistence = new PersistenceManager();
        jest.clearAllMocks();
    });

    test('Zombie Pet: Action blocked if insufficient energy', () => {
        // Set energy to 0
        nadagotchi.stats.energy = 0;
        const initialHappiness = nadagotchi.stats.happiness;

        // Attempt to play (Cost: 10)
        nadagotchi.handleAction('PLAY');

        // Expect no change in happiness (action blocked)
        expect(nadagotchi.stats.happiness).toBe(initialHappiness);
    });

    test('Recipe Duplication: Discovering known recipe returns false', () => {
        nadagotchi.discoveredRecipes = ['NewRecipe'];
        const result = nadagotchi.discoverRecipe('NewRecipe');
        expect(result).toBe(false);
    });

    test('Persistence Salt: Save includes UUID and verifies correctly', async () => {
        nadagotchi.stats.hunger = 50;
        persistence.savePet(nadagotchi);

        await new Promise(r => setTimeout(r, 300));

        const loaded = persistence.loadPet();
        expect(loaded).not.toBeNull();
        expect(loaded.uuid).toBe(nadagotchi.uuid);
        expect(loaded.stats.hunger).toBe(50);
    });

    test('Persistence Salt: Tampering fails verification', async () => {
        persistence.savePet(nadagotchi);

        await new Promise(r => setTimeout(r, 300));

        // Get the raw save string
        const raw = localStorage.getItem('nadagotchi_save');
        const [encoded, hash] = raw.split('|');

        // Decode, modify hunger, re-encode
        const data = JSON.parse(atob(encoded));
        data.stats.hunger = 99; // Cheat
        const newEncoded = btoa(JSON.stringify(data));

        // Attacker tries to use the old hash (invalid because content changed)
        localStorage.setItem('nadagotchi_save', `${newEncoded}|${hash}`);
        expect(persistence.loadPet()).toBeNull();

        // Attacker tries to generate new hash WITHOUT salt (because they don't know uuid is part of salt logic, or assume standard hash)
        // Simulate attacker hash: hash(newEncoded)
        const attackerHash = persistence._hash(newEncoded);
        localStorage.setItem('nadagotchi_save', `${newEncoded}|${attackerHash}`);

        // Should fail because _load uses hash(newEncoded + uuid)
        expect(persistence.loadPet()).toBeNull();
    });

    test('Minigame Privacy: State is hidden', () => {
        const scene = new ArtisanMinigameScene();
        scene.add = new global.Phaser.Scene({key:'test'}).add; // Ensure mock exists
        scene.create();

        // Check if pattern is exposed
        expect(scene.pattern).toBeUndefined();
        expect(scene.playerPattern).toBeUndefined();
    });

    test('Event Injection: Blocked if minigame not active', () => {
        const mainScene = new MainScene();
        mainScene.nadagotchi = nadagotchi; // Inject pet
        mainScene.activeMinigameCareer = null; // Ensure no game active

        const initialHappiness = nadagotchi.stats.happiness;

        // Emit fake work result
        mainScene.handleWorkResult({ success: true, career: 'Innovator' });

        // Expect no skill/happiness gain
        expect(nadagotchi.stats.happiness).toBe(initialHappiness);
        expect(nadagotchi.skills.logic).toBe(0); // Default
    });

    test('Event Injection: Allowed if valid', () => {
        const mainScene = new MainScene();
        mainScene.nadagotchi = nadagotchi;
        mainScene.activeMinigameCareer = 'Innovator'; // Set valid flag

        const initialLogic = nadagotchi.skills.logic;

        mainScene.handleWorkResult({ success: true, career: 'Innovator' });

        expect(nadagotchi.skills.logic).toBeGreaterThan(initialLogic);
        expect(mainScene.activeMinigameCareer).toBeNull(); // Should reset
    });
});
