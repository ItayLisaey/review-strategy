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
- 🌐 **Interactive visual dependency graph** with:
  - Color-coded nodes by file type
  - Hierarchical layout showing dependencies
  - Click-to-focus on files
  - Review order sidebar
  - Automatic browser opening
  - Graceful shutdown with cleanup

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

### Direct PR Analysis with Visual Graph

```bash
bun run start <PR-URL>
```

Example:

```bash
bun run start https://github.com/vercel/next.js/pull/59000
```

This will:

1. Show a brief analysis summary in the terminal
2. Generate a temporary HTML file with an interactive dependency graph
3. Start a local server on port 49158 (default)
4. Open the graph in your browser automatically
5. Clean up the temporary file when you press Ctrl+C

The visual interface features:

- **Professional Layout**: Main graph area with right sidebar
- **Smart Ordering**: Files ordered by dependency hierarchy (parents → children), then alphabetical
- **Informative Nodes**: Each node shows filename, path, and +/- line changes
- **Interactive Review**: Click nodes to zoom/focus, check off completed reviews
- **Progress Tracking**: Visual progress bar showing review completion

### Interactive Mode

```bash
bun run start
```

This will prompt you to:

- Browse PRs by repository
- Enter a PR URL manually
- Select from recent PRs

### CLI-Only Mode (No Visual Graph)

```bash
bun run start <PR-URL> --no-visual
```

### Custom Port

```bash
bun run start <PR-URL> --port 8080
```

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
