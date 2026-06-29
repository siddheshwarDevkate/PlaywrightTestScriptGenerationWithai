import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async verifyCurrentUrl(url: string): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }

  async verifyPageTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }
}