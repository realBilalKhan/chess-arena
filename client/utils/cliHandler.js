import chalk from "chalk";
import {
  parseCliArgs,
  showHelp,
  listThemes,
  validateTheme,
} from "./cliArgs.js";

// Handles all command-line arg processing and config management
export class CLIHandler {
  constructor(configManager, themeManager, soundManager) {
    this.configManager = configManager;
    this.themeManager = themeManager;
    this.soundManager = soundManager;
  }

  handleCliArgs() {
    const args = parseCliArgs();

    // Info commands that exit immediately
    if (args.help) {
      showHelp();
      process.exit(0);
    }

    if (args.showConfig) {
      this.showCurrentConfig();
      process.exit(0);
    }

    if (args.resetConfig) {
      this.resetConfig();
      process.exit(0);
    }

    if (args.listThemes) {
      listThemes();
      process.exit(0);
    }

    if (args.previewThemes) {
      this.previewAllThemes();
      process.exit(0);
    }

    // Configuration commands that can be combined
    if (args.theme) {
      if (!validateTheme(args.theme)) {
        process.exit(1);
      }
      // Set theme both for current session and save to config
      this.themeManager.setTheme(args.theme);
      this.configManager.setTheme(args.theme);
      console.log(
        chalk.green(
          `🎨 Theme permanently set to: ${
            this.themeManager.getCurrentTheme().name
          }`
        )
      );
    }

    if (args.serverUrl) {
      this.configManager.setServerUrl(args.serverUrl);
      console.log(
        chalk.green(`🌐 Server URL permanently set to: ${args.serverUrl}`)
      );
    }

    if (args.sound) {
      this.soundManager.setEnabled(args.sound === "on");
      console.log(
        chalk.green(`🔊 Sound ${args.sound === "on" ? "enabled" : "disabled"}`)
      );
    }

    if (args.muteSound) {
      this.soundManager.setEnabled(false);
      console.log(chalk.gray("🔇 Sound muted"));
    }
  }

  // Display current configuration with file info and modification dates
  showCurrentConfig() {
    const config = this.configManager.getConfig();
    const stats = this.configManager.getConfigStats();

    console.log(chalk.yellow.bold("\n🔧 Current Configuration\n"));

    console.log(`${chalk.bold("Theme:")} ${chalk.cyan(config.theme)}`);
    console.log(`${chalk.bold("Server URL:")} ${chalk.cyan(config.serverUrl)}`);
    console.log(
      `${chalk.bold("Sound:")} ${chalk.cyan(
        config.soundEnabled ? "Enabled" : "Disabled"
      )}`
    );
    console.log(
      `${chalk.bold("Config File:")} ${chalk.gray(
        this.configManager.getConfigPath()
      )}`
    );

    // Show file metadata if config exists
    if (stats.exists) {
      console.log(
        `${chalk.bold("Last Updated:")} ${chalk.gray(
          stats.lastUpdated || "Unknown"
        )}`
      );
    } else {
      console.log(chalk.gray("Using default settings (no config file found)"));
    }

    console.log(`\n${chalk.gray("Use --reset-config to restore defaults")}`);
  }

  // Reset all settings to default values
  resetConfig() {
    console.log(chalk.yellow("🔄 Resetting configuration to defaults..."));

    const success = this.configManager.resetToDefaults();

    if (success) {
      console.log(chalk.green("✓ Configuration reset successfully!"));
      console.log(chalk.gray("Theme: classic"));
      console.log(
        chalk.gray("Server: https://chess.bilalkhan.hackclub.app:3456")
      );
    } else {
      console.log(chalk.red("❌ Failed to reset configuration"));
    }
  }

  previewAllThemes() {
    const themeNames = this.themeManager.getThemeNames();
    console.log(chalk.yellow.bold("🎨 All Theme Previews\n"));

    themeNames.forEach((themeName) => {
      this.themeManager.setTheme(themeName);
      this.themeManager.previewTheme();
      console.log("\n" + "─".repeat(50) + "\n"); // Visual separator between themes
    });
  }
}
