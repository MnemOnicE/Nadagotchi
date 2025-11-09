// tests/test_setup.js
const fs = require('fs');
const path = require('path');

// 1. SETUP: Mock browser-specific APIs for Node.js environment
class LocalStorageMock {
    constructor() { this.store = {}; }
    clear() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

// 2. DEPENDENCIES: Load the production code as text.
const persistenceManagerCode = fs.readFileSync(path.resolve(__dirname, '../js/PersistenceManager.js'), 'utf8');
const nadagotchiCode = fs.readFileSync(path.resolve(__dirname, '../js/Nadagotchi.js'), 'utf8');

// 3. EVALUATE & EXTRACT: Since `class` declarations are lexically scoped within `eval`
// in strict mode (which `class` enforces), we execute the code and then return the
// class constructor as an expression to capture it.
const PersistenceManager = eval(persistenceManagerCode + '; PersistenceManager');

// Make PersistenceManager globally available as the Nadagotchi class constructor expects it
// when its code is evaluated.
global.PersistenceManager = PersistenceManager;

const Nadagotchi = eval(nadagotchiCode + '; Nadagotchi');


// 4. EXPORT: Now that we have captured the classes, export them for the tests.
module.exports = {
    Nadagotchi,
    PersistenceManager
};
