import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { manifest: true },
  test: { include:['src/test/**/*.test.{ts,jsx}'], environment: 'jsdom', setupFiles: ['./src/test/setup.js'], restoreMocks: true },
});
