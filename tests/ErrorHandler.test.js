/**
 * @jest-environment jsdom
 */

import { globalErrorHandler } from '../js/utils/ErrorHandler.js';

describe('Global Error Handler', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    it('creates an error box with the correct information', () => {
        const error = new Error('Test Stack');
        const result = globalErrorHandler('Test Message', 'test.js', 10, 20, error);

        expect(result).toBe(false);
        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        expect(errorBox).not.toBeNull();

        expect(errorBox.querySelector('h3').textContent).toBe('CRASH DETECTED');
        const paragraphs = errorBox.querySelectorAll('p');
        expect(paragraphs[0].textContent).toBe('Test Message');
        expect(paragraphs[1].textContent).toBe('test.js:10:20');
        expect(errorBox.querySelector('pre').textContent).toBe(error.stack);
    });

    it('handles null error object', () => {
        globalErrorHandler('Test Message', 'test.js', 10, 20, null);
        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        expect(errorBox.querySelector('pre').textContent).toBe('');
    });

    it('copies to clipboard correctly on copy button click', async () => {
        globalErrorHandler('Test Message', 'test.js', 10, 20, new Error('Test Stack'));
        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        const copyBtn = errorBox.querySelectorAll('button')[0];

        expect(copyBtn.innerText).toBe('COPY ERROR');

        copyBtn.click();

        // Wait for the promise to resolve
        await Promise.resolve();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(errorBox.innerText);
        expect(copyBtn.innerText).toBe('COPIED!');
    });

    it('handles clipboard copy failure correctly', async () => {
        // Mock clipboard API to reject
        navigator.clipboard.writeText.mockImplementationOnce(() => Promise.reject(new Error('Copy failed')));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        globalErrorHandler('Test Message', 'test.js', 10, 20, new Error('Test Stack'));
        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        const copyBtn = errorBox.querySelectorAll('button')[0];

        copyBtn.click();

        // Wait for the promise to reject
        await Promise.resolve();

        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy: ', expect.any(Error));
        expect(copyBtn.innerText).toBe('COPY FAILED');

        consoleSpy.mockRestore();
    });

    it('removes the error box on close button click', () => {
        globalErrorHandler('Test Message', 'test.js', 10, 20, new Error('Test Stack'));
        const errorBox = document.body.querySelector('div[style*="z-index: 9999"]');
        const closeBtn = errorBox.querySelectorAll('button')[1];

        expect(document.body.contains(errorBox)).toBe(true);

        closeBtn.click();

        expect(document.body.contains(errorBox)).toBe(false);
    });
});
