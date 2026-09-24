import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests',
    timeout: 90000,
    expect: { timeout: 15000 },
    workers: 1,
    use: {
        baseURL: 'http://localhost:3001',
        channel: 'msedge',
        headless: true,
        viewport: { width: 1440, height: 1000 },
        trace: 'retain-on-failure'
    },
    reporter: 'list'
});
