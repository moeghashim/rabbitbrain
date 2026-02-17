import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "cli/**/*.mjs",
        "lib/analysis/**/*.mjs",
        "lib/classifier/**/*.ts",
        "lib/xresearch/**/*.ts",
      ],
      exclude: ["**/*.d.ts"],
      thresholds: {
        lines: 25,
        statements: 25,
        functions: 25,
        branches: 20,
      },
    },
  },
});
