import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Config } from "../types/index.js";

// Get config directory path following XDG Base Directory spec
export function getConfigDir(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return join(xdgConfigHome, "pr-review-strategy");
  }
  return join(homedir(), ".config", "pr-review-strategy");
}

// Get config file path
export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export async function loadConfig(): Promise<Config> {
  try {
    const configPath = getConfigPath();
    const configData = await fs.readFile(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (error) {
    // Return default config if file doesn't exist
    return {
      recentPRs: [],
      defaultRepo: undefined,
    };
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  // Ensure config directory exists
  await fs.mkdir(configDir, { recursive: true });

  // Write config file
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}
