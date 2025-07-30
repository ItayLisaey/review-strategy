export interface Config {
  recentPRs?: string[];
  defaultRepo?: string;
}

export interface PRInfo {
  owner: string;
  repo: string;
  number: string;
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface ReviewStrategy {
  reviewOrder: Array<{
    filename: string;
    reason: string;
    dependencies: string[];
    dependents: string[];
  }>;
  reviewFlags: Array<{
    flag: string;
    description: string;
  }>;
}

export interface FileDependencyInfo {
  filename: string;
  imports: string[];
  exports: string[];
  fileType: "typescript" | "javascript" | "json" | "css" | "other";
  isTest: boolean;
  isConfig: boolean;
}

export interface OpenPRMinimal {
  number: number;
  title: string;
  url: string;
  author: string;
  repo: string;
  isDraft: boolean;
}

// Types for the dependency graph visualization
export interface DependencyGraphData {
  nodes: Array<{
    id: string;
    label: string;
    title: string;
    additions: number;
    deletions: number;
    path: string;
    childrenCount: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
}
