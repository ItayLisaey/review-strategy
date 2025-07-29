# PR Review Strategy Generator

A CLI tool that analyzes GitHub pull requests and generates an optimal file review order based on file types and structure. The tool helps reviewers approach PRs systematically by suggesting which files to review first.

## Features

- 🔍 Fetches PR information using GitHub CLI
- 📊 Orders files intelligently based on:
  - Configuration files first
  - Type definitions early
  - File depth (base files before nested)
  - Index files before others in same directory
  - Test files last
- 🎯 Generates review flags based on file patterns
- 💾 Saves recent PRs and default repository for quick access

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd review-strategy

# Install dependencies
bun install
```

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [GitHub CLI](https://cli.github.com/) authenticated with `gh auth login`

## Usage

### Direct PR Analysis
```bash
bun run start <PR-URL>
```

Example:
```bash
bun run start https://github.com/vercel/next.js/pull/59000
```

### Interactive Mode
```bash
bun run start
```

This will prompt you to:
- Browse PRs by repository
- Enter a PR URL manually
- Select from recent PRs

## Configuration

The tool stores configuration in `~/.config/pr-review-strategy/config.json` following the XDG Base Directory specification.

Configuration includes:
- `recentPRs`: List of recently analyzed PRs
- `defaultRepo`: Default repository for quick PR selection

The config directory is automatically created when needed.

## File Ordering Logic

Files are ordered based on:

1. **Configuration files** - JSON, YAML, config files reviewed first
2. **Type definitions** - TypeScript declaration files (.d.ts)
3. **Path depth** - Root files before deeply nested files
4. **Index files** - Entry points before other files in directory
5. **Test files** - Test and spec files reviewed last
6. **Alphabetical** - Final tiebreaker

## Project Structure

```
src/
├── cli/          # CLI entry point and interactive prompts
├── core/         # Core logic (GitHub API, analysis)
├── config/       # Configuration management
├── types/        # TypeScript type definitions
└── utils/        # Display and formatting utilities
```

## Development

### Type Checking
```bash
bun run typecheck
```

### Development Mode
```bash
bun run dev
```

### Build Executable
```bash
bun run build
```

This creates a standalone executable that can be run without Bun.

## License

MIT