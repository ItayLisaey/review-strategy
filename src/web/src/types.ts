// Types shared between CLI and React app
export interface GraphNode {
  id: string;
  label: string;
  title: string;
  additions: number;
  deletions: number;
  path: string;
  childrenCount: number;
  // Branch information
  branchId?: string;
  branchColor?: string;
  level?: number;
  children?: string[];
  parent?: string | null;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Re-export types from the main app for consistency
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
