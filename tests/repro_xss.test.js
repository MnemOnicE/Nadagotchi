/**
 * @jest-environment jsdom
 */

import { globalErrorHandler } from '../js/utils/ErrorHandler.js';

describe('Global Error Handler (DOM XSS)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    it('should mitigate XSS in the error message', () => {
        const xssPayload = '<img src=x onerror=alert(1)>';
        globalErrorHandler(xssPayload, 'test.js', 1, 1, new Error('Test'));

        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        expect(errorBox).not.toBeNull();

        // Ensure the payload was not executed as HTML
        const imgTags = errorBox.querySelectorAll('img');
        expect(imgTags.length).toBe(0);

        // Ensure the payload is present as plain text
        const textContent = errorBox.textContent;
        expect(textContent).toContain(xssPayload);
    });

    it('should mitigate XSS in the error stack', () => {
        const xssPayload = '<script>alert("XSS")</script>';
        const mockError = new Error('Test Error');
        mockError.stack = xssPayload;

        globalErrorHandler('Error message', 'test.js', 1, 1, mockError);

        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        expect(errorBox).not.toBeNull();

        // Ensure the payload was not executed as HTML
        const scriptTags = errorBox.querySelectorAll('script');
        expect(scriptTags.length).toBe(0);

        // Ensure the payload is present as plain text
        const textContent = errorBox.textContent;
        expect(textContent).toContain(xssPayload);
    });
});
