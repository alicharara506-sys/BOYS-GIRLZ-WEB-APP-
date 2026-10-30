import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: "list",
  webServer: {
    command: "npm run dev -- --port 5481 --strictPort",
    url: "http://127.0.0.1:5481/",
    reuseExistingServer: false,
    timeout: 120000,
  },
  use: {
    baseURL: "http://127.0.0.1:5481",
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
