const fs = require('fs');
const file = 'tests/PersistenceManager.test.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('        consoleErrorSpy.mockRestore();\n    describe', '        consoleErrorSpy.mockRestore();\n    });\n\n    describe');
fs.writeFileSync(file, content);
