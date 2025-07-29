#!/usr/bin/env bun

import chalk from "chalk";
import { program } from "commander";
import open from "open";
import os from "os";
import path from "path";
import { loadConfig } from "../config";
import { analyzeWithDependencies } from "../core/analysis";
import { checkGHAuth, fetchPRInfo, parsePRUrl } from "../core/github";
import {
  convertToGraphData,
  createTemporaryHTML,
  startTempServer,
} from "../server";
import { selectPR, setupGHAuth } from "./prompts";

async function main(): Promise<void> {
  try {
    program
      .name("pr-review-strategy")
      .description("Dependency-based GitHub PR review strategy generator")
      .version("2.0.0")
      .argument("[pr-url]", "GitHub PR URL")
      .option("-r, --repo <repo>", "Default repository (owner/repo)")
      .option(
        "-p, --port <port>",
        "Port for visual server (default: 49158)",
        "49158"
      )
      .option("--no-visual", "Skip visual graph, show only CLI output")
      .parse();

    const options = program.opts();

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
      console.error(chalk.red("∎ Invalid PR URL format"));
      process.exit(1);
    }

    // Fetch and analyze
    const { files, title, description } = await fetchPRInfo(prInfo);

    if (files.length === 0) {
      console.log(chalk.yellow("∎ No files found in this PR"));
      process.exit(0);
    }

    console.log(
      chalk.blue(
        `∎ Analyzing ${files.length} files from PR: ${title.substring(0, 60)}${
          title.length > 60 ? "..." : ""
        }`
      )
    );

    const strategy = await analyzeWithDependencies(
      files,
      title,
      description,
      prInfo
    );

    // Show brief summary only
    console.log(chalk.green(`∎ Analysis complete`));
    console.log(chalk.gray(`  Files processed: ${files.length}`));
    console.log(chalk.gray(`  Repository: ${prInfo.owner}/${prInfo.repo}`));
    console.log(chalk.gray(`  PR #${prInfo.number}`));

    // Show visual graph unless disabled
    if (options.visual !== false) {
      console.log(chalk.blue("∎ Generating dependency graph visualization..."));

      try {
        // Create temporary HTML file
        const tempFilePath = path.join(
          os.tmpdir(),
          `pr-graph-${Date.now()}.html`
        );
        const graphData = convertToGraphData(strategy, files, title, prUrl);
        await createTemporaryHTML(graphData, tempFilePath);

        // Start server
        const port = parseInt(options.port);
        const { server, cleanup } = await startTempServer(tempFilePath, port);

        console.log(
          chalk.green(`∎ Visualization available at http://localhost:${port}`)
        );
        console.log(
          chalk.cyan(
            "∎ Browser should open automatically. Press Ctrl+C to shutdown."
          )
        );

        // Optionally open browser
        try {
          await open(`http://localhost:${port}`);
        } catch {
          // Ignore if can't open browser
        }

        // Handle graceful shutdown
        let isShuttingDown = false;
        const shutdownHandler = async () => {
          if (isShuttingDown) return;
          isShuttingDown = true;

          console.log(
            chalk.yellow("∎ Shutting down server and cleaning up...")
          );
          await cleanup();
          console.log(chalk.green("∎ Cleanup complete"));
          process.exit(0);
        };

        process.on("SIGINT", shutdownHandler);
        process.on("SIGTERM", shutdownHandler);

        // Keep process alive
        await new Promise(() => {});
      } catch (error: any) {
        console.error(
          chalk.red("∎ Failed to start visualization:"),
          error.message
        );
        console.log(chalk.yellow("∎ Analysis completed successfully"));
      }
    }
  } catch (error: any) {
    console.error(chalk.red("∎ Error:"), error.message);
    process.exit(1);
  }
}

main();
