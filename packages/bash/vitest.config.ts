import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'bash',
    environment: 'node',
    // setupFiles: ['./test/setup.ts'],
  },
})
