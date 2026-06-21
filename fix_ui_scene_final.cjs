const fs = require('fs');

const file = 'js/UIScene.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('      },\n    ];', '      },\n    ];\n  }\n');
fs.writeFileSync(file, content);
console.log('Done');
