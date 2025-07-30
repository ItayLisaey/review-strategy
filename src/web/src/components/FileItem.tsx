import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import type { GraphNode } from "../types";

interface Props {
  file: GraphNode;
  allFiles: GraphNode[];
  isChecked: boolean;
  isHighlighted: boolean;
  checkedFiles: Set<string>;
  highlightedFile?: string | null;
  onToggleCheck: (fileId: string) => void;
  onSelect: (fileId: string) => void;
  level?: number;
}

export function FileItem({
  file,
  allFiles,
  isChecked,
  isHighlighted,
  checkedFiles,
  highlightedFile,
  onToggleCheck,
  onSelect,
  level = 0,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = file.children && file.children.length > 0;
  
  // Get child files
  const childFiles = file.children?.map(childId => 
    allFiles.find(f => f.id === childId)
  ).filter(Boolean) as GraphNode[] || [];
  
  // Determine branch color opacity based on level
  const bgOpacity = Math.max(0.05, 0.15 - (level * 0.02));
  const borderOpacity = Math.max(0.15, 0.3 - (level * 0.03));
  
  return (
    <div>
      <div
        data-filename={file.id}
        className={`
          rounded-xl p-4 mb-2
          transition-all duration-300 cursor-pointer
          hover:-translate-y-0.5 hover:shadow-lg
          min-h-[80px] flex flex-col justify-between
          ${isChecked ? "ring-2" : ""}
          ${isHighlighted ? "ring-2 shadow-lg" : ""}
        `}
        style={{
          backgroundColor: file.branchColor 
            ? `${file.branchColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`
            : "hsl(var(--secondary) / 0.1)",
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: file.branchColor 
            ? `${file.branchColor}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`
            : "hsl(var(--border))",
          marginLeft: `${level * 20}px`,
          ...(isHighlighted ? {
            borderColor: file.branchColor || "hsl(var(--ring))",
            boxShadow: `0 0 0 4px ${file.branchColor || 'hsl(var(--ring))'}20`,
          } : {}),
          ...(isChecked ? {
            backgroundColor: file.branchColor 
              ? `${file.branchColor}${Math.round(bgOpacity * 2 * 255).toString(16).padStart(2, '0')}`
              : "hsl(var(--accent) / 0.2)",
          } : {}),
        }}
        onClick={() => onSelect(file.id)}
      >
        <div className="flex items-start gap-3 mb-2">
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-5 h-5 flex items-center justify-center transition-transform duration-200 flex-shrink-0 mt-0.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCheck(file.id);
            }}
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5"
            style={{
              backgroundColor: isChecked ? file.branchColor || "hsl(var(--primary))" : "transparent",
              borderColor: isChecked
                ? file.branchColor || "hsl(var(--primary))"
                : "hsl(var(--border))",
              marginLeft: hasChildren ? 0 : "24px", // Align checkboxes
            }}
          >
            {isChecked && (
              <CheckIcon
                className="w-3 h-3"
                style={{ color: "hsl(var(--primary-foreground))" }}
              />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-medium mb-1 break-words"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {file.label}
            </div>
            <div
              className="text-xs opacity-80 break-words leading-tight"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {file.path}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <span style={{ color: "hsl(142 75% 65%)" }}>+{file.additions}</span>
          <span style={{ color: "hsl(var(--destructive))" }}>
            -{file.deletions}
          </span>
          <span
            className="ml-auto text-[10px]"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {file.level !== undefined && `L${file.level} · `}
            {file.childrenCount} children
          </span>
        </div>
      </div>
      
      {/* Render children when expanded */}
      {isExpanded && childFiles.length > 0 && (
        <div className="ml-2">
          {childFiles.map((childFile) => (
            <FileItem
              key={childFile.id}
              file={childFile}
              allFiles={allFiles}
              isChecked={checkedFiles.has(childFile.id)}
              isHighlighted={childFile.id === highlightedFile}
              checkedFiles={checkedFiles}
              highlightedFile={highlightedFile}
              onToggleCheck={onToggleCheck}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}