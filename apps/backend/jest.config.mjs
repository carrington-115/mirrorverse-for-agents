/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  rootDir: "./src",
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/$1",
    "^@api/(.*)$": "<rootDir>/api/$1",
    "^@services/(.*)$": "<rootDir>/services/$1",
    "^@middleware/(.*)$": "<rootDir>/middleware/$1",
    "^@models/(.*)$": "<rootDir>/models/$1",
    "^@types/(.*)$": "<rootDir>/types/$1",
    "^@utils/(.*)$": "<rootDir>/utils/$1",
    "^@config/(.*)$": "<rootDir>/config/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "esnext",
          moduleResolution: "bundler",
          isolatedModules: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.test.ts",
    "!**/*.d.ts",
    "!server.ts",
    "!app.ts",
  ],
  coverageDirectory: "../coverage",
  coverageReporters: ["text", "html", "lcov"],
  // Target: 80% across the board. Bootstrapped at 0% so CI doesn't block
  // while the test suite grows. Ratchet these up as new tests land.
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    },
  },
};

export default config;
