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
  // Only show root nodes (files without parents) at the top level
  const rootFiles = files.filter(file => !file.parent);
  
  return (
    <div className="space-y-2">
      {rootFiles.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          allFiles={files}
          isChecked={checkedFiles.has(file.id)}
          isHighlighted={file.id === highlightedFile}
          checkedFiles={checkedFiles}
          highlightedFile={highlightedFile}
          onToggleCheck={onToggleCheck}
          onSelect={(fileId) => {
            onFileSelect(fileId);
            // Scroll into view when selected
            setTimeout(() => {
              const element = document.querySelector(
                `[data-filename="${fileId}"]`
              );
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 100);
          }}
          level={0}
        />
      ))}
    </div>
  );
}
