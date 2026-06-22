# Generator Rules — MANDATORY STANDARDS
# Every rule below is STRICT. Violations cause TypeScript errors.

---

## GOLDEN RULES — NEVER VIOLATE

```
1. ALL locators → private readonly inside page class ONLY
2. NEVER access locators directly from spec files
3. ALWAYS expose public verify/action methods for spec files
4. NEVER use textContent() → ALWAYS use innerText()
5. NEVER use page.waitForTimeout() → use Playwright built-in waits
6. NEVER use any type in TypeScript
7. Spec files ONLY call public methods — NEVER touch locators
8. ALWAYS import { Page, Locator, expect } from '@playwright/test' in every page class
9. ALWAYS use exact locators from DOM snapshot — NEVER guess or fabricate
```

---

## 1. LOCATOR STRATEGY (Priority Order)

```typescript
1. data-testid   → page.locator('[data-testid="login-button"]')
2. id            → page.locator('#email')
3. name          → page.locator('[name="username"]')
4. ARIA role     → page.getByRole('button', { name: 'Login' })
5. CSS specific  → page.locator('input[type="email"]')
6. XPath         → last resort only
```

NEVER USE: generic classes `.btn`, positional `div:nth-child(2)`

---

## 2. XPATH RULES

```
AND condition:   //button[@type='submit' and @class='btn-primary']
OR condition:    //button[@id='login' or @name='loginBtn']
ancestor axis:   //input[@type='password' and ancestor::form[@id='loginForm']]
sibling axis:    //label[text()='Email']/following-sibling::input
contains():      //button[contains(text(),'Login')]
```

---

## 3. LOCATOR ACCESS RULES

```typescript
✅ CORRECT — private readonly, exposed via public methods:
private readonly errorMessageLocator: Locator;

async verifyErrorMessageVisible(): Promise<void> {
  await expect(this.errorMessageLocator).toBeVisible();
}

❌ WRONG — public locator, accessed from spec:
public errorMessageLocator: Locator;
await expect(loginPage.errorMessageLocator).toBeVisible();
```

Every locator MUST have a public verify method. Spec files call ONLY these methods.

---

## 4. RETURN TYPE RULES

```typescript
❌ WRONG: return await this.locator.textContent(); // string | null = error
✅ CORRECT: return await this.locator.innerText();  // string = correct
```

---

## 5. PAGE CLASS STRUCTURE

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class [PageName]Page extends BasePage {

  private readonly [element]Locator: Locator;

  constructor(page: Page) {
    super(page);
    this.[element]Locator = page.locator('[selector from DOM snapshot]');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('[url]');
  }

  async fill[Element](value: string): Promise<void> {
    await this.[element]Locator.fill(value);
  }

  async click[Element](): Promise<void> {
    await this.[element]Locator.click();
  }

  async get[Element]Text(): Promise<string> {
    return await this.[element]Locator.innerText(); // ALWAYS innerText
  }

  async verify[Element]Visible(): Promise<void> {
    await expect(this.[element]Locator).toBeVisible();
  }

  async verify[Element]Hidden(): Promise<void> {
    await expect(this.[element]Locator).toBeHidden();
  }

  async perform[Action](param1: string, param2: string): Promise<void> {
    await this.fill[Element1](param1);
    await this.fill[Element2](param2);
    await this.click[Element]();
  }
}
```

---

## 6. SPEC FILE STRUCTURE

```typescript
✅ CORRECT — spec calls ONLY public methods:
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

const validUsername = 'standard_user';
const validPassword = 'secret_sauce';
const invalidUsername = 'invalid_user';
const invalidPassword = 'invalid_password';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigateTo();
  });

  test.describe('Happy Path', () => {
    test('Valid credentials should redirect to dashboard', async () => {
      await loginPage.fillUsername(validUsername);
      await loginPage.fillPassword(validPassword);
      await loginPage.clickLoginButton();
      await dashboardPage.verifyDashboardVisible();
      await dashboardPage.verifyWelcomeMessageVisible();
    });

    test('Logout should redirect back to login page', async () => {
      await loginPage.performLogin(validUsername, validPassword);
      await dashboardPage.clickLogoutButton();
      await loginPage.verifyUsernameInputVisible();
    });
  });

  test.describe('Negative Scenarios', () => {
    test('Invalid username should show error', async () => {
      await loginPage.fillUsername(invalidUsername);
      await loginPage.fillPassword(validPassword);
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });

    test('Invalid password should show error', async () => {
      await loginPage.fillUsername(validUsername);
      await loginPage.fillPassword(invalidPassword);
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });

    test('Empty username should show error', async () => {
      await loginPage.fillPassword(validPassword);
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });

    test('Empty password should show error', async () => {
      await loginPage.fillUsername(validUsername);
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });

    test('Both fields empty should show error', async () => {
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('SQL injection should show error', async () => {
      await loginPage.fillUsername("' OR '1'='1");
      await loginPage.fillPassword(validPassword);
      await loginPage.clickLoginButton();
      await loginPage.verifyErrorMessageVisible();
    });
  });
});

❌ WRONG — NEVER do these in spec files:
await expect(loginPage.errorMessageLocator).toBeVisible();       // private locator
await expect(dashboardPage.welcomeMessageLocator).toBeVisible(); // private locator
await dashboardPage.waitForElement(dashboardPage.locator);       // private locator
await page.waitForTimeout(2000);                                 // hardcoded wait
return await this.locator.textContent();                         // wrong return type
```

---

## 7. NAMING CONVENTIONS

```
Page files:   [PageName]Page.ts → LoginPage.ts, DashboardPage.ts
Spec files:   [feature].spec.ts → login.spec.ts
Locators:     private readonly [element]Locator
Actions:      click[Element](), fill[Element]()
Getters:      get[Element]Text()
Verify:       verify[Element]Visible(), verify[Element]Hidden()
Compound:     performLogin(), performSearch()
```

---

## 8. DOM INFERRED VALIDATIONS

| DOM Attribute | Generate This Test |
|---|---|
| `required` | Empty field submission |
| `minlength="n"` | Input below min length |
| `maxlength="n"` | Input above max length |
| `type="email"` | Invalid email format |
| `type="number"` | Non-numeric input |
| `disabled` | Element not interactable |

---

## 9. ASSERTION PATTERNS

```typescript
✅ USE THESE:
await expect(this.locator).toBeVisible();
await expect(this.locator).toBeHidden();
await expect(this.locator).toHaveText('text');
await expect(this.locator).toContainText('partial');
await expect(this.locator).toHaveValue('value');
await expect(this.locator).toBeEnabled();
await expect(this.locator).toBeDisabled();
await expect(this.page).toHaveURL('/dashboard');
await expect(this.page).toHaveTitle('Title');

❌ NEVER USE:
await page.waitForTimeout(2000);
expect(await locator.isVisible()).toBe(true);
await locator.textContent();
```

---

## 10. OUTPUT STRUCTURE

```
generated/
├── pages/
│   ├── BasePage.ts
│   └── [Feature]Page.ts
├── tests/
│   └── [feature].spec.ts
├── utils/
│   ├── TestDataHelper.ts
│   └── WaitHelper.ts
└── playwright.config.ts
```
