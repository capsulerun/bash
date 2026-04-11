import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'sandbox-js',
    environment: 'node',
    testTimeout: 60_000,
  },
})
