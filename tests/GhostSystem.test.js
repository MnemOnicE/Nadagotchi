import { GhostSystem } from '../js/systems/GhostSystem.js';

describe('GhostSystem', () => {
    let ghostSystem;

    beforeEach(() => {
        ghostSystem = new GhostSystem();
    });

    test('should validate correct Base64 strings', () => {
        // Base64 can include A-Z, a-z, 0-9, +, /, and = padding
        expect(ghostSystem.validateGhostDNA('ValidBase64=')).toBe(true);
        expect(ghostSystem.validateGhostDNA('AnotherOne+')).toBe(true);
        expect(ghostSystem.validateGhostDNA('SGVsbG8gV29ybGQ=')).toBe(true);
    });

    test('should reject invalid strings (injection attempts)', () => {
        expect(ghostSystem.validateGhostDNA('<script>alert(1)</script>')).toBe(false);
        expect(ghostSystem.validateGhostDNA('Invalid String!')).toBe(false); // Space and !
        expect(ghostSystem.validateGhostDNA('DROP TABLE ghosts;')).toBe(false);
        expect(ghostSystem.validateGhostDNA('javascript:void(0)')).toBe(false);
    });

    test('parseGhost should return object for valid DNA', () => {
        const dna = 'ValidDNA';
        const ghost = ghostSystem.parseGhost(dna);
        expect(ghost).not.toBeNull();
        expect(ghost.dna).toBe(dna);
        expect(ghost.name).toBe('Unknown Spirit');
        expect(ghost.timestamp).toBeDefined();
    });

    test('parseGhost should return null for invalid DNA', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const ghost = ghostSystem.parseGhost('Invalid!');
        expect(ghost).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith("Security Alert: Invalid Ghost DNA detected.");
        consoleSpy.mockRestore();
    });
});
