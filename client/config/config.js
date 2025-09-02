import { PersistenceManager } from "../utils/persistence.js";

export const DEFAULT_CONFIG = {
  theme: "classic",
  serverUrl: "http://bilalkhan.hackclub.app:3456",
  showPreview: true,
  autoConnect: true,
};

export class ConfigManager {
  constructor() {
    this.persistenceManager = new PersistenceManager();
    this.config = this.persistenceManager.loadUserConfig();
  }

  setTheme(themeName) {
    this.config.theme = themeName;
    this.persistenceManager.saveThemePreference(themeName);
  }

  getTheme() {
    return this.config.theme;
  }

  setServerUrl(url) {
    this.config.serverUrl = url;
    this.persistenceManager.saveServerUrl(url);
  }

  getServerUrl() {
    return this.config.serverUrl;
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    this.persistenceManager.saveUserConfig(this.config);
  }

  resetToDefaults() {
    const success = this.persistenceManager.resetToDefaults();
    this.config = { ...DEFAULT_CONFIG };
    return success;
  }

  getConfigStats() {
    return this.persistenceManager.getConfigStats();
  }

  getConfigPath() {
    return this.persistenceManager.getConfigPath();
  }
}
