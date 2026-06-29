import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

const validUsername = 'standard_user';
const validPassword = 'secret_sauce';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigateTo('https://www.saucedemo.com/');
  });

  test('Valid login redirects to dashboard', async () => {
    await loginPage.performLogin(validUsername, validPassword);
    await dashboardPage.verifyDashboardVisible();
  });

  test('Invalid email format shows error', async () => {
    await loginPage.fillUsername('notanemail');
    await loginPage.fillPassword(validPassword);
    await loginPage.clickLoginButton();
    await loginPage.verifyErrorMessageVisible();
  });

  test('Invalid password shows error', async () => {
    await loginPage.fillUsername(validUsername);
    await loginPage.fillPassword('wrongpassword');
    await loginPage.clickLoginButton();
    await loginPage.verifyErrorMessageVisible();
  });

  test('Empty username and password shows error', async () => {
    await loginPage.clickLoginButton();
    await loginPage.verifyErrorMessageVisible();
  });

  test('Logout functionality', async () => {
    await loginPage.performLogin(validUsername, validPassword);
    await dashboardPage.clickLogoutButton();
    await loginPage.verifyCurrentUrl('https://www.saucedemo.com/');
  });
});