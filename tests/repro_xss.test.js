import { jest } from '@jest/globals';
import { globalErrorHandler } from '../js/utils/ErrorHandler.js';

/**
 * @jest-environment jsdom
 */

describe('Global Error Handler XSS Reproduction', () => {

    afterEach(() => {
        // Clean up any error boxes added to the body
        const errorBoxes = document.querySelectorAll('div');
        errorBoxes.forEach(box => {
            // Check for styles or text content that identifies our error box
            if (box.style.cssText.includes('background: rgba(100, 0, 0, 0.9)') ||
                (box.textContent && box.textContent.includes('CRASH DETECTED'))) {
                box.remove();
            }
        });
        jest.clearAllMocks();
    });

    test('should NOT parse XSS payload in error message as HTML', () => {
        const xssPayload = '<img src="x" onerror="window.XSS_EXECUTED=true" id="xss-img">';

        globalErrorHandler(xssPayload, 'test.js', 1, 1, null);

        const img = document.getElementById('xss-img');
        expect(img).toBeNull();
    });

    test('should NOT parse XSS payload in URL as HTML', () => {
        const xssPayload = 'test.js"><script id="xss-script"></script>';

        globalErrorHandler('Some error', xssPayload, 1, 1, null);

        const script = document.getElementById('xss-script');
        expect(script).toBeNull();
    });

    test('should NOT parse XSS payload in error stack as HTML', () => {
        const xssPayload = '<script id="xss-script-stack"></script>';
        const error = { stack: xssPayload };

        globalErrorHandler('Some error', 'test.js', 1, 1, error);

        const script = document.getElementById('xss-script-stack');
        expect(script).toBeNull();
    });
});
