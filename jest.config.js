module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(test|spec).js'
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};


