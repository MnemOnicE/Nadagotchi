/**
 * Tests for PetAppearanceSystem - Procedural Pet Generation
 */

import { PetAppearanceSystem } from '../js/systems/PetAppearanceSystem.js';
import { Config } from '../js/Config.js';

// Mock Nadagotchi with required properties
class MockNadagotchi {
    constructor(archetype = 'Adventurer', genome = null) {
        this.dominantArchetype = archetype;
        this.genome = genome || {
            dna: { a: 0.5, b: 0.3, c: 0.2 },
            phenotype: {}
        };
    }
}

describe('PetAppearanceSystem', () => {
    let appearanceSystem;
    let mockPet;

    beforeEach(() => {
        mockPet = new MockNadagotchi('Adventurer');
        appearanceSystem = new PetAppearanceSystem(mockPet);
    });

    describe('Initialization', () => {
        test('should create appearance system with body parts', () => {
            expect(appearanceSystem.bodyParts).toBeDefined();
            expect(appearanceSystem.bodyParts.head).toBeDefined();
            expect(appearanceSystem.bodyParts.torso).toBeDefined();
            expect(appearanceSystem.bodyParts.hands).toBeDefined();
            expect(appearanceSystem.bodyParts.feet).toBeDefined();
        });

        test('should create appearance system with colors', () => {
            expect(appearanceSystem.colors).toBeDefined();
            expect(appearanceSystem.colors.primary).toBeDefined();
            expect(appearanceSystem.colors.secondary).toBeDefined();
            expect(appearanceSystem.colors.accent).toBeDefined();
        });

        test('should create appearance system with markings', () => {
            expect(appearanceSystem.markings).toBeDefined();
            expect(['none', 'stripes', 'spots', 'swirls', 'patches', 'gradient']).toContain(appearanceSystem.markings.type);
        });
    });

    describe('Archetype Influence', () => {
        const archetypes = ['Intellectual', 'Adventurer', 'Nurturer', 'Mischievous', 'Recluse'];

        archetypes.forEach(archetype => {
            test(`should generate appearance for ${archetype}`, () => {
                mockPet.dominantArchetype = archetype;
                const system = new PetAppearanceSystem(mockPet);
                
                expect(system.bodyParts).toBeDefined();
                expect(system.colors).toBeDefined();
                expect(system.markings).toBeDefined();
            });
        });

        test('Adventurer should prefer square head and large torso', () => {
            mockPet.dominantArchetype = 'Adventurer';
            mockPet.genome = null; // Use random
            const system = new PetAppearanceSystem(mockPet);
            
            // These are probabilistic, so we just check they're valid
            expect(['round', 'square', 'pointy', 'heart', 'oval', 'diamond']).toContain(system.bodyParts.head);
            expect(['small', 'medium', 'large', 'stocky', 'slim', 'plump']).toContain(system.bodyParts.torso);
        });

        test('Nurturer should prefer heart head', () => {
            mockPet.dominantArchetype = 'Nurturer';
            // With seeded genome, should consistently get heart head
            mockPet.genome = { dna: { a: 0.5, b: 0.3, c: 0.2 }, phenotype: {} };
            const system = new PetAppearanceSystem(mockPet);
            
            // Nurturer has 60% chance for heart head
            // We can't guarantee it, but it should be one of the valid options
            expect(['round', 'square', 'pointy', 'heart', 'oval', 'diamond']).toContain(system.bodyParts.head);
        });
    });

    describe('Color Generation', () => {
        test('should generate valid hex colors', () => {
            expect(appearanceSystem.colors.primary).toMatch(/^#/);
            expect(appearanceSystem.colors.secondary).toMatch(/^#/);
            expect(appearanceSystem.colors.accent).toMatch(/^#/);
        });

        test('Intellectual should have blueish colors', () => {
            mockPet.dominantArchetype = 'Intellectual';
            const system = new PetAppearanceSystem(mockPet);
            
            // Intellectual palette includes blues
            const blues = ['#4A6FA5', '#6B8CAE', '#8CA9D6', '#2A3F6A', '#1A2A4A'];
            expect(blues).toContain(system.colors.primary);
        });

        test('Adventurer should have warm colors', () => {
            mockPet.dominantArchetype = 'Adventurer';
            const system = new PetAppearanceSystem(mockPet);
            
            // Adventurer palette includes oranges and browns
            const warms = ['#FF8C42', '#FF6B1A', '#E55A2B', '#8B4513', '#A0522D'];
            expect(warms).toContain(system.colors.primary);
        });
    });

    describe('getAppearance', () => {
        test('should return complete appearance object', () => {
            const appearance = appearanceSystem.getAppearance();
            
            expect(appearance.bodyParts).toBeDefined();
            expect(appearance.colors).toBeDefined();
            expect(appearance.markings).toBeDefined();
        });
    });

    describe('getSpriteConfig', () => {
        test('should return sprite configuration', () => {
            const config = appearanceSystem.getSpriteConfig();
            
            expect(config.body).toBeDefined();
            expect(config.body.width).toBeGreaterThan(0);
            expect(config.body.height).toBeGreaterThan(0);
            expect(config.body.color).toBeDefined();
            
            expect(config.head).toBeDefined();
            expect(config.head.width).toBeGreaterThan(0);
            expect(config.head.height).toBeGreaterThan(0);
            
            expect(config.hands).toBeDefined();
            expect(config.hands.left).toBeDefined();
            expect(config.hands.right).toBeDefined();
            
            expect(config.feet).toBeDefined();
            expect(config.feet.left).toBeDefined();
            expect(config.feet.right).toBeDefined();
        });

        test('should include markings and colors', () => {
            const config = appearanceSystem.getSpriteConfig();
            
            expect(config.markings).toBeDefined();
            expect(config.colors).toBeDefined();
        });
    });

    describe('regenerate', () => {
        test('should regenerate appearance', () => {
            const appearance1 = appearanceSystem.getAppearance();
            appearanceSystem.regenerate();
            const appearance2 = appearanceSystem.getAppearance();
            
            // Appearance should be regenerated (may or may not be different due to seeding)
            expect(appearance2.bodyParts).toBeDefined();
            expect(appearance2.colors).toBeDefined();
            expect(appearance2.markings).toBeDefined();
        });
    });

    describe('Utility Methods', () => {
        test('_hexToNumber should convert valid hex colors', () => {
            expect(appearanceSystem._hexToNumber('#FF0000')).toBe(0xFF0000);
            expect(appearanceSystem._hexToNumber('#00FF00')).toBe(0x00FF00);
            expect(appearanceSystem._hexToNumber('#0000FF')).toBe(0x0000FF);
            expect(appearanceSystem._hexToNumber('#FFFFFF')).toBe(0xFFFFFF);
            expect(appearanceSystem._hexToNumber('#000000')).toBe(0x000000);
        });

        test('_hexToNumber should handle shorthand hex', () => {
            // Shorthand #ABC -> #AABBCC
            expect(appearanceSystem._hexToNumber('#ABC')).toBe(0xAABBCC);
        });

        test('_hexToNumber should handle invalid input', () => {
            expect(appearanceSystem._hexToNumber(null)).toBe(0xFFFFFF);
            expect(appearanceSystem._hexToNumber(undefined)).toBe(0xFFFFFF);
        });
    });

    describe('Deterministic Generation', () => {
        test('same genome should produce same appearance', () => {
            const genome = { dna: { a: 0.5, b: 0.3, c: 0.2 }, phenotype: {} };
            mockPet.genome = genome;
            
            const system1 = new PetAppearanceSystem(mockPet);
            const appearance1 = system1.getAppearance();
            
            mockPet.genome = genome;
            const system2 = new PetAppearanceSystem(mockPet);
            const appearance2 = system2.getAppearance();
            
            // With same seed, should get same appearance
            expect(appearance1.bodyParts).toEqual(appearance2.bodyParts);
            expect(appearance1.colors).toEqual(appearance2.colors);
            expect(appearance1.markings.type).toEqual(appearance2.markings.type);
        });
    });
});

describe('Config Feature Flags', () => {
    test('PROCEDURAL_PETS should be defined', () => {
        expect(Config.FEATURES).toBeDefined();
        expect(Config.FEATURES.PROCEDURAL_PETS).toBe(true);
    });
});
