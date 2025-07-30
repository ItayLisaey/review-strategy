import express, { type Request, type Response } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type {
  DependencyGraphData,
  FileChange,
  ReviewStrategy,
} from "../types/index.js";

// Re-export the React server function
export { startReactServer } from "./react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DependencyGraphData is now imported from ../types

function calculateChildrenCount(
  nodeId: string,
  edges: Array<{ from: string; to: string }>
): number {
  // Count all descendants (children and their children recursively)
  const visited = new Set<string>();
  const queue = [nodeId];
  visited.add(nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find all direct children (nodes that depend on current node)
    const children = edges
      .filter((edge) => edge.from === current)
      .map((edge) => edge.to)
      .filter((child) => !visited.has(child));

    children.forEach((child) => {
      visited.add(child);
      queue.push(child);
    });
  }

  // Return total descendants count (excluding self)
  return visited.size - 1;
}

export async function createTemporaryHTML(
  graphData: DependencyGraphData,
  tempFilePath: string
): Promise<void> {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dependency Graph</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background: linear-gradient(135deg, #667292 0%, #4a5568 100%);
            min-height: 100vh;
            color: #e2e8f0;
            overflow: hidden;
        }

        .container {
            display: flex;
            height: 100vh;
        }

        .main-area {
            flex: 1;
            position: relative;
            background: 
                radial-gradient(circle at 1px 1px, rgba(226, 232, 240, 0.12) 1px, transparent 0);
            background-size: 20px 20px;
            background-attachment: fixed;
        }

        #network {
            width: 100%;
            height: 100%;
        }

        .main-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            background: 
                radial-gradient(circle at 1px 1px, rgba(226, 232, 240, 0.06) 1px, transparent 0);
            background-size: 40px 40px;
            background-attachment: fixed;
        }

        .sidebar {
            width: 350px;
            background: rgba(45, 55, 72, 0.85);
            backdrop-filter: blur(20px);
            border-left: 1px solid rgba(226, 232, 240, 0.1);
            padding: 24px;
            overflow-y: auto;
            box-shadow: -8px 0 32px rgba(0, 0, 0, 0.2);
        }

        .sidebar::-webkit-scrollbar {
            width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
            background: rgba(226, 232, 240, 0.1);
            border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb {
            background: rgba(226, 232, 240, 0.3);
            border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
            background: rgba(226, 232, 240, 0.5);
        }

        .sidebar-header {
            margin-bottom: 24px;
        }

        .sidebar-title {
            font-size: 18px;
            font-weight: 600;
            color: #e2e8f0;
            margin-bottom: 8px;
        }

        .progress-summary {
            font-size: 14px;
            color: #a0aec0;
            background: rgba(226, 232, 240, 0.05);
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(226, 232, 240, 0.1);
            border-radius: 3px;
            margin: 8px 0;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #81c784, #66bb6a);
            border-radius: 3px;
            transition: width 0.3s ease;
            width: 0%;
        }

        .file-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .file-item {
            background: rgba(226, 232, 240, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.1);
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
            cursor: pointer;
            backdrop-filter: blur(10px);
            min-height: 80px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .file-item:hover {
            background: rgba(226, 232, 240, 0.08);
            border-color: rgba(226, 232, 240, 0.2);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .file-item.checked {
            background: rgba(129, 199, 132, 0.1);
            border-color: rgba(129, 199, 132, 0.3);
        }

        .file-item.highlighted {
            background: rgba(129, 199, 132, 0.15);
            border-color: rgba(129, 199, 132, 0.4);
        }

        .file-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 8px;
        }

        .file-checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(226, 232, 240, 0.3);
            border-radius: 4px;
            background: transparent;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .file-checkbox.checked {
            background: #81c784;
            border-color: #81c784;
        }

        .file-checkbox.checked::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #1a202c;
            font-size: 12px;
            font-weight: 600;
        }

        .file-content {
            flex: 1;
            min-width: 0;
        }

        .file-name {
            font-size: 14px;
            font-weight: 500;
            color: #e2e8f0;
            margin-bottom: 4px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            line-height: 1.3;
        }

        .file-path {
            font-size: 11px;
            color: #a0aec0;
            margin-bottom: 8px;
            opacity: 0.8;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.2;
        }

        .file-stats {
            display: flex;
            gap: 12px;
            font-size: 12px;
            font-weight: 500;
            align-items: center;
        }

        .stat-additions {
            color: #81c784;
        }

        .stat-deletions {
            color: #e57373;
        }

        .children-count {
            color: #a0aec0;
            font-size: 11px;
            margin-left: auto;
        }

        @media (max-width: 1024px) {
            .container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                height: 200px;
                border-left: none;
                border-top: 1px solid rgba(226, 232, 240, 0.1);
                order: 2;
            }
            
            .main-area {
                height: calc(100vh - 200px);
                order: 1;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-area">
            <div class="main-overlay"></div>
            <div id="network"></div>
        </div>
        
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">Files Review</div>
                <div class="progress-summary">
                    <div>Progress: <span id="progress-text">0 / ${
                      graphData.nodes.length
                    }</span></div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
            </div>
            
            <div class="file-list" id="file-list">
                ${graphData.nodes
                  .map(
                    (node) => `
                    <div class="file-item" data-filename="${node.id}">
                        <div class="file-header">
                            <div class="file-checkbox" data-filename="${node.id}"></div>
                            <div class="file-content">
                                <div class="file-name">${node.label}</div>
                                <div class="file-path">${node.path}</div>
                            </div>
                        </div>
                        <div class="file-stats">
                            <span class="stat-additions">+${node.additions}</span>
                            <span class="stat-deletions">-${node.deletions}</span>
                            <span class="children-count">${node.childrenCount} children</span>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    </div>

    <script>
        const graphData = ${JSON.stringify(graphData)};
        let network = null;
        let checkedFiles = new Set();

        function createGraph() {
            const container = document.getElementById('network');
            
            // Create nodes that look like sidebar items (without checkbox)
            const visNodes = graphData.nodes.map(node => {
                return {
                    id: node.id,
                    label: node.label,
                    title: \`\${node.path}\\n+\${node.additions} -\${node.deletions}\\n\${node.childrenCount} children\`,
                    color: {
                        background: 'rgba(226, 232, 240, 0.95)',
                        border: 'rgba(160, 174, 192, 0.8)',
                        highlight: {
                            background: 'rgba(129, 199, 132, 0.95)',
                            border: 'rgba(129, 199, 132, 1)'
                        },
                        hover: {
                            background: 'rgba(226, 232, 240, 1)',
                            border: 'rgba(160, 174, 192, 1)'
                        }
                    },
                    font: {
                        color: '#1a202c',
                        size: 11,
                        face: 'Montserrat',
                        weight: '500'
                    },
                    margin: 15,
                    shape: 'box',
                    widthConstraint: { minimum: 120, maximum: 180 },
                    heightConstraint: { minimum: 70 }
                };
            });
            
            const data = {
                nodes: new vis.DataSet(visNodes),
                edges: new vis.DataSet(graphData.edges.map(edge => ({
                    ...edge,
                    color: {
                        color: 'rgba(160, 174, 192, 0.6)',
                        hover: 'rgba(129, 199, 132, 0.8)',
                        highlight: 'rgba(129, 199, 132, 1)'
                    }
                })))
            };

            const options = {
                nodes: {
                    borderWidth: 2,
                    shadow: {
                        enabled: true,
                        color: 'rgba(0, 0, 0, 0.2)',
                        size: 8,
                        x: 2,
                        y: 2
                    },
                    chosen: {
                        node: function(values, id, selected, hovering) {
                            values.shadow = true;
                            values.shadowColor = 'rgba(129, 199, 132, 0.4)';
                            values.shadowSize = 15;
                        }
                    }
                },
                edges: {
                    width: 2,
                    arrows: { 
                        to: { 
                            enabled: true, 
                            scaleFactor: 0.8 
                        } 
                    },
                    smooth: {
                        enabled: true,
                        type: 'dynamic',
                        roundness: 0.3
                    }
                },
                layout: {
                    hierarchical: {
                        enabled: true,
                        direction: 'UD',
                        sortMethod: 'directed',
                        shakeTowards: 'leaves',
                        levelSeparation: 180,
                        nodeSpacing: 250,
                        treeSpacing: 280,
                        blockShifting: true,
                        edgeMinimization: true,
                        parentCentralization: true
                    }
                },
                physics: {
                    enabled: false
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    zoomView: true,
                    dragView: true
                }
            };

            network = new vis.Network(container, data, options);
            
            // Fit the network to the view
            network.fit();
            
            // Handle node selection with zoom
            network.on("selectNode", function (params) {
                const nodeId = params.nodes[0];
                highlightFileInSidebar(nodeId);
                
                // Zoom to selected node
                network.focus(nodeId, {
                    scale: 1.2,
                    animation: {
                        duration: 600,
                        easingFunction: 'easeInOutQuad'
                    }
                });
            });
        }

        function highlightFileInSidebar(filename) {
            const fileItems = document.querySelectorAll('.file-item');
            fileItems.forEach(item => {
                item.classList.remove('highlighted');
            });

            const targetItem = document.querySelector(\`[data-filename="\${filename}"]\`);
            if (targetItem) {
                targetItem.classList.add('highlighted');
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function updateProgress() {
            const total = graphData.nodes.length;
            const checked = checkedFiles.size;
            const percentage = total > 0 ? (checked / total) * 100 : 0;
            
            document.getElementById('progress-text').textContent = \`\${checked} / \${total}\`;
            document.getElementById('progress-fill').style.width = \`\${percentage}%\`;
        }

        function toggleFileCheck(filename) {
            const checkbox = document.querySelector(\`.file-checkbox[data-filename="\${filename}"]\`);
            const fileItem = document.querySelector(\`.file-item[data-filename="\${filename}"]\`);
            
            if (checkedFiles.has(filename)) {
                checkedFiles.delete(filename);
                checkbox.classList.remove('checked');
                fileItem.classList.remove('checked');
            } else {
                checkedFiles.add(filename);
                checkbox.classList.add('checked');
                fileItem.classList.add('checked');
            }
            
            updateProgress();
        }

        // Initialize event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Checkbox clicks
            document.querySelectorAll('.file-checkbox').forEach(checkbox => {
                checkbox.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const filename = this.dataset.filename;
                    toggleFileCheck(filename);
                });
            });
            
            // File item clicks
            document.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', function() {
                    const filename = this.dataset.filename;
                    if (network) {
                        network.selectNodes([filename]);
                        network.focus(filename, {
                            scale: 1.2,
                            animation: {
                                duration: 600,
                                easingFunction: 'easeInOutQuad'
                            }
                        });
                    }
                });
            });
            
            // Initialize graph
            createGraph();
            updateProgress();
        });
    </script>
</body>
</html>`;

  await fs.writeFile(tempFilePath, htmlContent, "utf-8");
}

export function convertToGraphData(
  strategy: ReviewStrategy,
  files: FileChange[],
  prTitle: string,
  prUrl: string
): DependencyGraphData {
  // Build dependency edges first
  const edges: Array<{ from: string; to: string }> = [];

  files.forEach((file) => {
    const filePath = file.filename;
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));

    files.forEach((otherFile) => {
      if (file.filename === otherFile.filename) return;

      const otherPath = otherFile.filename;
      const otherDir = path.dirname(otherPath);
      const otherName = path.basename(otherPath, path.extname(otherPath));

      // Rule 1: Index files depend on other files in same directory
      if (
        fileName === "index" &&
        fileDir === otherDir &&
        otherName !== "index"
      ) {
        edges.push({ from: otherFile.filename, to: file.filename });
      }

      // Rule 2: Files in subdirectories depend on parent directory files
      if (fileDir.startsWith(otherDir + "/") && otherDir !== fileDir) {
        edges.push({ from: otherFile.filename, to: file.filename });
      }

      // Rule 3: Test files depend on their corresponding source files
      if (
        (fileName.includes("test") || fileName.includes("spec")) &&
        otherName === fileName.replace(/\.(test|spec)/, "")
      ) {
        edges.push({ from: otherFile.filename, to: file.filename });
      }

      // Rule 4: Component files might depend on their types/interfaces
      if (
        (fileName.includes(otherName) && otherName.includes("type")) ||
        otherName.includes("interface")
      ) {
        edges.push({ from: otherFile.filename, to: file.filename });
      }

      // Rule 5: Files with similar names (one might import the other)
      if (
        fileName.includes(otherName) &&
        fileName !== otherName &&
        otherName.length > 3
      ) {
        edges.push({ from: otherFile.filename, to: file.filename });
      }
    });
  });

  // Remove duplicate edges
  const uniqueEdges = edges.filter(
    (edge, index, self) =>
      index === self.findIndex((e) => e.from === edge.from && e.to === edge.to)
  );

  // Create nodes with children count calculation
  const nodes = files.map((file) => {
    const childrenCount = calculateChildrenCount(file.filename, uniqueEdges);

    return {
      id: file.filename,
      label: file.filename.split("/").pop() || file.filename,
      title: `${file.filename}\\nChanges: +${file.additions} -${file.deletions}`,
      additions: file.additions,
      deletions: file.deletions,
      path: file.filename,
      childrenCount,
    };
  });

  // Sort nodes by children count (most children first), then alphabetically
  const sortedNodes = nodes.sort((a, b) => {
    if (a.childrenCount !== b.childrenCount) {
      return b.childrenCount - a.childrenCount; // Higher children count first
    }
    return a.label.localeCompare(b.label); // Alphabetical within same children count
  });

  return {
    nodes: sortedNodes,
    edges: uniqueEdges,
  };
}

export async function startTempServer(
  tempFilePath: string,
  port: number = 49158
): Promise<{ server: any; cleanup: () => Promise<void> }> {
  const app = express();

  app.get("/", (req: Request, res: Response) => {
    res.sendFile(tempFilePath);
  });

  const server = app.listen(port, () => {
    console.log(
      `∎ Dependency graph server running at http://localhost:${port}`
    );
  });

  const cleanup = async () => {
    return new Promise<void>((resolve) => {
      server.close(async () => {
        try {
          await fs.unlink(tempFilePath);
          console.log("∎ Temporary file cleaned up");
        } catch (error) {
          // Ignore cleanup errors
        }
        resolve();
      });
    });
  };

  return { server, cleanup };
}
