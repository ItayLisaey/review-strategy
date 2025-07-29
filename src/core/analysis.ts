import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as graphlib from 'graphlib';
import ora from 'ora';
import type { FileChange, PRInfo, ReviewStrategy } from '../types';

// Parse JavaScript/TypeScript file to extract imports
function parseFileForImports(content: string, filename: string): string[] {
  const imports: string[] = [];
  
  try {
    // Skip if not JS/TS file
    if (!filename.match(/\.(js|jsx|ts|tsx|mjs|cjs)$/)) {
      return imports;
    }
    
    const ast = parser.parse(content, {
      sourceType: 'unambiguous',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
      errorRecovery: true,
    });
    
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (source.startsWith('.')) {
          // Relative import - normalize it
          const dir = filename.substring(0, filename.lastIndexOf('/'));
          const normalizedPath = normalizePath(dir, source);
          imports.push(normalizedPath);
        }
      },
      CallExpression(path) {
        // Handle require() calls
        if (
          path.node.callee.type === 'Identifier' &&
          path.node.callee.name === 'require' &&
          path.node.arguments.length > 0 &&
          path.node.arguments[0].type === 'StringLiteral'
        ) {
          const source = path.node.arguments[0].value;
          if (source.startsWith('.')) {
            const dir = filename.substring(0, filename.lastIndexOf('/'));
            const normalizedPath = normalizePath(dir, source);
            imports.push(normalizedPath);
          }
        }
      },
    });
  } catch (error) {
    // Silently ignore parse errors
  }
  
  return [...new Set(imports)]; // Remove duplicates
}

// Normalize relative path to absolute path within the project
function normalizePath(fromDir: string, relativePath: string): string {
  const parts = fromDir.split('/').filter(Boolean);
  const relParts = relativePath.split('/').filter(Boolean);
  
  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }
  
  let result = parts.join('/');
  
  // Add common file extensions if missing
  if (!result.includes('.')) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    for (const ext of extensions) {
      // We'll check if the file exists later
      return result + ext;
    }
  }
  
  return result;
}

// Build dependency graph from files
function buildDependencyGraph(files: FileChange[], fileContents: Map<string, string>): graphlib.Graph {
  const graph = new graphlib.Graph();
  
  // Add all files as nodes
  files.forEach(file => {
    graph.setNode(file.filename);
  });
  
  // Parse each file and add edges for dependencies
  files.forEach(file => {
    const content = fileContents.get(file.filename);
    if (content) {
      const imports = parseFileForImports(content, file.filename);
      
      imports.forEach(importPath => {
        // Check if the imported file is in our changeset
        const matchingFile = files.find(f => {
          // Direct match
          if (f.filename === importPath) return true;
          
          // Match without extension
          const withoutExt = importPath.replace(/\.[^.]+$/, '');
          const fWithoutExt = f.filename.replace(/\.[^.]+$/, '');
          return fWithoutExt === withoutExt;
        });
        
        if (matchingFile) {
          // Add edge from imported file to current file
          // This means: matchingFile must be reviewed before file.filename
          graph.setEdge(matchingFile.filename, file.filename);
        }
      });
    }
  });
  
  return graph;
}

// Create review strategy based on dependency analysis
export async function analyzeWithDependencies(
  files: FileChange[],
  prTitle: string,
  prDescription: string,
  prInfo?: PRInfo
): Promise<ReviewStrategy> {
  const spinner = ora('Analyzing file dependencies...').start();
  
  try {
    // For simple implementation, just order files by type and name
    const fileContents = new Map<string, string>();
    
    // Skip fetching contents for now - just do simple ordering
    spinner.text = 'Ordering files...';
    
    // Simple file ordering based on type and path depth
    const sortedFiles = [...files].sort((a, b) => {
      // 1. Config files first
      const aIsConfig = a.filename.includes('config') || a.filename.endsWith('.json') || a.filename.endsWith('.yml');
      const bIsConfig = b.filename.includes('config') || b.filename.endsWith('.json') || b.filename.endsWith('.yml');
      if (aIsConfig && !bIsConfig) return -1;
      if (!aIsConfig && bIsConfig) return 1;
      
      // 2. Type definitions
      const aIsTypes = a.filename.includes('.d.ts') || a.filename.includes('types');
      const bIsTypes = b.filename.includes('.d.ts') || b.filename.includes('types');
      if (aIsTypes && !bIsTypes) return -1;
      if (!aIsTypes && bIsTypes) return 1;
      
      // 3. Base/core files (fewer path segments = more base)
      const aDepth = a.filename.split('/').length;
      const bDepth = b.filename.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      
      // 4. Index files before others in same directory
      const aIsIndex = a.filename.includes('index.');
      const bIsIndex = b.filename.includes('index.');
      if (aIsIndex && !bIsIndex) return -1;
      if (!aIsIndex && bIsIndex) return 1;
      
      // 5. Tests last
      const aIsTest = a.filename.includes('test') || a.filename.includes('spec');
      const bIsTest = b.filename.includes('test') || b.filename.includes('spec');
      if (aIsTest && !bIsTest) return 1;
      if (!aIsTest && bIsTest) return -1;
      
      // 6. Alphabetical
      return a.filename.localeCompare(b.filename);
    });
    
    // Create review order with simplified reasons
    const reviewOrder = sortedFiles.map(file => {
      let reason = 'Standard file';
      
      if (file.filename.includes('config') || file.filename.endsWith('.json')) {
        reason = 'Configuration file - review for breaking changes';
      } else if (file.filename.includes('.d.ts') || file.filename.includes('types')) {
        reason = 'Type definitions - check interface changes';
      } else if (file.filename.includes('index.')) {
        reason = 'Module entry point';
      } else if (file.filename.includes('test') || file.filename.includes('spec')) {
        reason = 'Test file - verify coverage';
      } else if (file.filename.split('/').length <= 2) {
        reason = 'Root-level file - likely core functionality';
      }
      
      return {
        filename: file.filename,
        reason,
        dependencies: [],
        dependents: [],
      };
    });
    
    // Generate review flags based on file patterns
    const reviewFlags = [];
    
    if (files.some(f => f.filename.includes('test') || f.filename.includes('spec'))) {
      reviewFlags.push({
        flag: 'Test Coverage',
        description: 'Ensure new/modified code has appropriate test coverage',
      });
    }
    
    if (files.some(f => f.filename.includes('config') || f.filename.includes('.json'))) {
      reviewFlags.push({
        flag: 'Configuration Changes',
        description: 'Verify configuration changes won\'t break existing functionality',
      });
    }
    
    if (files.some(f => f.filename.match(/\.(ts|tsx)$/))) {
      reviewFlags.push({
        flag: 'Type Safety',
        description: 'Check TypeScript types are properly defined and used',
      });
    }
    
    spinner.succeed('Dependency analysis complete');
    
    return {
      reviewOrder,
      reviewFlags,
    };
  } catch (error) {
    spinner.fail('Dependency analysis failed');
    throw error;
  }
}