import { PersistenceManager } from "../utils/persistence.js";

export const DEFAULT_CONFIG = {
  theme: "classic",
  serverUrl: "http://localhost:3000",
  showPreview: true,
  autoConnect: true,
  soundEnabled: true,
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

  setSoundEnabled(enabled) {
    this.config.soundEnabled = enabled;
    this.persistenceManager.saveUserConfig(this.config);
  }

  getSoundEnabled() {
    return this.config.soundEnabled ?? DEFAULT_CONFIG.soundEnabled;
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
