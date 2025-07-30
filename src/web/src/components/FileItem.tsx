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
        bg-slate-200/5 border border-slate-200/10 rounded-xl p-4 
        transition-all duration-300 cursor-pointer backdrop-blur-sm
        hover:bg-slate-200/8 hover:border-slate-200/20 hover:-translate-y-0.5
        hover:shadow-lg min-h-[80px] flex flex-col justify-between
        ${isChecked ? "bg-green-500/10 border-green-500/30" : ""}
        ${
          isHighlighted
            ? "bg-green-500/15 border-green-500/40 ring-2 ring-green-500/20"
            : ""
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-200 flex-shrink-0 mt-0.5
            ${
              isChecked
                ? "bg-green-500 border-green-500"
                : "border-slate-200/30 hover:border-slate-200/50"
            }
          `}
        >
          {isChecked && <CheckIcon className="w-3 h-3 text-slate-900" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 mb-1 break-words">
            {file.label}
          </div>
          <div className="text-xs text-slate-400 opacity-80 break-words leading-tight">
            {file.path}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium">
        <span className="text-green-400">+{file.additions}</span>
        <span className="text-red-400">-{file.deletions}</span>
        <span className="text-slate-400 ml-auto">
          {file.childrenCount} children
        </span>
      </div>
    </div>
  );
}
