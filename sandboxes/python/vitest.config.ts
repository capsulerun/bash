import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'sandbox-python',
    environment: 'node',
    testTimeout: 60_000,
  },
})
