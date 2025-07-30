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
}

export const FileNode = memo(({ data }: NodeProps<FileNodeData>) => {
  const { label, path, additions, deletions, childrenCount, isHighlighted } =
    data;

  return (
    <>
      {/* Input handle (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "rgba(160, 174, 192, 0.6)",
          border: "none",
          width: 8,
          height: 8,
        }}
      />

      {/* Node content that matches sidebar FileItem */}
      <div
        className={`
          bg-slate-200/5 border border-slate-200/10 rounded-xl p-3
          backdrop-blur-sm min-w-[140px] max-w-[200px] min-h-[80px]
          transition-all duration-300 cursor-pointer
          hover:bg-slate-200/8 hover:border-slate-200/20 hover:shadow-lg
          ${
            isHighlighted
              ? "bg-green-500/15 border-green-500/40 ring-2 ring-green-500/20 shadow-lg"
              : ""
          }
        `}
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
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
          background: "rgba(160, 174, 192, 0.6)",
          border: "none",
          width: 8,
          height: 8,
        }}
      />
    </>
  );
});

FileNode.displayName = "FileNode";
