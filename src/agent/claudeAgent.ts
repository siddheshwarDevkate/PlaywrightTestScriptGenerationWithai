import { AgentConfig, NavigationPlan } from '../utils/configLoader';

export class ClaudeAgent {

  private config: AgentConfig;
  private apiKey: string;

  constructor(config: AgentConfig, apiKey: string) {
    this.config = config;
    this.apiKey = apiKey;
  }

  // ── Get base URL per provider ─────────────────────────────
  private getBaseUrl(): string {
    switch (this.config.ai.provider) {
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'groq':
        return 'https://api.groq.com/openai/v1/chat/completions';
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      default:
        throw new Error(`Unsupported provider: ${this.config.ai.provider}`);
    }
  }

  // ── Get headers per provider ──────────────────────────────
  private getHeaders(): Record<string, string> {
    switch (this.config.ai.provider) {
      case 'anthropic':
        return {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        };
      case 'groq':
      case 'openai':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
      default:
        throw new Error(`Unsupported provider: ${this.config.ai.provider}`);
    }
  }

  // ── Build request body per provider ──────────────────────
  private buildRequestBody(
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number
  ): object {
    const tokens = maxTokens ?? this.config.ai.maxTokens;
    switch (this.config.ai.provider) {
      case 'anthropic':
        return {
          model: this.config.ai.model,
          max_tokens: tokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        };
      case 'groq':
      case 'openai':
        return {
          model: this.config.ai.model,
          max_tokens: tokens,
          temperature: this.config.ai.temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        };
      default:
        throw new Error(`Unsupported provider: ${this.config.ai.provider}`);
    }
  }

  // ── Extract text response per provider ───────────────────
  private extractResponse(data: Record<string, unknown>): string {
    switch (this.config.ai.provider) {
      case 'anthropic': {
        const content = data.content as Array<{ text: string }>;
        return content[0].text;
      }
      case 'groq':
      case 'openai': {
        const choices = data.choices as Array<{
          message: { content: string }
        }>;
        return choices[0].message.content;
      }
      default:
        throw new Error(`Unsupported provider: ${this.config.ai.provider}`);
    }
  }

  // ── Generic API call with retry on rate limit ─────────────
  private async callAPI(
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number
  ): Promise<string> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(
          this.buildRequestBody(systemPrompt, userPrompt, maxTokens)
        )
      });

      if (response.ok) {
        const data = await response.json() as Record<string, unknown>;
        return this.extractResponse(data);
      }

      const errorText = await response.text();

      // Rate limit → wait and retry
      if (response.status === 429) {
        const waitSeconds = attempt * 65;
        console.log(`\n⏳ Rate limit hit → waiting ${waitSeconds}s before retry ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }

      throw new Error(
        `API call failed [${this.config.ai.provider}]: ${response.status} - ${errorText}`
      );
    }

    throw new Error('Max retries exceeded');
  }

  // ── PHASE 1: Plan navigation from TC document ─────────────
  async planNavigation(testCases: string): Promise<NavigationPlan> {
    console.log('\n🗺️  Phase 1: Analysing TC document → building navigation plan...');

    const systemPrompt = `
You are a QA architect. Analyse test cases and return a navigation plan as JSON only.
No explanation, no markdown, no code fences — return ONLY raw JSON.

JSON format:
{
  "pages": [
    {
      "pageName": "LoginPage",
      "url": "USE_BASE_URL",
      "actions": [],
      "waitForSelector": "#user-name"
    },
    {
      "pageName": "DashboardPage",
      "url": "AUTO",
      "actions": [
        "fill:#user-name=USERNAME",
        "fill:#password=PASSWORD",
        "click:#login-button"
      ],
      "waitForSelector": ".inventory_list"
    }
  ]
}

STRICT RULES:
- Return MAXIMUM 2-3 pages — only DISTINCT pages with different URLs or layouts
- DO NOT create separate pages for menu clicks, sidebar links, or modal popups
- DO NOT repeat login actions on any page after LoginPage
- Logout is an ACTION on DashboardPage — NOT a separate page
- Menu/sidebar/drawer are ACTIONS on DashboardPage — NOT separate pages
- A new page means a completely different URL or full page reload
- First page always has url = "USE_BASE_URL" and empty actions
- Subsequent pages have url = "AUTO" and actions to navigate there
- Actions format: "fill:selector=value" or "click:selector"
- Replace USERNAME with actual username value, PASSWORD with actual password value
- waitForSelector confirms page has loaded
- Return ONLY valid JSON — nothing else
`;

    const userPrompt = `
BASE URL: ${this.config.application.baseUrl}
CREDENTIALS:
  username: ${this.config.application.credentials.username || 'not provided'}
  password: ${this.config.application.credentials.password || 'not provided'}

TEST CASES:
${testCases}

Return navigation plan as raw JSON only.
`;

    const response = await this.callAPI(systemPrompt, userPrompt, 1000);

    // Clean response — remove any markdown fences if present
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    try {
      const plan = JSON.parse(cleaned) as NavigationPlan;
      console.log(`✅ Navigation plan built → ${plan.pages.length} pages identified:`);
      plan.pages.forEach(p => console.log(`   → ${p.pageName}`));
      return plan;
    } catch {
      console.log('⚠️  Failed to parse navigation plan, using default single page plan');
      return {
        pages: [
          {
            pageName: 'LoginPage',
            url: 'USE_BASE_URL',
            actions: [],
            waitForSelector: 'body'
          }
        ]
      };
    }
  }

  // ── PHASE 2: Generate framework from all page DOMs ────────
  async generateFramework(
    testCases: string,
    generatorRules: string,
    domSnapshots: string
  ): Promise<string> {
    console.log(`\n🤖 Phase 2: Calling ${this.config.ai.provider} → generating framework...`);

    const systemPrompt = `
You are a Senior QA Automation Engineer specializing in Playwright and TypeScript.
CODING STANDARDS (Follow strictly):
${generatorRules}
`;

    const userPrompt = `
APPLICATION URL: ${this.config.application.baseUrl}

DOM SNAPSHOTS FROM ALL PAGES:
${domSnapshots}

TEST CASES:
${testCases}

Generate complete automation framework following all coding standards.
Output folder: ${this.config.output.folder}/

Return each file using this exact format:
=== FILE: pages/LoginPage.ts ===
[file content]
=== END FILE ===
`;

    return await this.callAPI(systemPrompt, userPrompt);
  }
}