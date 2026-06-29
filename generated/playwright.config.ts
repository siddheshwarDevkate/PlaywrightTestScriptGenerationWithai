import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'tests',
  timeout: 10000,
  expect: {
    timeout: 5000,
  },
};

export default config;