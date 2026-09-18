import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:43117";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    timeout: 30_000,
    expect: { timeout: 7_000 },
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
    },
    webServer: {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
