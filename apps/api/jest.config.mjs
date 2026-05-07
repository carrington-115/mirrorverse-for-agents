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
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};

export default config;
