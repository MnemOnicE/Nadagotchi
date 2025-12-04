const fs = require('fs');
const path = require('path');

function checkFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    let errors = [];

    // Simple state machine
    let inComment = false;
    let commentBlockFound = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('/**')) {
            inComment = true;
            commentBlockFound = true;
        }
        if (inComment && line.includes('*/')) {
            inComment = false;
            // comment ends
        }

        // Check for function/method definitions
        // Heuristic: looks like a method or function definition
        // Exclude reserved keywords
        if (!inComment && !line.startsWith('//')) {
            // Class method: name(args) {
            // Function: function name(args) {
            // Export function: export function name(args) {

            // Regex to match method/function definitions
            // 1. "function foo("
            // 2. "foo(" inside class (this is hard to distinguish from calls without parsing, but usually definitions end with {)
            // 3. "constructor("

            const methodRegex = /^\s*(async\s+)?(static\s+)?(\w+)\s*\(([^)]*)\)\s*\{/;
            const match = line.match(methodRegex);

            if (match) {
                const name = match[3];
                // Ignore common control structures if they matched (unlikely with \w+ but if, for, while, switch, catch)
                const keywords = ['if', 'for', 'while', 'switch', 'catch', 'constructor'];
                // We DO want to document constructor, but maybe I missed it?

                if (!keywords.includes(name) || name === 'constructor') {
                    // Check if we had a comment block immediately preceding
                    // We need to check previous lines for '*/'

                    let hasDoc = false;
                    // Look backwards from i-1
                    let j = i - 1;
                    while (j >= 0) {
                        const prev = lines[j].trim();
                        if (prev === '' || prev.startsWith('//') || prev.startsWith('@')) { // Annotations?
                            j--;
                            continue;
                        }
                        if (prev.endsWith('*/')) {
                            hasDoc = true;
                        }
                        break;
                    }

                    if (!hasDoc) {
                        // Double check if it is really a method definition
                        // Ensure it ends with {
                        if (line.endsWith('{')) {
                             errors.push(`Line ${i + 1}: Method '${name}' appears undocumented.`);
                        }
                    }
                }
            }
        }
    }

    if (errors.length > 0) {
        console.log(`\nFile: ${filepath}`);
        errors.forEach(e => console.log(e));
    }
}

const jsDir = 'js';
fs.readdirSync(jsDir).forEach(file => {
    if (file.endsWith('.js')) {
        checkFile(path.join(jsDir, file));
    }
});
