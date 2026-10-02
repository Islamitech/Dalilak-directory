import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 45_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5295',
    browserName: 'chromium',
    headless: true,
    launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5295 --strictPort',
    url: 'http://127.0.0.1:5295',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
