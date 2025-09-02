import fs from "fs";
import path from "path";
import os from "os";
import { DEFAULT_CONFIG } from "../config/config.js";

const CONFIG_DIR = path.join(os.homedir(), ".chess-arena");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export class PersistenceManager {
  constructor() {
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
    } catch (error) {
      console.warn(
        "Warning: Could not create config directory:",
        error.message
      );
    }
  }

  loadUserConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readFileSync(CONFIG_FILE, "utf8");
        const userConfig = JSON.parse(configData);

        return { ...DEFAULT_CONFIG, ...userConfig };
      }
    } catch (error) {
      console.warn("Warning: Could not load user config:", error.message);
    }

    return { ...DEFAULT_CONFIG };
  }

  saveUserConfig(config) {
    try {
      const configData = JSON.stringify(config, null, 2);
      fs.writeFileSync(CONFIG_FILE, configData, "utf8");
      return true;
    } catch (error) {
      console.warn("Warning: Could not save user config:", error.message);
      return false;
    }
  }

  saveThemePreference(themeName) {
    const config = this.loadUserConfig();
    config.theme = themeName;
    config.lastUpdated = new Date().toISOString();
    return this.saveUserConfig(config);
  }

  getThemePreference() {
    const config = this.loadUserConfig();
    return config.theme || DEFAULT_CONFIG.theme;
  }

  saveServerUrl(serverUrl) {
    const config = this.loadUserConfig();
    config.serverUrl = serverUrl;
    config.lastUpdated = new Date().toISOString();
    return this.saveUserConfig(config);
  }

  getConfigPath() {
    return CONFIG_FILE;
  }

  resetToDefaults() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      return true;
    } catch (error) {
      console.warn("Warning: Could not reset config:", error.message);
      return false;
    }
  }

  getConfigStats() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const stats = fs.statSync(CONFIG_FILE);
        const config = this.loadUserConfig();

        return {
          exists: true,
          created: stats.birthtime,
          modified: stats.mtime,
          lastUpdated: config.lastUpdated,
          currentTheme: config.theme,
        };
      }
    } catch (error) {
      console.warn("Warning: Could not get config stats:", error.message);
    }

    return { exists: false };
  }
}
