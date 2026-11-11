module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  collectCoverageFrom: ['src/models/**/*.js', 'src/viewmodels/**/*.js'],
};
