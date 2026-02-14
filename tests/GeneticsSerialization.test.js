
import { GeneticsSystem, Genome } from '../js/GeneticsSystem.js';
import { Nadagotchi } from '../js/Nadagotchi.js';
import { Config } from '../js/Config.js';
import { CryptoUtils } from '../js/utils/CryptoUtils.js';

describe('Genetics Serialization System', () => {

    let originalSalt;

    beforeAll(() => {
        originalSalt = Config.SECURITY.DNA_SALT;
    });

    afterAll(() => {
        Config.SECURITY.DNA_SALT = originalSalt;
    });

    it('should correctly serialize and deserialize a genome', async () => {
        const genome = new Genome();
        const serialized = await GeneticsSystem.serialize(genome);

        expect(typeof serialized).toBe('string');
        expect(serialized).toContain('.');

        const deserialized = await GeneticsSystem.deserialize(serialized);
        expect(deserialized).toBeInstanceOf(Genome);
        expect(deserialized.genotype).toEqual(genome.genotype);
    });

    it('should throw an error if the string format is invalid', async () => {
        await expect(GeneticsSystem.deserialize("InvalidString")).rejects.toThrow("Invalid DNA Format");
        await expect(GeneticsSystem.deserialize("Part1.Part2.Part3")).rejects.toThrow("Invalid DNA Format");
    });

    it('should throw an error if the checksum is invalid (Tampering)', async () => {
        const genome = new Genome();
        const serialized = await GeneticsSystem.serialize(genome);
        const [encoded, checksum] = serialized.split('.');

        // Tamper with the encoded data (change first char)
        const tamperedEncoded = (encoded[0] === 'a' ? 'b' : 'a') + encoded.slice(1);
        const tamperedString = `${tamperedEncoded}.${checksum}`;

        await expect(GeneticsSystem.deserialize(tamperedString)).rejects.toThrow("DNA Integrity Check Failed");
    });

    it('should throw an error if the checksum is modified', async () => {
        const genome = new Genome();
        const serialized = await GeneticsSystem.serialize(genome);
        const [encoded, checksum] = serialized.split('.');

        // Tamper with the checksum
        const tamperedChecksum = (checksum[0] === 'a' ? 'b' : 'a') + checksum.slice(1);
        const tamperedString = `${encoded}.${tamperedChecksum}`;

        await expect(GeneticsSystem.deserialize(tamperedString)).rejects.toThrow("DNA Integrity Check Failed");
    });

    it('should throw an error if the JSON structure is invalid after decoding', async () => {
        // Create a valid base64 but invalid JSON
        const badJson = JSON.stringify({ wrong: "data" });

        // Use the salt from Config
        const salt = Config.SECURITY.DNA_SALT;
        const encoded = (typeof btoa === 'function' ? btoa(badJson) : Buffer.from(badJson).toString('base64'));

        // Calculate valid checksum for this bad payload using CryptoUtils
        const validChecksum = await CryptoUtils.generateHash(encoded, salt);

        const payload = `${encoded}.${validChecksum}`;

        await expect(GeneticsSystem.deserialize(payload)).rejects.toThrow("Invalid Genotype Structure");
    });
});

describe('Nadagotchi Import/Export', () => {
    it('should export DNA from a pet instance', async () => {
        const pet = new Nadagotchi('Adventurer');
        const dna = await pet.exportDNA();
        expect(dna).toBeDefined();
        expect(typeof dna).toBe('string');
    });

    it('should generate valid pet data from DNA string', async () => {
        const parent = new Nadagotchi('Intellectual');
        // Let's force some genes to ensure they carry over
        parent.genome.genotype.Intellectual = [99, 99];
        const dna = await parent.exportDNA();

        const data = await Nadagotchi.generateDataFromDNA(dna);

        expect(data).toBeDefined();
        expect(data.dominantArchetype).toBe('Intellectual'); // 99 pts should make it dominant
        expect(data.genome.genotype.Intellectual).toEqual([99, 99]);
        expect(data.generation).toBe(1); // Reset to 1 for new import
    });
});
