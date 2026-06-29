import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { validUsername, validPassword, invalidUsername, invalidPassword } from '../utils/TestDataHelper';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigateTo('https://www.saucedemo.com/');
  });

  test('Valid login redirects to dashboard', async () => {
    await loginPage.fillUsername(validUsername);
    await loginPage.fillPassword(validPassword);
    await loginPage.clickLoginButton();
    await dashboardPage.verifyBurgerMenuVisible();
  });

  test('Invalid username shows error', async () => {
    await loginPage.fillUsername(invalidUsername);
    await loginPage.fillPassword(validPassword);
    await loginPage.clickLoginButton();
    await loginPage.verifyUsernameInputVisible();
  });

  test('Invalid password shows error', async () => {
    await loginPage.fillUsername(validUsername);
    await loginPage.fillPassword(invalidPassword);
    await loginPage.clickLoginButton();
    await loginPage.verifyPasswordInputVisible();
  });

  test('Empty fields show error', async () => {
    await loginPage.clickLoginButton();
    await loginPage.verifyUsernameInputVisible();
    await loginPage.verifyPasswordInputVisible();
  });

  test('Logout redirects to login', async () => {
    await loginPage.fillUsername(validUsername);
    await loginPage.fillPassword(validPassword);
    await loginPage.clickLoginButton();
    await dashboardPage.clickLogoutButton();
    await loginPage.verifyUsernameInputVisible();
  });
});