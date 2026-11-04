import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/commerce-browser",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "list",
  webServer: {
    command: "node scripts/server.mjs",
    env: { PORT: "5482" },
    url: "http://127.0.0.1:5482/admin/login",
    reuseExistingServer: false,
    timeout: 120000,
  },
  use: {
    baseURL: "http://127.0.0.1:5482",
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "off",
    screenshot: "off",
    actionTimeout: 15000,
  },
});
