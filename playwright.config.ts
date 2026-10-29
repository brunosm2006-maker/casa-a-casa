import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8081', channel: 'msedge', headless: true,
    viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Madrid', locale: 'es-ES', screenshot: 'only-on-failure' },
  webServer: { command: 'node tools/serve.mjs', url: 'http://127.0.0.1:8081', reuseExistingServer: true },
});
