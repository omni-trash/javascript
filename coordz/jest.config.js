/** @type {import('@jest/types').Config.InitialOptions} */

// https://jestjs.io/docs/configuration
// https://jestjs.io/docs/code-transformation
// https://kulshekhar.github.io/ts-jest/docs/getting-started/options

module.exports = {
  verbose: true,
  preset: "ts-jest",
  roots: ["./testing/jest"],
  testMatch: ["**.test.ts"],
  transform: {
    ".(ts|tsx)": "ts-jest"
  },
  globals:{
    "ts-jest": {
      isolatedModules: true,
      tsconfig: false,
    }
  }
};
