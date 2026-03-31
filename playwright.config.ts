import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3847',
    headless: true,
  },
  webServer: {
    command: 'npx next dev --port 3847',
    port: 3847,
    reuseExistingServer: true,
    timeout: 30000,
  },
})
