import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AIConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  apiKeyEnvVar: string;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface AppConfig {
  baseUrl: string;
  environment: string;
  authRequired: boolean;
  credentials: Credentials;
}

export interface MCPConfig {
  playwrightMcpEnabled: boolean;
  browser: string;
  headless: boolean;
  timeout: number;
  screenshotOnSnapshot: boolean;
}

export interface OutputConfig {
  folder: string;
  language: string;
  pattern: string;
  overwriteExisting: boolean;
}

export interface GenerationConfig {
  generateBasePage: boolean;
  generateUtils: boolean;
  generateConfig: boolean;
  inferValidationsFromDOM: boolean;
  generateNegativeTests: boolean;
  generateEdgeCases: boolean;
}

export interface AgentConfig {
  ai: AIConfig;
  application: AppConfig;
  mcp: MCPConfig;
  output: OutputConfig;
  generation: GenerationConfig;
}

// Navigation plan returned by Phase 1 API call
export interface NavigationStep {
  pageName: string;
  url: string;
  actions: string[];
  waitForSelector?: string;
}

export interface NavigationPlan {
  pages: NavigationStep[];
}

export class ConfigLoader {

  private static configPath = path.resolve(__dirname, '../../input/agent.config.json');
  private static generatorMdPath = path.resolve(__dirname, '../../mcp-config/generator.md');
  private static testCasesPath = path.resolve(__dirname, '../../input/testcases.md');

  static loadAgentConfig(): AgentConfig {
    const raw = fs.readFileSync(this.configPath, 'utf-8');
    return JSON.parse(raw) as AgentConfig;
  }

  static loadGeneratorRules(): string {
    return fs.readFileSync(this.generatorMdPath, 'utf-8');
  }

  static loadTestCases(): string {
    return fs.readFileSync(this.testCasesPath, 'utf-8');
  }

  static resolveApiKey(config: AgentConfig): string {
    const key = process.env[config.ai.apiKeyEnvVar];
    if (!key) {
      throw new Error(
        `API key not found. Set ${config.ai.apiKeyEnvVar} in your .env file`
      );
    }
    return key;
  }

  static getOutputPath(config: AgentConfig): string {
    return path.resolve(__dirname, '../../', config.output.folder);
  }
}
