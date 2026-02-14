import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config({ path: '.env' })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
  },
})
