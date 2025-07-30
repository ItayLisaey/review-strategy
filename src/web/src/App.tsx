import { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { DependencyGraph } from "./components/DependencyGraph";
import { FileList } from "./components/FileList";
import { ProgressBar } from "./components/ProgressBar";
import type { DependencyGraphData } from "./types";

function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderColor: "hsl(var(--primary))" }}
        ></div>
        <div
          className="text-lg"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Loading dependency graph...
        </div>
      </div>
    </div>
  );
}

function App() {
  const [graphData, setGraphData] = useState<DependencyGraphData | null>(null);
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the data file that CLI generated
    fetch("/graph-data.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load graph data: ${res.status}`);
        }
        return res.json();
      })
      .then(setGraphData)
      .catch((err) => {
        console.error("Failed to load graph data:", err);
        setError(err.message);
      });
  }, []);

  const toggleFileCheck = (filename: string) => {
    const newChecked = new Set(checkedFiles);
    if (newChecked.has(filename)) {
      newChecked.delete(filename);
    } else {
      newChecked.add(filename);
    }
    setCheckedFiles(newChecked);
  };

  const handleFileSelect = (filename: string) => {
    setHighlightedFile(filename);
  };

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="text-center">
          <div
            className="text-lg mb-2"
            style={{ color: "hsl(var(--destructive))" }}
          >
            Error loading dependency graph
          </div>
          <div style={{ color: "hsl(var(--muted-foreground))" }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="flex h-screen font-sans"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 1px 1px, hsl(var(--border) / 0.3) 1px, transparent 0)",
            backgroundSize: "20px 20px",
            backgroundAttachment: "fixed",
          }}
        />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 1px 1px, hsl(var(--border) / 0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
            backgroundAttachment: "fixed",
          }}
        />
        <ReactFlowProvider>
          <DependencyGraph
            data={graphData}
            onNodeSelect={handleFileSelect}
            highlightedFile={highlightedFile}
          />
        </ReactFlowProvider>
      </div>

      {/* Sidebar */}
      <div
        className="w-96 glass-strong border-l p-6 overflow-y-auto shadow-lab-lg"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="mb-6">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Files Review
          </h2>
          
          {/* Branch Summary */}
          <div className="mb-4">
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {(() => {
                const branches = new Set(graphData.nodes.map(n => n.branchId).filter(Boolean));
                return `${branches.size} change branch${branches.size !== 1 ? 'es' : ''} detected`;
              })()}
            </p>
          </div>
          
          <ProgressBar
            current={checkedFiles.size}
            total={graphData.nodes.length}
          />
          
          {/* Controls */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                // Expand all logic - would need to be implemented with state management
                console.log("Expand all");
              }}
              className="text-xs px-3 py-1 rounded-md transition-colors"
              style={{
                backgroundColor: "hsl(var(--secondary) / 0.2)",
                color: "hsl(var(--secondary-foreground))",
              }}
            >
              Expand All
            </button>
            <button
              onClick={() => {
                // Collapse all logic
                console.log("Collapse all");
              }}
              className="text-xs px-3 py-1 rounded-md transition-colors"
              style={{
                backgroundColor: "hsl(var(--secondary) / 0.2)",
                color: "hsl(var(--secondary-foreground))",
              }}
            >
              Collapse All
            </button>
          </div>
        </div>

        <FileList
          files={graphData.nodes}
          checkedFiles={checkedFiles}
          highlightedFile={highlightedFile}
          onToggleCheck={toggleFileCheck}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
}

export default App;
