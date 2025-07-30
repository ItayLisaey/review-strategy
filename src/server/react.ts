import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { DependencyGraphData } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startReactServer(
  graphData: DependencyGraphData,
  port: number = 49158
): Promise<{ server: any; cleanup: () => Promise<void> }> {
  const webDir = path.join(__dirname, "../web");
  const dataFile = path.join(webDir, "public", "graph-data.json");

  // Write graph data to public directory for React to read
  await fs.writeFile(dataFile, JSON.stringify(graphData, null, 2));

  // Start Vite dev server with custom port
  const viteProcess = spawn(
    "bun",
    ["run", "dev", "--port", port.toString(), "--host"],
    {
      cwd: webDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    }
  );

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("Vite server failed to start within 10 seconds"));
      }
    }, 10000);

    viteProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      if (
        (output.includes("Local:") || output.includes("localhost")) &&
        !resolved
      ) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    viteProcess.stderr?.on("data", (data) => {
      const output = data.toString();
      console.error("Vite stderr:", output);
    });

    viteProcess.on("error", (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(error);
      }
    });

    viteProcess.on("exit", (code) => {
      if (!resolved && code !== 0) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Vite process exited with code ${code}`));
      }
    });
  });

  const cleanup = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Clean up data file
      fs.unlink(dataFile).catch(() => {
        // Ignore cleanup errors
      });

      // Kill the Vite process
      viteProcess.kill("SIGTERM");

      // Force kill if it doesn't respond within 2 seconds
      const forceKillTimeout = setTimeout(() => {
        viteProcess.kill("SIGKILL");
      }, 2000);

      viteProcess.on("close", () => {
        clearTimeout(forceKillTimeout);
        resolve();
      });
    });
  };

  return { server: viteProcess, cleanup };
}
