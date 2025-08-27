import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  transform: {
    ...tsJestTransformCfg,
  },
};