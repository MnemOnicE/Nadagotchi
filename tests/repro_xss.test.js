/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

describe('Global Error Handler XSS Reproduction', () => {
    let errorHandler;

    beforeAll(() => {
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
        // Extract the function body of window.onerror
        const startMarker = 'window.onerror = function (msg, url, lineNo, columnNo, error) {';
        const endMarker = 'return false;\n        };';

        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);

        if (startIndex === -1 || endIndex === -1) {
            throw new Error('Could not find window.onerror in index.html');
        }

        const functionBody = html.substring(startIndex + startMarker.length, endIndex + 'return false;'.length);
        errorHandler = new Function('msg', 'url', 'lineNo', 'columnNo', 'error', functionBody);
    });

    afterEach(() => {
        // Clean up any error boxes added to the body
        const errorBoxes = document.querySelectorAll('div');
        errorBoxes.forEach(box => {
            if (box.style.cssText.includes('background: rgba(100, 0, 0, 0.9)') || box.innerHTML.includes('CRASH DETECTED')) {
                box.remove();
            }
        });
    });

    test('should NOT parse XSS payload in error message as HTML', () => {
        const xssPayload = '<img src="x" onerror="window.XSS_EXECUTED=true" id="xss-img">';

        errorHandler(xssPayload, 'test.js', 1, 1, null);

        const img = document.getElementById('xss-img');
        // This EXPECTATION is what we want to PASS after the fix.
        // Currently, it should FAIL because innerHTML will create the img element.
        expect(img).toBeNull();
    });

    test('should NOT parse XSS payload in URL as HTML', () => {
        const xssPayload = 'test.js"><script id="xss-script"></script>';

        errorHandler('Some error', xssPayload, 1, 1, null);

        const script = document.getElementById('xss-script');
        // This EXPECTATION is what we want to PASS after the fix.
        // Currently, it should FAIL because innerHTML will create the script element.
        expect(script).toBeNull();
    });
});
