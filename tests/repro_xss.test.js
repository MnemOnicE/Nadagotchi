import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

/**
 * @jest-environment jsdom
 */

describe('Global Error Handler XSS Reproduction', () => {
    let errorHandler;

    beforeAll(() => {
        // Use a more explicit path to avoid path traversal warnings
        const indexPath = path.join(process.cwd(), 'index.html');
        const html = fs.readFileSync(indexPath, 'utf8');

        // Extract the script content safely
        const scriptMatch = html.match(/\/\/ --- GLOBAL ERROR TRAP ---[\s\S]*?window\.onerror = function[\s\S]*?return false;\n\s+};/);

        if (!scriptMatch) {
            throw new Error('Could not find window.onerror in index.html');
        }

        const scriptContent = scriptMatch[0];

        // Inject script into JSDOM instead of using new Function()
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;
        document.head.appendChild(scriptElement);

        errorHandler = window.onerror;
    });

    afterEach(() => {
        // Clean up any error boxes added to the body
        const errorBoxes = document.querySelectorAll('div');
        errorBoxes.forEach(box => {
            if (box.style.cssText.includes('background: rgba(100, 0, 0, 0.9)') ||
                (box.textContent && box.textContent.includes('CRASH DETECTED'))) {
                box.remove();
            }
        });
        jest.clearAllMocks();
    });

    test('should NOT parse XSS payload in error message as HTML', () => {
        const xssPayload = '<img src="x" onerror="window.XSS_EXECUTED=true" id="xss-img">';

        errorHandler(xssPayload, 'test.js', 1, 1, null);

        const img = document.getElementById('xss-img');
        expect(img).toBeNull();
    });

    test('should NOT parse XSS payload in URL as HTML', () => {
        const xssPayload = 'test.js"><script id="xss-script"></script>';

        errorHandler('Some error', xssPayload, 1, 1, null);

        const script = document.getElementById('xss-script');
        expect(script).toBeNull();
    });
});
