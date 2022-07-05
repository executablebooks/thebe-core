module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  moduleNameMapper: {
    '\\.(gif|ttf|eot|svg)$': '@jupyterlab/testutils/lib/jest-file-mock.js',
  },
  transform: {
    '^.+\\.svg$': '<rootDir>/jest.svg.transform.js',
    '^.+\\.(js|ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!@jupyterlab/)'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/'],
};
