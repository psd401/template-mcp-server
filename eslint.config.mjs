import vitest from "@vitest/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  ...tseslint.configs.recommended,
  {
    // Test-quality rules required by the PSD testing standard (05-testing.md):
    // no assertion-free tests, no committed .only, no committed .skip.
    files: ["src/**/*.test.ts"],
    plugins: { vitest },
    rules: {
      "vitest/expect-expect": "error",
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
    },
  },
);
