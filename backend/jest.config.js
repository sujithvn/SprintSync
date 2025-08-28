import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup/jest.setup.ts"],
  transform: {
    ...tsJestTransformCfg,
  },
  // Force Jest to exit after tests complete
  forceExit: true,
  // Detect open handles to help debug hanging tests
  detectOpenHandles: true,
  // Set a timeout for test suites
  testTimeout: 30000,
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};