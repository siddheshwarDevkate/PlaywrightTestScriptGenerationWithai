import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly usernameInputLocator: Locator;
  private readonly passwordInputLocator: Locator;
  private readonly loginButtonLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInputLocator = page.locator('[data-test="username"]');
    this.passwordInputLocator = page.locator('[data-test="password"]');
    this.loginButtonLocator = page.locator('[data-test="login-button"]');
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInputLocator.fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInputLocator.fill(password);
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButtonLocator.click();
  }

  async verifyErrorMessageVisible(): Promise<void> {
    await expect(this.page.locator('.error-message')).toBeVisible();
  }

  async performLogin(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLoginButton();
  }
}