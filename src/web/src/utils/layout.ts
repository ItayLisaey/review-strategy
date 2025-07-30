import dagre from "dagre";
import type { Edge, Node } from "reactflow";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const isHorizontal = direction === "LR";
  
  // Group nodes by branch for better layout
  const nodesByBranch = new Map<string, Node[]>();
  nodes.forEach(node => {
    const branchId = node.data.branchId || 'default';
    if (!nodesByBranch.has(branchId)) {
      nodesByBranch.set(branchId, []);
    }
    nodesByBranch.get(branchId)!.push(node);
  });
  
  // Configure dagre with more spacing between branches
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,     // Increased horizontal spacing
    ranksep: 120,    // Increased vertical spacing
    marginx: 50,
    marginy: 50,
    ranker: 'tight-tree', // Better for tree-like structures
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 180,
      height: 90,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode: Node = {
      ...node,
      position: {
        x: nodeWithPosition.x - 90, // Center the node
        y: nodeWithPosition.y - 45, // Center the node
      },
    };

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};
