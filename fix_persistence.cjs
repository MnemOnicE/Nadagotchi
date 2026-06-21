const fs = require('fs');
const file = 'tests/PersistenceManager.test.js';
let content = fs.readFileSync(file, 'utf8');
content += '\n});\n';
fs.writeFileSync(file, content);
