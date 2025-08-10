module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^common/(.*)$': '<rootDir>/src/common/$1',
  },
  testPathIgnorePatterns: ['/app.module.spec.ts$'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
