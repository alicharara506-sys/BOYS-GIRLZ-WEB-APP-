import "dotenv/config";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/supabase-browser",
  workers: 1,
  retries: 0,
  timeout: 180000,
  expect: { timeout: 25000 },
  webServer:
    process.env.BNG_TEST_SUPABASE === "1"
      ? {
          command: "node scripts/server.mjs",
          env: { PORT: "5482" },
          url: "http://127.0.0.1:5482/admin/login",
          timeout: 120000,
        }
      : undefined,
  use: {
    baseURL: "http://127.0.0.1:5482",
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    trace: "off",
    screenshot: "off",
    viewport: { width: 1440, height: 1000 },
  },
});
