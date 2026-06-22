import { ConfigLoader } from '../utils/configLoader';
import { ClaudeAgent } from '../agent/claudeAgent';
import { Generator } from '../agent/generator';
import * as fs from 'fs';

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════');
  console.log('  🎭 Playwright AI Test Generator');
  console.log('  Powered by Claude Agent + Playwright MCP');
  console.log('═══════════════════════════════════════════════');

  try {
    // ── Step 1: Load all configs ───────────────────────────
    console.log('\n📋 Step 1: Loading configuration...');
    const config = ConfigLoader.loadAgentConfig();
    const generatorRules = ConfigLoader.loadGeneratorRules();
    const testCases = ConfigLoader.loadTestCases();
    const apiKey = ConfigLoader.resolveApiKey(config);

    console.log(`✅ Provider  : ${config.ai.provider}`);
    console.log(`✅ Model     : ${config.ai.model}`);
    console.log(`✅ App URL   : ${config.application.baseUrl}`);
    console.log(`✅ Pattern   : ${config.output.pattern}`);
    console.log(`✅ Output    : ${config.output.folder}/`);

    const agent = new ClaudeAgent(config, apiKey);
    const generator = new Generator(config);

    // ── Phase 1: Analyse TC → Build navigation plan ────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  📍 PHASE 1: TC Analysis → Navigation Plan');
    console.log('═══════════════════════════════════════════════');

    const navigationPlan = await agent.planNavigation(testCases);

    // ── Phase 2a: Capture DOM of all pages ─────────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  🌐 PHASE 2a: Multi-Page DOM Capture');
    console.log('═══════════════════════════════════════════════');

    const domSnapshots = await generator.captureMultiPageDOM(navigationPlan);

    // Save DOM snapshot for debugging
    fs.writeFileSync('generated/dom-snapshot.txt', domSnapshots, 'utf-8');
    console.log('💾 DOM snapshots saved → generated/dom-snapshot.txt');

    // ── Phase 2b: Generate framework ───────────────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  🤖 PHASE 2b: AI Framework Generation');
    console.log('═══════════════════════════════════════════════');

    const response = await agent.generateFramework(
      testCases,
      generatorRules,
      domSnapshots
    );

    // Save raw response for debugging
    fs.writeFileSync('generated/raw-response.txt', response, 'utf-8');

    // ── Step 4: Parse and write generated files ────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  📁 Writing Generated Files');
    console.log('═══════════════════════════════════════════════');

    const files = generator.parseGeneratedFiles(response);

    if (files.length === 0) {
      console.log('\n⚠️  No files parsed — check generated/raw-response.txt');
    } else {
      generator.writeFiles(files);
    }

    // ── Done ───────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅ Framework generation complete!');
    console.log('  📂 Check your generated/ folder');
    console.log('  ▶️  Run: npx playwright test');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  }
}

main();
