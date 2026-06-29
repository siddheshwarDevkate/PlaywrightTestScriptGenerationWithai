# 🎭 Playwright AI Test Generator

> A generic, model-agnostic AI-powered framework that generates complete Playwright TypeScript test scripts from plain English test cases and a live application URL.

---

## 💡 What Is This?

Instead of writing test scripts manually, this tool:
- Reads your **plain English test cases**
- Opens your **application in a real browser**
- Captures **real DOM snapshots** of every page
- Uses **AI to generate** a complete POM-based Playwright framework
- Works with **any application** and **any AI model**

---

## 🏗️ How It Works

```
Phase 1 — TC Analysis
─────────────────────
testcases.md
    │
    ▼
AI reads TC document
    │
    ▼
Returns navigation plan (which pages to visit)

Phase 2a — DOM Capture
──────────────────────
Browser opens app URL
    │
    ▼
Navigates each page from plan
    │
    ▼
Captures real DOM snapshot per page

Phase 2b — Code Generation
───────────────────────────
TC + DOM + generator.md rules
    │
    ▼
AI generates complete framework
    │
    ▼
Files written to generated/ folder
```

---

## 📁 Project Structure

```
playwrightsAiTemplet/
│
├── 📂 input/
│   ├── testcases.md          ← Your test cases in plain English
│   └── agent.config.json     ← App URL, AI model, all settings
│
├── 📂 mcp-config/
│   └── generator.md          ← Coding standards enforced on AI
│
├── 📂 src/
│   ├── agent/
│   │   ├── claudeAgent.ts    ← AI provider integration (Phase 1 + 2)
│   │   └── generator.ts      ← Browser DOM capture + file writer
│   ├── runner/
│   │   └── generate.ts       ← Main entry point
│   └── utils/
│       └── configLoader.ts   ← Loads all configs and files
│
├── 📂 generated/             ← ⚠️ Auto-generated — do not edit manually
│   ├── pages/                ← Page Object Model classes
│   ├── tests/                ← Playwright spec files
│   ├── utils/                ← Helpers and test data
│   └── playwright.config.ts  ← Playwright configuration
│
├── .env                      ← API keys (never commit)
├── .env.example              ← Key template
└── package.json
```

---

## ⚙️ Configuration

### `input/agent.config.json`
Controls everything — swap any value without touching code:

```json
{
  "ai": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "apiKeyEnvVar": "GROQ_API_KEY"
  },
  "application": {
    "baseUrl": "https://your-app-url.com",
    "credentials": {
      "username": "your-username",
      "password": "your-password"
    }
  },
  "output": {
    "folder": "generated",
    "pattern": "POM"
  }
}
```

### `mcp-config/generator.md`
Defines AI coding standards — locator rules, naming conventions, assertion patterns, POM structure. AI follows these rules strictly for every generation.

### `input/testcases.md`
Plain English test cases. No coding knowledge needed to write them.

---

## 🔄 Switch AI Model (3 lines only)

| Provider | Model | Key |
|---|---|---|
| Groq (Free) | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| Anthropic | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |
| OpenAI | `gpt-4o` | `OPENAI_API_KEY` |

Change `provider`, `model`, `apiKeyEnvVar` in `agent.config.json` — nothing else changes.

---

## 🚀 Setup

- **Step 1** — Install dependencies
  ```bash
  npm install
  npx playwright install
  ```

- **Step 2** — Create `.env` file
  ```bash
  cp .env.example .env
  ```
  Add your API key:
  ```
  GROQ_API_KEY=your-key-here
  ```

- **Step 3** — Set your application URL and credentials in `input/agent.config.json`

- **Step 4** — Write your test cases in plain English in `input/testcases.md`

---

## ▶️ Generate Framework

```bash
npm run generate
```

What happens:
- Phase 1 → AI analyses your TC document → builds navigation plan
- Phase 2a → Browser opens app → captures real DOM of each page
- Phase 2b → AI generates complete POM framework using real locators
- Files written to `generated/` folder

---

## 🧪 Run Generated Tests

```bash
# Run all tests
npx playwright test

# Run with browser visible
npx playwright test --headed

# Run specific file
npx playwright test generated/tests/login.spec.ts

# View HTML report
npx playwright show-report
```

---

## 📦 What Gets Generated

Every `npm run generate` produces:

- `generated/pages/BasePage.ts` — Base class with common methods
- `generated/pages/[Feature]Page.ts` — Page Object per feature
- `generated/tests/[feature].spec.ts` — Test spec with happy path + negative + edge cases
- `generated/utils/TestDataHelper.ts` — Centralised test data
- `generated/utils/WaitHelper.ts` — Custom wait utilities
- `generated/playwright.config.ts` — Playwright configuration

---

## 🔑 Key Design Decisions

- **Model agnostic** → swap AI provider in one config line
- **Standards enforced** → `generator.md` is your team's coding bible
- **TC driven navigation** → AI decides which pages to visit based on your TC
- **Real locators** → browser captures actual DOM, no guessing
- **Generic** → works with any web application out of the box
