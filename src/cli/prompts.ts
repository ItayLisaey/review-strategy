import chalk from "chalk";
import { execSync } from "child_process";
import inquirer from "inquirer";
import { saveConfig } from "../config";
import { fetchPRsForRepo, fetchRepos, parsePRUrl } from "../core/github";
import type { Config } from "../types";

export async function setupGHAuth(): Promise<void> {
  console.log(chalk.yellow("\n∎ GitHub CLI Authentication Required\n"));
  console.log(
    "You need to authenticate with GitHub CLI to fetch PR information."
  );

  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: "Would you like to authenticate now?",
      default: true,
    },
  ]);

  if (proceed) {
    console.log(chalk.cyan("\nRunning: gh auth login\n"));
    execSync("gh auth login", { stdio: "inherit" });
  } else {
    throw new Error("GitHub CLI authentication is required to proceed");
  }
}

async function selectRepo(config: Config): Promise<string | null> {
  const repos = await fetchRepos();

  if (repos.length === 0) {
    console.log(chalk.yellow("No accessible repositories found"));
    return null;
  }

  const choices: any[] = [];

  // Add default repo at the top if it exists
  if (config.defaultRepo && repos.includes(config.defaultRepo)) {
    choices.push({
      name: `⭐ ${config.defaultRepo} (default)`,
      value: config.defaultRepo,
    });
    choices.push(new inquirer.Separator());
  }

  // Add all repos
  choices.push(...repos.map((repo) => ({ name: repo, value: repo })));

  const { selectedRepo } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedRepo",
      message: "Select a repository:",
      choices: choices,
      pageSize: 15,
    },
  ]);

  // Always save as default repo
  await saveConfig({ ...config, defaultRepo: selectedRepo });

  return selectedRepo;
}

export async function selectPR(config: Config): Promise<string> {
  console.log(chalk.blue("\n∎ Select a PR to Review\n"));

  let { source } = await inquirer.prompt([
    {
      type: "list",
      name: "source",
      message: "How would you like to select a PR?",
      choices: [
        { name: "∎ Browse PRs by repository", value: "browse" },
        { name: "∎ Enter PR URL manually", value: "manual" },
        {
          name: "∎ Recent PRs",
          value: "recent",
          disabled: !config.recentPRs?.length,
        },
      ],
    },
  ]);

  if (source === "browse") {
    // First, select a repository
    const selectedRepo = await selectRepo(config);
    if (!selectedRepo) {
      return selectPR(config); // Retry if no repo selected
    }

    // Then fetch PRs for that repo
    const openPRs = await fetchPRsForRepo(selectedRepo);

    if (openPRs.length === 0) {
      console.log(chalk.yellow(`No open PRs found in ${selectedRepo}`));
      const { retry } = await inquirer.prompt([
        {
          type: "confirm",
          name: "retry",
          message: "Try another repository?",
          default: true,
        },
      ]);

      if (retry) {
        return selectPR(config);
      }

      // Fall back to manual entry
      source = "manual";
    } else {
      const choices = openPRs.map((pr) => ({
        name: `#${pr.number} - ${pr.title} ${
          pr.isDraft ? chalk.gray("(draft)") : ""
        } by ${pr.author}`,
        value: pr.url,
        short: `#${pr.number}`,
      }));

      const { prUrl } = await inquirer.prompt([
        {
          type: "list",
          name: "prUrl",
          message: `Select a PR from ${selectedRepo}:`,
          choices,
          pageSize: 10,
        },
      ]);

      // Save to recent PRs
      const recentPRs = config.recentPRs || [];
      if (!recentPRs.includes(prUrl)) {
        recentPRs.unshift(prUrl);
        if (recentPRs.length > 10) recentPRs.pop();
        await saveConfig({ ...config, recentPRs });
      }

      return prUrl;
    }
  }

  if (source === "recent" && config.recentPRs?.length) {
    const { prUrl } = await inquirer.prompt([
      {
        type: "list",
        name: "prUrl",
        message: "Select a recent PR:",
        choices: config.recentPRs.map((pr) => ({ name: pr, value: pr })),
      },
    ]);
    return prUrl;
  }

  // Manual entry
  const { prUrl } = await inquirer.prompt([
    {
      type: "input",
      name: "prUrl",
      message: "Enter GitHub PR URL:",
      validate: (input: string) => {
        const parsed = parsePRUrl(input);
        return parsed
          ? true
          : "Invalid PR URL format. Expected: https://github.com/owner/repo/pull/number";
      },
    },
  ]);

  // Save to recent PRs
  const recentPRs = config.recentPRs || [];
  if (!recentPRs.includes(prUrl)) {
    recentPRs.unshift(prUrl);
    if (recentPRs.length > 10) recentPRs.pop();
    await saveConfig({ ...config, recentPRs });
  }

  return prUrl;
}
