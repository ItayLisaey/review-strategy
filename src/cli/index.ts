#!/usr/bin/env bun

import { program } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../config';
import { checkGHAuth, parsePRUrl, fetchPRInfo } from '../core/github';
import { analyzeWithDependencies } from '../core/analysis';
import { displayReviewStrategy } from '../utils/display';
import { selectPR, setupGHAuth } from './prompts';

async function main(): Promise<void> {
  try {
    program
      .name('pr-review-strategy')
      .description('Dependency-based GitHub PR review strategy generator')
      .version('2.0.0')
      .argument('[pr-url]', 'GitHub PR URL')
      .option('-r, --repo <repo>', 'Default repository (owner/repo)')
      .parse();

    // Check GitHub CLI auth
    if (!(await checkGHAuth())) {
      await setupGHAuth();
    }

    // Get PR URL from command line or prompt
    let prUrl = program.args[0];
    const config = await loadConfig();
    
    if (!prUrl) {
      // No URL provided, show selection prompt
      prUrl = await selectPR(config);
    }

    const prInfo = parsePRUrl(prUrl);
    if (!prInfo) {
      console.error(chalk.red('Invalid PR URL format'));
      process.exit(1);
    }

    // Fetch and analyze
    const { files, title, description } = await fetchPRInfo(prInfo);

    if (files.length === 0) {
      console.log(chalk.yellow('\nNo files found in this PR.'));
      process.exit(0);
    }

    const strategy = await analyzeWithDependencies(files, title, description, prInfo);
    await displayReviewStrategy(strategy, files.length);

  } catch (error: any) {
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
  }
}

main();