const path = require('path');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'mjs'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [path.resolve(__dirname, 'node_modules/ts-jest'), { tsconfig: './tsconfig.json' }],
    '^.+\\.mjs$': [path.resolve(__dirname, 'node_modules/ts-jest'), { tsconfig: './tsconfig.json' }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  moduleNameMapper: {
    '^better-auth$': '<rootDir>/src/__mocks__/better-auth.ts',
    '^better-auth/(.*)$': '<rootDir>/src/__mocks__/better-auth.ts',
    '^@better-auth/(.*)$': '<rootDir>/src/__mocks__/better-auth.ts',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/generated/**',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};
