import { defineConfig, devices } from '@playwright/test'

const webBaseUrl = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:3000'
const apiBaseUrl =
  process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'line',
  use: {
    baseURL: webBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: webBaseUrl,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiBaseUrl,
    },
  },
})
