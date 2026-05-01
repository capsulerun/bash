import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'bash',
    environment: 'node',
    testTimeout: 60_000,
    include: ['src/**/*.test.ts'],
  },
});
