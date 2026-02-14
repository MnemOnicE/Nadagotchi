
import { GeneticsSystem, Genome } from '../js/GeneticsSystem.js';
import { Nadagotchi } from '../js/Nadagotchi.js';
import { Config } from '../js/Config.js';
import { toBase64 } from '../js/utils/Encoding.js';

describe('Genetics Serialization System', () => {

    let originalSalt;

    beforeAll(() => {
        originalSalt = Config.SECURITY.DNA_SALT;
    });

    afterAll(() => {
        Config.SECURITY.DNA_SALT = originalSalt;
    });

    it('should correctly serialize and deserialize a genome', () => {
        const genome = new Genome();
        const serialized = GeneticsSystem.serialize(genome);

        expect(typeof serialized).toBe('string');
        expect(serialized).toContain('.');

        const deserialized = GeneticsSystem.deserialize(serialized);
        expect(deserialized).toBeInstanceOf(Genome);
        expect(deserialized.genotype).toEqual(genome.genotype);
    });

    it('should throw an error if the string format is invalid', () => {
        expect(() => GeneticsSystem.deserialize("InvalidString")).toThrow("Invalid DNA Format");
        expect(() => GeneticsSystem.deserialize("Part1.Part2.Part3")).toThrow("Invalid DNA Format");
    });

    it('should throw an error if the checksum is invalid (Tampering)', () => {
        const genome = new Genome();
        const serialized = GeneticsSystem.serialize(genome);
        const [encoded, checksum] = serialized.split('.');

        // Tamper with the encoded data (change first char)
        const tamperedEncoded = (encoded[0] === 'a' ? 'b' : 'a') + encoded.slice(1);
        const tamperedString = `${tamperedEncoded}.${checksum}`;

        expect(() => GeneticsSystem.deserialize(tamperedString)).toThrow("DNA Integrity Check Failed");
    });

    it('should throw an error if the checksum is modified', () => {
        const genome = new Genome();
        const serialized = GeneticsSystem.serialize(genome);
        const [encoded, checksum] = serialized.split('.');

        // Tamper with the checksum
        const tamperedChecksum = (checksum[0] === 'a' ? 'b' : 'a') + checksum.slice(1);
        const tamperedString = `${encoded}.${tamperedChecksum}`;

        expect(() => GeneticsSystem.deserialize(tamperedString)).toThrow("DNA Integrity Check Failed");
    });

    it('should throw an error if the JSON structure is invalid after decoding', () => {
        // Create a valid base64 but invalid JSON
        const badJson = JSON.stringify({ wrong: "data" });
        // Use a mock or helper logic to simulate how the system would see it
        // Since we can't easily inject a bad encoded string with a VALID checksum (without using private methods),
        // we can try to call deserialize with a manually constructed string if we know the salt.

        // But the salt is in Config. We can read it.
        const salt = Config.SECURITY.DNA_SALT;
        const encoded = toBase64(badJson);

        // Calculate valid checksum for this bad payload
        // We need to replicate the checksum logic or expose it.
        // Since _generateChecksum is private/internal, we can't call it directly in strict JS (though in Jest we might).
        // Let's implement the DJB2 here to generate a "valid" checksum for invalid data.

        let hash = 5381;
        const str = encoded + salt;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        const validChecksum = (hash >>> 0).toString(16);

        const payload = `${encoded}.${validChecksum}`;

        expect(() => GeneticsSystem.deserialize(payload)).toThrow("Invalid Genotype Structure");
    });
});

describe('Nadagotchi Import/Export', () => {
    it('should export DNA from a pet instance', () => {
        const pet = new Nadagotchi('Adventurer');
        const dna = pet.exportDNA();
        expect(dna).toBeDefined();
        expect(typeof dna).toBe('string');
    });

    it('should generate valid pet data from DNA string', () => {
        const parent = new Nadagotchi('Intellectual');
        // Let's force some genes to ensure they carry over
        parent.genome.genotype.Intellectual = [99, 99];
        const dna = parent.exportDNA();

        const data = Nadagotchi.generateDataFromDNA(dna);

        expect(data).toBeDefined();
        expect(data.dominantArchetype).toBe('Intellectual'); // 99 pts should make it dominant
        expect(data.genome.genotype.Intellectual).toEqual([99, 99]);
        expect(data.generation).toBe(1); // Reset to 1 for new import
    });
});
