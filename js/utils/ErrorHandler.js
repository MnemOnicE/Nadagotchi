/**
 * Global Error Handler to catch unhandled errors and display them in a DOM overlay.
 * Replaces dangerously assigned innerHTML with textContent to prevent DOM XSS.
 *
 * @param {string|Event} msg Error message
 * @param {string} url Source file URL
 * @param {number} lineNo Line number
 * @param {number} columnNo Column number
 * @param {Error} error Error object
 * @returns {boolean} Whether to suppress the default browser error handling
 */
export function globalErrorHandler(msg, url, lineNo, columnNo, error) {
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(100,0,0,0.9); color:white; z-index:9999; padding:20px; overflow:scroll; font-family:monospace; box-sizing: border-box;';

    const title = document.createElement('h3');
    title.textContent = 'CRASH DETECTED';
    errorBox.appendChild(title);

    const msgPara = document.createElement('p');
    msgPara.textContent = typeof msg === 'string' ? msg : msg.toString();
    errorBox.appendChild(msgPara);

    const infoPara = document.createElement('p');
    infoPara.textContent = `${url}:${lineNo}:${columnNo}`;
    errorBox.appendChild(infoPara);

    const stackPre = document.createElement('pre');
    stackPre.textContent = error ? error.stack : '';
    errorBox.appendChild(stackPre);

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
        if (document.body.contains(errorBox)) {
            document.body.removeChild(errorBox);
        }
    };
    errorBox.appendChild(closeBtn);

    document.body.appendChild(errorBox);
    return false;
}
