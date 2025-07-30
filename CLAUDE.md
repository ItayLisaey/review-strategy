# PR Review Strategy Generator - Technical Documentation

## Project Overview

This tool analyzes GitHub pull requests and generates an optimal file review order with an interactive dependency visualization. It helps reviewers systematically approach PRs by suggesting which files to review first based on their dependencies and relationships.

## Key Features

1. **Direct PR Analysis** - No main menu, goes straight to analysis
2. **Interactive Visual Dependency Graph** - React-based visualization with vis-network
3. **XDG-Compliant Configuration** - Stores config in `~/.config/pr-review-strategy/config.json`
4. **Dependency-Based File Ordering** - Orders files by type, depth, and relationships
5. **Progress Tracking** - Visual progress bar and checklist for reviewed files

## Architecture

### Directory Structure
```
src/
├── cli/              # CLI entry point and prompts
│   ├── index.ts      # Main entry (direct to PR analysis)
│   └── prompts.ts    # Interactive PR selection
├── core/             # Business logic
│   ├── github.ts     # GitHub API via gh CLI
│   └── analysis.ts   # File ordering algorithm
├── config/           # Configuration management
│   └── index.ts      # XDG-compliant config
├── types/            # TypeScript definitions
│   └── index.ts      # All shared types
├── utils/            # Display utilities
│   └── display.ts    # Minimal CLI output
├── server/           # Visualization servers
│   ├── index.ts      # Express server + HTML generation
│   └── react.ts      # React/Vite dev server
└── web/              # React visualization app
    └── src/
        └── components/   # Graph components
```

## Core Components

### 1. CLI Entry (`src/cli/index.ts`)
- Skips menu, goes directly to PR analysis
- Supports command-line arguments: `--port`, `--no-visual`, `--html`
- Automatically opens browser with visualization
- Handles graceful shutdown with cleanup

### 2. GitHub Integration (`src/core/github.ts`)
- Uses `gh` CLI for all GitHub operations
- Key functions:
  - `fetchPRInfo()` - Gets PR data with pagination
  - `fetchRepos()` - Lists accessible repositories
  - `fetchPRsForRepo()` - Gets open PRs for a repo
  - `parsePRUrl()` - Validates and parses PR URLs

### 3. File Analysis (`src/core/analysis.ts`)
- Orders files by:
  1. Configuration files first
  2. Type definitions
  3. Path depth (base files before nested)
  4. Index files before others in directory
  5. Test files last
  6. Alphabetical as tiebreaker
- Includes AST parsing infrastructure (currently simplified)
- Exports `getDependencyRelationships()` for graph edges

### 4. Visualization Server (`src/server/`)
- Two modes:
  - **HTML mode**: Generates temporary HTML with vis-network
  - **React mode** (default): Starts Vite dev server with React app
- `convertToGraphData()` creates dependency relationships:
  - Index files depend on other files in same directory
  - Subdirectory files depend on parent directory files
  - Test files depend on source files
  - Type/interface dependencies
  - Similar file name relationships

### 5. React Visualization (`src/web/`)
- Modern React app with TypeScript
- Components:
  - `DependencyGraph` - Main graph using vis-network
  - `FileList` - Sidebar with review checklist
  - `FileItem` - Individual file in checklist
  - `ProgressBar` - Visual progress tracking
- Features:
  - Click nodes to zoom and focus
  - Check off reviewed files
  - Progress persistence in localStorage
  - Responsive design

## Important Implementation Details

### Configuration System
- Uses XDG Base Directory spec (not .env files)
- Config location: `~/.config/pr-review-strategy/config.json`
- Stores:
  - `recentPRs`: Array of recently analyzed PR URLs
  - `defaultRepo`: Default repository for quick selection

### Dependency Graph Generation
The graph edges are created based on heuristic rules in `convertToGraphData()`:
```typescript
// Rule examples:
// 1. index.ts depends on all files in same directory
// 2. src/components/Button.tsx depends on src/types/index.ts
// 3. tests/Button.test.tsx depends on src/Button.tsx
```

**Ignored Parent Nodes**: Certain files (like `next.config.js`, `webpack.config.js`, etc.) are automatically detached from their children to prevent them from becoming meaningless root nodes. This list is defined in `IGNORE_PARENT_NODES`.

### File Ordering Algorithm
Simple but effective ordering without actual AST analysis:
```typescript
// Priority order:
1. Config files (.json, .yml, *config*)
2. Type definitions (.d.ts, *types*)
3. Fewer path segments (root files first)
4. Index files before others
5. Test files last
6. Alphabetical
```

### Visual Graph Features
- **Hierarchical Layout**: Parent → child relationships
- **Change Branches**: Each root node starts a color-coded branch
  - 7 distinct colors (blue, emerald, purple, amber, rose, cyan, pink)
  - Colors darken with depth (5 shades per color)
  - Edges inherit their source node's color
- **Interactive**: Click to zoom, drag to pan
- **Progress Tracking**: Checkboxes sync with graph
- **Expandable Sidebar**: Tree view with collapsible children
- **Responsive**: Works on mobile with adjusted layout

## Key Commands

### Development
```bash
bun run dev              # Run in development mode
bun run typecheck        # TypeScript type checking
bun run build            # Build standalone executable
```

### Usage
```bash
# Direct PR analysis with visual
bun run start https://github.com/owner/repo/pull/123

# Interactive mode
bun run start

# Custom port
bun run start <PR-URL> --port 8080

# CLI-only mode (no visual)
bun run start <PR-URL> --no-visual

# Legacy HTML visualization
bun run start <PR-URL> --html
```

## Important Notes

1. **No AI/LLM Integration** - Uses algorithmic approach only
2. **Direct Flow** - No main menu, goes straight to PR selection/analysis
3. **Minimal CLI Output** - Focus is on the visual interface
4. **Automatic Browser Opening** - Uses `open` package to launch browser
5. **Graceful Cleanup** - Removes temporary files on shutdown
6. **Port 49158** - Default port chosen to avoid conflicts

## Common Issues & Solutions

1. **GitHub Authentication**
   - Ensure `gh auth status` works
   - Tool prompts for auth if not authenticated

2. **Port Conflicts**
   - Use `--port` flag to specify different port
   - Default 49158 chosen to minimize conflicts

3. **Large PRs**
   - Uses pagination for GitHub API calls
   - Graph may be complex but still navigable

4. **File Permissions**
   - Config directory created with proper permissions
   - Temporary files cleaned up automatically

## Future Enhancements (Not Implemented)

1. **Real AST Analysis** - Currently uses heuristics, could parse actual imports
2. **Dependency Caching** - Could cache analysis results
3. **Custom Rules** - User-defined ordering preferences
4. **Export Options** - Save review strategy as markdown
5. **Team Features** - Share review progress with team