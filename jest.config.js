module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['js/**/*.js'],
  coverageDirectory: 'coverage/',
  coverageReporters: ['text', 'lcov'],
  transform: {
    '^.+\\/js\\/(?!game).+\\.js$': './jest.transformer.js'
  },
};
