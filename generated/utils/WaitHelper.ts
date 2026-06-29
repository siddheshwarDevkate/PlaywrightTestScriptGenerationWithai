import { Locator } from '@playwright/test';

export async function waitForElement(locator: Locator): Promise<void> {
  await locator.waitFor({ state: 'visible' });
}