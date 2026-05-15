
const { Nadagotchi } = require('../js/Nadagotchi.js');
const { InventorySystem } = require('../js/systems/InventorySystem.js');
const { RoomDefinitions } = require('../js/RoomDefinitions.js');
const { Config } = require('../js/Config.js');

// Mock dependencies
jest.mock('../js/Config.js', () => ({
    Config: {
        MAX_INVENTORY_SIZE: 20,
        STARTING_STATS: { ENERGY: 100, HUNGER: 0, HAPPINESS: 100 },
        DECAY_RATES: { ENERGY: 0, HUNGER: 0, HAPPINESS: 0 },
        INITIAL_STATE: {
            STATS: { ENERGY: 100, HUNGER: 0, HAPPINESS: 100 },
            PERSONALITY_POINTS_STARTER: 10,
            SKILLS: { logic: 0, research: 0, empathy: 0, crafting: 0, navigation: 0, focus: 0, communication: 0 },
            GENOME_STARTER_VAL: 30,
            MOOD_SENSITIVITY_DEFAULT: 5
        },
        LIMITS: { MAX_STATS: 100 },
        MAX_STATS: { ENERGY: 100, HUNGER: 100, HAPPINESS: 100 },
        SECURITY: { DNA_SALT: 'test_salt' },
        GENETICS: { METABOLISM_NORMALIZER: 5, HOMOZYGOUS_ENERGY_BONUS: 10 }
    }
}));

describe('Housing Expansion System', () => {
    let pet;

    beforeEach(() => {
        // Initialize pet
        pet = new Nadagotchi();
        // Ensure homeConfig is initialized (simulating new game state)
        if (!pet.homeConfig) {
            pet.homeConfig = { rooms: { "Entryway": { unlocked: true } } };
        }

        // Mock PersistenceManager to prevent actual saves
        pet.persistenceManager = {
            savePet: jest.fn(),
            saveJournal: jest.fn()
        };

        // Clear inventory
        pet.inventory = {};
    });

    test('Rooms should be locked by default (except Entryway)', () => {
        // Checking via RoomDefinitions directly as we modified it
        expect(RoomDefinitions["Entryway"].unlocked).toBe(true);
        expect(RoomDefinitions["LivingRoom"].unlocked).toBe(false);
        expect(RoomDefinitions["Kitchen"].unlocked).toBe(false);
        expect(RoomDefinitions["Bedroom"].unlocked).toBe(false);
    });

    test('isRoomUnlocked should return correct status', () => {
        // Entryway should be unlocked by default config
        expect(pet.isRoomUnlocked("Entryway")).toBe(true);

        // LivingRoom should be locked (not in config, and false in defs)
        expect(pet.isRoomUnlocked("LivingRoom")).toBe(false);
    });

    test('unlockRoom should unlock a specific room', () => {
        pet.unlockRoom("LivingRoom");
        expect(pet.isRoomUnlocked("LivingRoom")).toBe(true);
        expect(pet.homeConfig.rooms["LivingRoom"].unlocked).toBe(true);
    });

    test('Consuming a Deed should unlock the corresponding room', () => {
        // Give deed
        pet.inventory["Living Room Deed"] = 1;

        // Consume
        const result = pet.consumeItem("Living Room Deed");

        expect(result.success).toBe(true);
        expect(pet.isRoomUnlocked("LivingRoom")).toBe(true);
        expect(pet.inventory["Living Room Deed"]).toBeUndefined(); // Should be consumed
    });

    test('Should enforce linear progression (Cannot unlock Kitchen if LivingRoom is locked)', () => {
        // Ensure LivingRoom is locked
        expect(pet.isRoomUnlocked("LivingRoom")).toBe(false);

        // Give Kitchen Deed
        pet.inventory["Kitchen Deed"] = 1;

        // Attempt to consume
        const result = pet.consumeItem("Kitchen Deed");

        // Should fail
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/connect/i); // Expect some message about path/connection
        expect(pet.isRoomUnlocked("Kitchen")).toBe(false);
        expect(pet.inventory["Kitchen Deed"]).toBe(1); // Not consumed
    });

    test('Should allow unlocking subsequent rooms if path is open', () => {
        // Unlock LivingRoom first
        pet.unlockRoom("LivingRoom");

        // Give Kitchen Deed
        pet.inventory["Kitchen Deed"] = 1;

        // Consume
        const result = pet.consumeItem("Kitchen Deed");

        expect(result.success).toBe(true);
        expect(pet.isRoomUnlocked("Kitchen")).toBe(true);
    });
});
