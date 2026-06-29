import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './generated/tests',
  /* Shared settings for all the browsers */
  use: {
    baseURL: 'https://www.saucedemo.com/',
    browserName: 'chromium',
    headless: false,
    viewportSize: { width: 1280, height: 720 },
  },
};

export default config;