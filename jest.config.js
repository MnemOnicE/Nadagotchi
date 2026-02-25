module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['js/**/*.js'],
  coverageDirectory: 'coverage/',
  coverageReporters: ['text', 'lcov'],
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
