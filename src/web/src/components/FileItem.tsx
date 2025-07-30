import { CheckIcon } from "@heroicons/react/24/solid";
import type { GraphNode } from "../types";

interface Props {
  file: GraphNode;
  isChecked: boolean;
  isHighlighted: boolean;
  onToggleCheck: () => void;
  onSelect: () => void;
}

export function FileItem({
  file,
  isChecked,
  isHighlighted,
  onToggleCheck,
  onSelect,
}: Props) {
  return (
    <div
      data-filename={file.id}
      className={`
        glass rounded-xl p-4 
        transition-all duration-300 cursor-pointer
        hover:-translate-y-0.5 hover:shadow-lab
        min-h-[80px] flex flex-col justify-between
        ${isChecked ? "ring-2" : ""}
        ${isHighlighted ? "ring-2" : ""}
      `}
      style={
        {
          backgroundColor: isChecked
            ? "hsl(var(--accent))"
            : isHighlighted
            ? "hsl(var(--secondary))"
            : undefined,
          borderColor: isChecked
            ? "hsl(var(--ring))"
            : isHighlighted
            ? "hsl(var(--ring))"
            : undefined,
          "--tw-ring-color": "hsl(var(--ring) / 0.3)",
        } as React.CSSProperties
      }
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5"
          style={{
            backgroundColor: isChecked ? "hsl(var(--primary))" : "transparent",
            borderColor: isChecked
              ? "hsl(var(--primary))"
              : "hsl(var(--border))",
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
          className="ml-auto"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {file.childrenCount} children
        </span>
      </div>
    </div>
  );
}
