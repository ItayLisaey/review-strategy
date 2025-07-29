import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import type { PRInfo, FileChange, OpenPRMinimal } from '../types';

export function checkGHAuth(): boolean {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function parsePRUrl(url: string): PRInfo | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    if (pathParts.length < 4 || pathParts[2] !== 'pull') {
      return null;
    }

    return {
      owner: pathParts[0],
      repo: pathParts[1],
      number: pathParts[3],
    };
  } catch {
    return null;
  }
}

export async function fetchPRInfo(
  prInfo: PRInfo
): Promise<{ files: FileChange[]; title: string; description: string }> {
  const spinner = ora('Fetching PR information...').start();

  try {
    // Use gh api command for more control
    const cmd = `gh api repos/${prInfo.owner}/${prInfo.repo}/pulls/${prInfo.number}`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    const prData = JSON.parse(result);
    
    // Fetch files separately with pagination support
    const filesCmd = `gh api repos/${prInfo.owner}/${prInfo.repo}/pulls/${prInfo.number}/files --paginate`;
    const filesResult = execSync(filesCmd, { encoding: 'utf-8' });
    const filesData = JSON.parse(filesResult);

    spinner.succeed('PR information fetched successfully');
    
    console.log(chalk.gray(`\nFound ${filesData.length} files in PR`));
    
    // Map the files to our expected format
    const files: FileChange[] = filesData.map((file: any) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch
    }));
    
    // Validate the mapped data
    const firstFile = files[0];
    if (firstFile && !firstFile.filename) {
      console.error(chalk.red('\nError: Failed to map file data correctly'));
      console.error(chalk.gray('Raw file data:'), JSON.stringify(filesData[0], null, 2));
    }
    
    return {
      files,
      title: prData.title || 'No title',
      description: prData.body || 'No description',
    };
  } catch (error) {
    spinner.fail('Failed to fetch PR information');
    throw error;
  }
}

export async function fetchRepos(): Promise<string[]> {
  const spinner = ora('Fetching accessible repositories...').start();

  try {
    // Get all repos the user has access to
    const reposCmd =
      'gh repo list --limit 1000 --json nameWithOwner --jq ".[].nameWithOwner"';
    const reposResult = execSync(reposCmd, { encoding: 'utf-8' });
    const repos = reposResult.trim().split('\n').filter(Boolean);

    // Also try to get repos from organizations
    try {
      const orgsCmd = 'gh api user/orgs --jq ".[].login" 2>/dev/null';
      const orgsResult = execSync(orgsCmd, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      const orgs = orgsResult.split('\n').filter(Boolean);

      for (const org of orgs) {
        try {
          const orgReposCmd = `gh repo list ${org} --limit 100 --json nameWithOwner --jq ".[].nameWithOwner"`;
          const orgReposResult = execSync(orgReposCmd, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          const orgRepos = orgReposResult.trim().split('\n').filter(Boolean);
          repos.push(...orgRepos);
        } catch {
          // Skip if we can't access org repos
        }
      }
    } catch {
      // Continue if orgs fetch fails
    }

    // Remove duplicates and sort
    const uniqueRepos = Array.from(new Set(repos)).sort();

    spinner.succeed(`Found ${uniqueRepos.length} accessible repositories`);
    return uniqueRepos;
  } catch (error) {
    spinner.fail('Failed to fetch repositories');
    console.error(chalk.red('Make sure you\'re authenticated with gh CLI'));
    return [];
  }
}

export async function fetchPRsForRepo(repo: string): Promise<OpenPRMinimal[]> {
  const spinner = ora(`Fetching open PRs from ${repo}...`).start();

  try {
    const prCmd = `gh pr list --repo ${repo} --state open --json number,title,url,author,isDraft,createdAt --limit 100`;
    const prResult = execSync(prCmd, { encoding: 'utf-8' });
    const prs = JSON.parse(prResult);

    const prList: OpenPRMinimal[] = prs.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      url: pr.url,
      author: pr.author.login,
      repo: repo,
      isDraft: pr.isDraft,
    }));

    spinner.succeed(`Found ${prList.length} open PRs in ${repo}`);
    return prList;
  } catch (error) {
    spinner.fail(`Failed to fetch PRs from ${repo}`);
    return [];
  }
}

// Fetch file content from GitHub
export async function fetchFileContent(prInfo: PRInfo, filename: string): Promise<string | null> {
  try {
    const cmd = `gh api repos/${prInfo.owner}/${prInfo.repo}/contents/${filename}?ref=refs/pull/${prInfo.number}/head --jq '.content' | base64 -d`;
    const content = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    return content;
  } catch {
    return null;
  }
}