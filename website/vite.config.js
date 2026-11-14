import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: { manifest: true },
  test: {
    maxWorkers: 2,
    include: ["src/test/**/*.test.{ts,jsx}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    restoreMocks: true,
  },
});
