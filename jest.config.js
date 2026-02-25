module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['js/**/*.js'],
  coverageDirectory: 'coverage/',
  coverageReporters: ['text', 'lcov'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
