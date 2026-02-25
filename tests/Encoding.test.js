import { toBase64, fromBase64 } from '../js/utils/Encoding.js';

describe('Encoding Utils', () => {
    // Save original globals
    const originalBtoa = global.btoa;
    const originalAtob = global.atob;
    const originalBuffer = global.Buffer;

    afterEach(() => {
        // Restore globals after each test
        global.btoa = originalBtoa;
        global.atob = originalAtob;
        global.Buffer = originalBuffer;
    });

    describe('Browser Environment (btoa/atob available)', () => {
        beforeEach(() => {
            // Ensure btoa/atob are present (JSDOM default)
            // If not present, mock them for this block
            if (!global.btoa) {
                global.btoa = (str) => Buffer.from(str).toString('base64');
            }
            if (!global.atob) {
                global.atob = (str) => Buffer.from(str, 'base64').toString('utf-8');
            }
        });

        test('toBase64 should encode string correctly using btoa', () => {
            const input = 'Hello World';
            const expected = 'SGVsbG8gV29ybGQ=';
            expect(toBase64(input)).toBe(expected);
        });

        test('fromBase64 should decode string correctly using atob', () => {
            const input = 'SGVsbG8gV29ybGQ=';
            const expected = 'Hello World';
            expect(fromBase64(input)).toBe(expected);
        });
    });

    describe('Node.js Environment (Buffer available, no btoa/atob)', () => {
        beforeEach(() => {
            // Remove browser globals
            delete global.btoa;
            delete global.atob;

            // Ensure Buffer is present (Node default)
            if (!global.Buffer) {
                global.Buffer = require('buffer').Buffer;
            }
        });

        test('toBase64 should encode string correctly using Buffer', () => {
            const input = 'NodeJS Test';
            const expected = Buffer.from(input).toString('base64');
            expect(toBase64(input)).toBe(expected);
        });

        test('fromBase64 should decode string correctly using Buffer', () => {
            const expected = 'NodeJS Test';
            const input = Buffer.from(expected).toString('base64');
            expect(fromBase64(input)).toBe(expected);
        });
    });

    describe('Unsupported Environment (No btoa/atob, no Buffer)', () => {
        beforeEach(() => {
            // Remove all supported encoding mechanisms
            delete global.btoa;
            delete global.atob;

            // Make Buffer undefined
            // Note: In strict mode, deleting a non-configurable property might fail,
            // but global.Buffer is usually configurable in Jest environment.
            // If delete fails, we can try setting it to undefined.
            try {
                delete global.Buffer;
            } catch (e) {
                global.Buffer = undefined;
            }
            if (typeof global.Buffer !== 'undefined') {
                 global.Buffer = undefined;
            }
        });

        test('toBase64 should throw error', () => {
            expect(() => {
                toBase64('test');
            }).toThrow('Base64 encoding not supported in this environment.');
        });

        test('fromBase64 should throw error', () => {
            expect(() => {
                fromBase64('dGVzdA==');
            }).toThrow('Base64 decoding not supported in this environment.');
        });
    });
});
