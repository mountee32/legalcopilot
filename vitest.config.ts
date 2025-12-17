import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/helpers/vitest-setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", ".next/", "**/*.config.ts", "**/*.d.ts", "tests/e2e/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
});
