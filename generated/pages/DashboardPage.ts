import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly logoutButtonLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.logoutButtonLocator = page.locator('[data-test="logout-sidebar-link"]');
  }

  async clickLogoutButton(): Promise<void> {
    await this.logoutButtonLocator.click();
  }

  async verifyDashboardVisible(): Promise<void> {
    await expect(this.page.locator('#inventory_sidebar_link')).toBeVisible();
  }
}