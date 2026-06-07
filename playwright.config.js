const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testMatch: '**/drinks-arena-e2e.test.js',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
  workers: 1,
});
