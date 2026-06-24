const path = require('path');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['**/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [path.resolve(__dirname, 'node_modules/ts-jest'), { tsconfig: './tsconfig.json' }],
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
