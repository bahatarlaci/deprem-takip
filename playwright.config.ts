import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3006",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 3006",
    url: "http://127.0.0.1:3006",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
