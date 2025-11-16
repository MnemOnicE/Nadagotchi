const path = require('path');

module.exports = {
  process(src, filename) {
    const className = path.basename(filename, '.js');
    // Appends a module.exports statement to the end of the script,
    // making the class available to Jest's module system.
    // This happens in-memory and does not modify the source file.
    const transformedCode = `${src}\n;if (typeof ${className} !== 'undefined') { module.exports = ${className}; }`;
    return {
      code: transformedCode,
    };
  },
};
