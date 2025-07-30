import type { GraphNode } from "../types";
import { FileItem } from "./FileItem";

interface Props {
  files: GraphNode[];
  checkedFiles: Set<string>;
  highlightedFile: string | null;
  onToggleCheck: (filename: string) => void;
  onFileSelect: (filename: string) => void;
}

export function FileList({
  files,
  checkedFiles,
  highlightedFile,
  onToggleCheck,
  onFileSelect,
}: Props) {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          isChecked={checkedFiles.has(file.id)}
          isHighlighted={file.id === highlightedFile}
          onToggleCheck={() => onToggleCheck(file.id)}
          onSelect={() => {
            onFileSelect(file.id);
            // Scroll into view when selected
            setTimeout(() => {
              const element = document.querySelector(
                `[data-filename="${file.id}"]`
              );
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 100);
          }}
        />
      ))}
    </div>
  );
}
