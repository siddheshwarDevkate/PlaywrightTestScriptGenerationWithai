<!--
=======================================================
CLAUDE AGENT INSTRUCTION PROMPT
=======================================================
You are a Senior QA Automation Engineer with 10+ years
of experience in Playwright and TypeScript.

YOUR TASK:
1. Read all test cases defined below carefully
2. Read generator.md for all coding standards and rules
3. Navigate to the application URL from agent.config.json
4. For EACH relevant page:
   a. Take DOM snapshot via Playwright MCP
   b. Extract REAL locators from actual DOM
   c. Identify ALL interactive elements
   d. Infer additional validations from DOM attributes
      (required, minlength, maxlength, type, pattern, disabled)
   e. Identify success states and error states
5. Generate COMPLETE automation framework:
   - pages/BasePage.ts (base class first)
   - pages/[Feature]Page.ts (one per page)
   - tests/[feature].spec.ts (one per feature)
   - utils/TestDataHelper.ts
   - utils/WaitHelper.ts
   - playwright.config.ts
6. Follow ALL rules in generator.md strictly:
   - Locator priority order
   - XPath with AND, OR, ancestor::, following-sibling::
   - Naming conventions
   - POM structure
   - Assertion patterns
7. Cover ALL scenarios:
   - Happy path
   - Negative scenarios
   - Edge cases
   - DOM-inferred validations (even if not listed below)

IMPORTANT:
- Use REAL locators from DOM, never guess
- Add validations Claude infers from DOM attributes
- Never use hardcoded waits
- Always follow TypeScript strict standards
- Output all files to generated/ folder
=======================================================
-->

# Test Cases
### TC001 - Valid Login

**Steps:**

1. Navigate to the login page.
2. Enter a valid email address.
3. Enter a valid password.
4. Click the Login button.

**Expected Result:**

* User is redirected to the dashboard.
* Welcome message is displayed.

---

### TC002 - Invalid Email Format

**Steps:**

1. Navigate to the login page.
2. Enter an invalid email (e.g., "notanemail").
3. Enter a valid password.
4. Click the Login button.

**Expected Result:**

* Error message is shown for invalid email format.

---

### TC003 - Invalid Password

**Steps:**

1. Navigate to the login page.
2. Enter a valid email address.
3. Enter an invalid password.
4. Click the Login button.

**Expected Result:**

* Login is unsuccessful.
* Appropriate error message is displayed.

---

### TC004 - Empty Username and Password

**Steps:**

1. Navigate to the login page.
2. Leave the email field blank.
3. Leave the password field blank.
4. Click the Login button.

**Expected Result:**

* Validation messages are displayed for required fields.
* User remains on the login page.

---

### TC005 - Logout Functionality

**Steps:**

1. Log in with valid credentials.
2. Navigate to the user profile or menu.
3. Click the Logout button.

**Expected Result:**

* User is logged out successfully.
* User is redirected to the login page.
* Protected pages are no longer accessible without logging in again.

