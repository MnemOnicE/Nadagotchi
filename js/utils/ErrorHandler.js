/**
 * Global error handler to catch unhandled exceptions and display them securely in the DOM.
 * Mitigates DOM XSS by using textContent instead of innerHTML.
 * @param {string} msg - The error message.
 * @param {string} url - The URL where the error occurred.
 * @param {number} lineNo - The line number of the error.
 * @param {number} columnNo - The column number of the error.
 * @param {Error} error - The Error object.
 * @returns {boolean} Returns false to allow the default browser handler to also run.
 */
export function globalErrorHandler(msg, url, lineNo, columnNo, error) {
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(100,0,0,0.9); color:white; z-index:9999; padding:20px; overflow:scroll; font-family:monospace; box-sizing: border-box;';

    const title = document.createElement('h3');
    title.textContent = 'CRASH DETECTED';
    errorBox.appendChild(title);

    const message = document.createElement('p');
    message.textContent = msg;
    errorBox.appendChild(message);

    const location = document.createElement('p');
    location.textContent = `${url}:${lineNo}:${columnNo}`;
    errorBox.appendChild(location);

    const stackTrace = document.createElement('pre');
    stackTrace.textContent = error ? error.stack : '';
    errorBox.appendChild(stackTrace);

    // Add a "Copy to Clipboard" button
    const copyBtn = document.createElement('button');
    copyBtn.innerText = "COPY ERROR";
    copyBtn.style.cssText = "margin-top: 10px; padding: 10px; background: #fff; color: #000; border: none; cursor: pointer;";
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(errorBox.innerText).then(() => {
            copyBtn.innerText = "COPIED!";
        }).catch(err => {
            console.error('Failed to copy: ', err);
            copyBtn.innerText = "COPY FAILED";
        });
    };
    errorBox.appendChild(copyBtn);

    // Add Close Button (for non-fatal errors)
    const closeBtn = document.createElement('button');
    closeBtn.innerText = "CLOSE";
    closeBtn.style.cssText = "margin-top: 10px; margin-left: 10px; padding: 10px; background: #555; color: #fff; border: 1px solid #777; cursor: pointer;";
    closeBtn.onclick = () => {
        document.body.removeChild(errorBox);
    };
    errorBox.appendChild(closeBtn);

    document.body.appendChild(errorBox);
    return false;
}
