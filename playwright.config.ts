import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'buyer-web',
      testDir: './tests/e2e/buyer-web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'admin-web',
      testDir: './tests/e2e/admin-web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'pos-web',
      testDir: './tests/e2e/pos-web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter @astral-hub/buyer-web dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
})
