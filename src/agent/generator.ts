import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser, Page } from 'playwright';
import { AgentConfig, ConfigLoader, NavigationPlan, NavigationStep } from '../utils/configLoader';

export interface GeneratedFile {
  filePath: string;
  content: string;
}

export class Generator {

  private config: AgentConfig;
  private outputPath: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.outputPath = ConfigLoader.getOutputPath(config);
  }

  // ── Extract filtered DOM from current page ────────────────
  private async extractDOM(page: Page): Promise<string> {
    return await page.evaluate((): string => {
      const importantAttrs = [
        'id', 'name', 'type', 'data-testid', 'data-test',
        'placeholder', 'class', 'href', 'required',
        'minlength', 'maxlength', 'disabled', 'pattern',
        'role', 'aria-label', 'value', 'for'
      ];

      const importantTags = [
        'input', 'button', 'select', 'textarea',
        'a', 'form', 'label', 'h1', 'h2', 'h3',
        'nav', 'ul', 'li', 'header'
      ];

      const extractElement = (el: Element, depth: number = 0): string => {
        const tag = (el as HTMLElement).tagName.toLowerCase();

        if (!importantTags.includes(tag)) {
          let childResults = '';
          for (const child of Array.from(el.children)) {
            const result = extractElement(child, depth);
            if (result) childResults += result + '\n';  // ← add newline
          }
          return childResults;
        }

        const indent = '  '.repeat(depth);
        const attrs = Array.from(el.attributes)
          .filter((a: Attr) => importantAttrs.includes(a.name))
          .map((a: Attr) => `${a.name}="${a.value}"`)
          .join(' ');

        const text = el.textContent?.trim();
        const inlineText = (text && text.length < 50
          && el.children.length === 0) ? text : '';

        let result = `${indent}<${tag} ${attrs}>${inlineText}`;
        for (const child of Array.from(el.children)) {
          const childResult = extractElement(child, depth + 1);
          if (childResult) result += '\n' + childResult;
        }
        return result;
      };

      return extractElement(document.body);
    });
  }

  // ── Execute a single action on page ──────────────────────
  private async executeAction(page: Page, action: string): Promise<void> {
    const [type, rest] = action.split(':');
    
    if (type === 'click') {
      await page.locator(rest).click();
    } else if (type === 'fill') {
      const [selector, value] = rest.split('=');
      await page.locator(selector).fill(value);
    } else if (type === 'select') {
      const [selector, value] = rest.split('=');
      await page.locator(selector).selectOption(value);
    } else if (type === 'wait') {
      await page.locator(rest).waitFor({ state: 'visible' });
    }
  }

  // ── Capture DOM for ALL pages in navigation plan ──────────
  async captureMultiPageDOM(plan: NavigationPlan): Promise<string> {
    if (!this.config.mcp.playwrightMcpEnabled) {
      return 'DOM snapshot not available — MCP disabled';
    }

    const browser: Browser = await chromium.launch({
      headless: this.config.mcp.headless
    });

    const page: Page = await browser.newPage();
    let fullSnapshot = '';

    try {
      for (const step of plan.pages) {
        fullSnapshot += await this.capturePageDOM(page, step);
      }

      // Take final screenshot
      if (this.config.mcp.screenshotOnSnapshot) {
        const screenshotPath = path.join(this.outputPath, 'snapshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved → ${screenshotPath}`);
      }

    } finally {
      await browser.close();
    }

    return fullSnapshot;
  }

  // ── Capture single page DOM ───────────────────────────────
 private async capturePageDOM(
  page: Page,
  step: NavigationStep
): Promise<string> {
  console.log(`\n🌐 Capturing DOM → ${step.pageName}`);

  // Navigate to URL if specified
  if (step.url === 'USE_BASE_URL') {
    await page.goto(this.config.application.baseUrl, {
      timeout: this.config.mcp.timeout,
      waitUntil: 'networkidle'
    });
  }

  // Execute actions only if page is still navigable
  if (step.actions && step.actions.length > 0) {
    console.log(`   ⚡ Executing ${step.actions.length} actions...`);
    for (const action of step.actions) {
      try {
        await this.executeAction(page, action);
      } catch (err) {
        console.log(`   ⚠️  Action failed: ${action} — skipping`);
      }
    }
    await page.waitForLoadState('networkidle');
  }

  // Wait for page to be ready
  if (step.waitForSelector) {
    try {
      await page.locator(step.waitForSelector).waitFor({
        state: 'visible',
        timeout: 10000
      });
    } catch {
      console.log(`   ⚠️  waitForSelector timeout — continuing anyway`);
    }
  }

  const dom = await this.extractDOM(page);
  console.log(`   ✅ ${step.pageName} DOM captured`);
  return `\n=== PAGE: ${step.pageName} ===\nURL: ${page.url()}\n${dom}\n`;
}
  // ── Parse Claude/Groq response into files ─────────────────
  parseGeneratedFiles(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Pattern 1: Our custom markers === FILE: path ===
    const customMarkerRegex = /=== FILE: (.+?) ===\n([\s\S]*?)=== END FILE ===/g;
    let match;
    while ((match = customMarkerRegex.exec(response)) !== null) {
      files.push({
        filePath: match[1].trim(),
        content: this.cleanContent(match[2].trim())
      });
    }

    // Pattern 2: Groq markdown format // generated/path/file.ts
    if (files.length === 0) {
      const markdownRegex = /```typescript\s*\n\/\/ (generated\/[^\n]+)\n([\s\S]*?)```/g;
      while ((match = markdownRegex.exec(response)) !== null) {
        const filePath = match[1].trim().replace('generated/', '');
        files.push({
          filePath: filePath,
          content: this.cleanContent(match[2].trim())
        });
      }
    }

    return files;
  }

  // ── Strip markdown fences from content ───────────────────
  private cleanContent(content: string): string {
    return content
      .replace(/^```typescript\s*\n?/gm, '')
      .replace(/^```ts\s*\n?/gm, '')
      .replace(/^```\s*\n?/gm, '')
      .trim();
  }

  // ── Write generated files to disk ─────────────────────────
  writeFiles(files: GeneratedFile[]): void {
    console.log(`\n📁 Writing ${files.length} files to ${this.outputPath}/`);

    for (const file of files) {
      const fullPath = path.join(this.outputPath, file.filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(fullPath) && !this.config.output.overwriteExisting) {
        console.log(`⏭️  Skipped (exists) → ${file.filePath}`);
        continue;
      }

      fs.writeFileSync(fullPath, file.content, 'utf-8');
      console.log(`✅ Generated → ${file.filePath}`);
    }
  }
}
