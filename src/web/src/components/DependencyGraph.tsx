import { useCallback, useEffect, useMemo } from "react";
import type { Edge, EdgeChange, Node, NodeChange } from "reactflow";
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { DependencyGraphData } from "../types";
import { getLayoutedElements } from "../utils/layout";
import { FileNode } from "./FileNode";

interface Props {
  data: DependencyGraphData;
  onNodeSelect: (nodeId: string) => void;
  highlightedFile: string | null;
}

const nodeTypes = {
  fileNode: FileNode,
};

export function DependencyGraph({
  data,
  onNodeSelect,
  highlightedFile,
}: Props) {
  const { fitView } = useReactFlow();
  // Convert data to React Flow format with automatic layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = data.nodes.map((node, index) => ({
      id: node.id,
      type: "fileNode",
      position: { x: 0, y: 0 }, // Will be auto-positioned by dagre
      data: {
        label: node.label,
        path: node.path,
        additions: node.additions,
        deletions: node.deletions,
        childrenCount: node.childrenCount,
        isHighlighted: node.id === highlightedFile,
      },
    }));

    const edges: Edge[] = data.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      type: "smoothstep",
      style: {
        stroke: "rgba(160, 174, 192, 0.6)",
        strokeWidth: 2,
      },
      animated: false,
    }));

    // Apply automatic layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "TB" // Top to bottom layout
    );

    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [data, highlightedFile]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Update nodes when highlightedFile changes and focus on highlighted node
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.id === highlightedFile,
        },
      }))
    );

    // Focus on the highlighted node when selected from sidebar
    if (highlightedFile) {
      setTimeout(() => {
        fitView({
          nodes: [{ id: highlightedFile }],
          duration: 600,
          padding: 0.3,
          minZoom: 0.8,
          maxZoom: 1.2,
        });
      }, 100);
    }
  }, [highlightedFile, setNodes, fitView]);

  // Handle node selection with focus
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);

      // Focus on the clicked node with stable zoom
      setTimeout(() => {
        fitView({
          nodes: [{ id: node.id }],
          duration: 600,
          padding: 0.3,
          minZoom: 0.8,
          maxZoom: 1.2,
        });
      }, 100);
    },
    [onNodeSelect, fitView]
  );

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    onNodeSelect("");
  }, [onNodeSelect]);

  // Custom node change handler to prevent dragging
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Filter out position changes to prevent dragging
      const filteredChanges = changes.filter(
        (change) => change.type !== "position"
      );
      setNodes((nds) => applyNodeChanges(filteredChanges, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 2,
        }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        className="bg-transparent"
      >
        <Background color="rgba(226, 232, 240, 0.1)" gap={20} size={1} />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          className="bg-slate-800/50 border border-slate-200/10"
        />
      </ReactFlow>
    </div>
  );
}
