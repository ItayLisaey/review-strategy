import { memo } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

interface FileNodeData {
  label: string;
  path: string;
  additions: number;
  deletions: number;
  childrenCount: number;
  isHighlighted: boolean;
  branchColor?: string;
  level?: number;
}

export const FileNode = memo(({ data }: NodeProps<FileNodeData>) => {
  const { label, path, additions, deletions, childrenCount, isHighlighted, branchColor, level } =
    data;

  // Determine opacity based on level (more transparent for deeper levels)
  const nodeOpacity = level !== undefined ? Math.max(0.15, 0.25 - (level * 0.03)) : 0.15;
  const borderOpacity = level !== undefined ? Math.max(0.25, 0.4 - (level * 0.05)) : 0.25;

  return (
    <>
      {/* Input handle (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: branchColor || "rgba(160, 174, 192, 0.6)",
          opacity: 0.8,
          border: "none",
          width: 10,
          height: 10,
        }}
      />

      {/* Node content with branch colors */}
      <div
        className={`
          rounded-xl p-3 backdrop-blur-sm min-w-[140px] max-w-[200px] min-h-[80px]
          transition-all duration-300 cursor-pointer
          ${isHighlighted ? "ring-2 shadow-lg" : ""}
        `}
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          backgroundColor: branchColor ? `${branchColor}${Math.round(nodeOpacity * 255).toString(16).padStart(2, '0')}` : 'rgba(226, 232, 240, 0.05)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: branchColor ? `${branchColor}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}` : 'rgba(226, 232, 240, 0.1)',
          ...(isHighlighted ? {
            borderColor: branchColor || '#10b981',
            boxShadow: `0 0 0 4px ${branchColor || '#10b981'}20`,
          } : {}),
        }}
      >
        {/* File name */}
        <div className="text-xs font-medium text-slate-200 mb-1 break-words">
          {label}
        </div>

        {/* File path */}
        <div className="text-[9px] text-slate-400 opacity-80 mb-2 break-words leading-tight">
          {path}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] font-medium">
          <span className="text-green-400">+{additions}</span>
          <span className="text-red-400">-{deletions}</span>
          <span className="text-slate-400 ml-auto text-[9px]">
            {childrenCount} children
          </span>
        </div>
      </div>

      {/* Output handle (for outgoing edges) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: branchColor || "rgba(160, 174, 192, 0.6)",
          opacity: 0.8,
          border: "none",
          width: 10,
          height: 10,
        }}
      />
    </>
  );
});

FileNode.displayName = "FileNode";
