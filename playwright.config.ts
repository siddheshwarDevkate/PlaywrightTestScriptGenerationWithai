import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';
// ── Single source of truth — reads from agent.config.json ──
const agentConfig = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, 'input/agent.config.json'),
    'utf-8'
  )
);

export default defineConfig({
  testDir: './generated/tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report' }]
  ],

  use: {
    baseURL: agentConfig.application.baseUrl, // ← auto from config
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});