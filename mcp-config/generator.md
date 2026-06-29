# Generator Rules — MANDATORY. Violations cause TypeScript errors.

## GOLDEN RULES
```
1. ALL locators → private readonly in page class ONLY
2. NEVER access locators or protected properties from spec files
3. ALWAYS expose public verify/action methods for spec files
4. NEVER use textContent() → ALWAYS use innerText()
5. NEVER use page.waitForTimeout()
6. NEVER use any type
7. ALWAYS import { Page, Locator, expect } from '@playwright/test'
8. ALWAYS use ONLY locators found in DOM snapshot — NEVER guess
9. If locator not in DOM snapshot → write TODO comment, never fabricate
```

## 1. LOCATOR PRIORITY
```
1. [data-test="x"] or [data-testid="x"]
2. #id
3. [name="x"]
4. getByRole / getByLabel
5. input[type="email"] (specific CSS)
6. XPath (last resort)
```
Never use: generic classes `.btn`, positional `div:nth-child(2)`

## 2. XPATH (last resort only)
```
AND:      //button[@type='submit' and @class='btn-primary']
OR:       //button[@id='login' or @name='btn']
ancestor: //input[ancestor::form[@id='loginForm']]
sibling:  //label[text()='Email']/following-sibling::input
contains: //button[contains(text(),'Login')]
```

## 3. PAGE CLASS TEMPLATE
```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class [Name]Page extends BasePage {
  private readonly [el]Locator: Locator;

  constructor(page: Page) {
    super(page);
    this.[el]Locator = page.locator('[from DOM snapshot]');
  }

  async navigateTo(): Promise<void> { await this.page.goto('[url]'); }
  async fill[El](v: string): Promise<void> { await this.[el]Locator.fill(v); }
  async click[El](): Promise<void> { await this.[el]Locator.click(); }
  async get[El]Text(): Promise<string> { return await this.[el]Locator.innerText(); }
  async verify[El]Visible(): Promise<void> { await expect(this.[el]Locator).toBeVisible(); }
  async verify[El]Hidden(): Promise<void> { await expect(this.[el]Locator).toBeHidden(); }
  async verifyCurrentUrl(url: string): Promise<void> { await expect(this.page).toHaveURL(url); }
  async verifyPageTitle(t: string): Promise<void> { await expect(this.page).toHaveTitle(t); }
  async perform[Action](p1: string, p2: string): Promise<void> {
    await this.fill[El1](p1);
    await this.fill[El2](p2);
    await this.click[El]();
  }
}
```
Every page MUST have: `verifyCurrentUrl()` and `verifyPageTitle()`

## 4. SPEC FILE TEMPLATE
```typescript
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
    await loginPage.navigateTo();
  });

  test.describe('Happy Path', () => {
    test('Valid login redirects to dashboard', async () => {
      await loginPage.performLogin(validUsername, validPassword);
      await dashboardPage.verifyDashboardVisible();
    });
    test('Logout redirects to login', async () => {
      await loginPage.performLogin(validUsername, validPassword);
      await dashboardPage.clickLogoutButton();
      await loginPage.verifyUsernameInputVisible();
    });
  });

  test.describe('Negative Scenarios', () => {
    test('Invalid username shows error', async () => {
      await loginPage.fillUsername('wrong');
      await loginPage.fillPassword(validPassword);
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });
    test('Empty fields show error', async () => {
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });
  });
});

❌ NEVER in spec files:
await expect(loginPage.errorMessageLocator).toBeVisible();   // private locator
await expect(loginPage.page).toHaveURL('/dashboard');        // protected property
await dashboardPage.waitForElement(dashboardPage.locator);   // private locator
await page.waitForTimeout(2000);                             // hardcoded wait
```

## 5. DOM SNAPSHOT RULES — CRITICAL
```
Snapshots labeled: === PAGE: LoginPage === , === PAGE: DashboardPage ===

ALWAYS:
- Extract locators ONLY from the matching page snapshot
- Follow priority: data-test → id → name → class
- If element not in snapshot → add TODO comment

NEVER:
- Use locators from wrong page snapshot
- Guess or fabricate any locator
- Use locators not present in snapshot
```

## 6. ASSERTIONS
```typescript
✅ await expect(this.locator).toBeVisible();
✅ await expect(this.locator).toHaveText('text');
✅ await expect(this.locator).toHaveValue('val');
✅ await expect(this.page).toHaveURL('/path');
❌ locator.textContent()
❌ page.waitForTimeout()
❌ expect(await locator.isVisible()).toBe(true)
```

## 7. DOM INFERRED TESTS
| Attribute | Test |
|---|---|
| required | Empty field test |
| type="email" | Invalid format test |
| minlength/maxlength | Boundary tests |
| disabled | Not interactable test |

## 8. NAMING
```
Files:    LoginPage.ts, login.spec.ts
Locators: private readonly emailInputLocator
Actions:  fillEmail(), clickLoginButton()
Verify:   verifyErrorMessageVisible(), verifyCurrentUrl()
Compound: performLogin(), performSearch()
```

## 9. OUTPUT STRUCTURE
```
generated/
├── pages/BasePage.ts, [Name]Page.ts
├── tests/[feature].spec.ts
├── utils/TestDataHelper.ts, WaitHelper.ts
└── playwright.config.ts
```