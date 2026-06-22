# 🎭 Playwright AI Test Generator

Generic AI-powered Playwright test script generator using **Claude Agent + Playwright MCP**.
Works with **any application URL** and **any AI model**.

---

## 📁 Project Structure

```
playwrightsAiTemplet/
│
├── mcp-config/
│   └── generator.md          ← Coding standards, locator rules,
│                                naming conventions, XPath rules
│
├── input/
│   ├── testcases.md          ← Your test cases (plain English)
│   │                            + Claude instruction prompt at top
│   └── agent.config.json     ← AI model, app URL, all settings
│
├── src/
│   ├── agent/
│   │   ├── claudeAgent.ts    ← Claude API integration
│   │   └── generator.ts      ← DOM capture + file writer
│   ├── runner/
│   │   └── generate.ts       ← Main entry point
│   └── utils/
│       └── configLoader.ts   ← Config + file loader
│
├── generated/                ← Auto-generated output (DO NOT edit manually)
│   ├── pages/
│   │   ├── BasePage.ts
│   │   └── LoginPage.ts
│   ├── tests/
│   │   └── login.spec.ts
│   ├── utils/
│   │   ├── TestDataHelper.ts
│   │   └── WaitHelper.ts
│   └── playwright.config.ts
│
├── .env                      ← Your API keys (never commit)
├── .env.example              ← Template for .env
└── package.json
```

---

## 🚀 Setup & Run

### Step 1 — Install dependencies
```bash
npm install
npx playwright install
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```
Add your API key in `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 3 — Configure your application
Edit `input/agent.config.json`:
```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  },
  "application": {
    "baseUrl": "https://your-app-url.com"
  }
}
```

### Step 4 — Add your test cases
Edit `input/testcases.md` and add your test cases in plain English.

### Step 5 — Generate the framework
```bash
npm run generate
```

### Step 6 — Run generated tests
```bash
npm run test:generated
```

---

## 🔧 Switch AI Model

In `agent.config.json`:
```json
// Use Claude
"provider": "anthropic",
"model": "claude-sonnet-4-6",
"apiKeyEnvVar": "ANTHROPIC_API_KEY"

// Use GPT-4
"provider": "openai",
"model": "gpt-4o",
"apiKeyEnvVar": "OPENAI_API_KEY"

// Use Groq
"provider": "groq",
"model": "llama-3.3-70b-versatile",
"apiKeyEnvVar": "GROQ_API_KEY"
```

---

## 🔧 Customize Generator Rules

Edit `mcp-config/generator.md` to change:
- Locator priority (data-testid, id, xpath etc.)
- XPath rules (AND, OR, ancestor, sibling axes)
- Naming conventions
- Assertion patterns
- Folder structure

---

## 🔄 How It Works

```
testcases.md (TC + instruction prompt)
        +
agent.config.json (URL + model + settings)
        +
generator.md (coding standards)
        ↓
Claude Agent reads all inputs
        ↓
Playwright MCP opens browser → captures real DOM
        ↓
Claude maps TC steps to real locators
Claude infers validations from DOM attributes
Claude follows generator.md rules strictly
        ↓
Complete framework generated in generated/ folder
```
