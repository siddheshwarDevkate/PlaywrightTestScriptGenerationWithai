import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly burgerMenuLocator: Locator;
  private readonly logoutSidebarLinkLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.burgerMenuLocator = page.locator('#react-burger-menu-btn');
    this.logoutSidebarLinkLocator = page.locator('[data-test="logout-sidebar-link"]');
  }

  async clickBurgerMenu(): Promise<void> {
    await this.burgerMenuLocator.click();
  }

  async clickLogoutButton(): Promise<void> {
    await this.clickBurgerMenu();
    await this.logoutSidebarLinkLocator.waitFor({ state: 'visible' });
    await this.logoutSidebarLinkLocator.click();
  }

  async verifyBurgerMenuVisible(): Promise<void> {
    await expect(this.burgerMenuLocator).toBeVisible();
  }

  async verifyLogoutButtonVisible(): Promise<void> {
    await this.clickBurgerMenu();
    await expect(this.logoutSidebarLinkLocator).toBeVisible();
  }
}