#! /usr/bin/env node

import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import boxen from "boxen";
import inquirer from "inquirer";
import os from "os";

const execAsync = promisify(exec);

// Handles Stockfish chess engine installation across different platforms
class StockfishInstaller {
  constructor() {
    this.platform = os.platform();
  }

  // Check if Stockfish is already installed
  async checkStockfishInstalled() {
    try {
      const commands = [
        "stockfish --version",
        "which stockfish", // Unix/Linux
        "where stockfish", // Windows
      ];

      for (const cmd of commands) {
        try {
          const { stdout } = await execAsync(cmd);
          if (stdout) {
            return true;
          }
        } catch {}
      }
      return false;
    } catch {
      return false;
    }
  }

  // Get platform-specific installation instructions and commands
  getInstallInstructions() {
    const instructions = {
      darwin: {
        name: "macOS",
        packageManager: "Homebrew",
        checkCommand: "brew --version",
        installManagerCommand:
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        installCommand: "brew install stockfish",
        manual: "Download from https://stockfishchess.org/download/",
        notes: "Homebrew is the easiest way to install on macOS",
      },
      linux: {
        name: "Linux",
        packageManager: "APT/YUM/Pacman",
        checkCommand: null,
        installCommand: this.getLinuxInstallCommand(),
        manual: "Download from https://stockfishchess.org/download/linux/",
        notes: "Use your distribution's package manager",
      },
      win32: {
        name: "Windows",
        packageManager: "Manual Download",
        checkCommand: null,
        installCommand: null,
        manual:
          "1. Download from https://stockfishchess.org/download/\n" +
          "2. Extract the ZIP file\n" +
          "3. Add the folder to your system PATH\n" +
          "4. Restart your terminal",
        notes: "Windows requires manual installation",
      },
    };

    return instructions[this.platform] || instructions.linux;
  }

  getLinuxInstallCommand() {
    try {
      const fs = require("fs");
      // Check common distribution identifier files
      if (fs.existsSync("/etc/debian_version")) {
        return "sudo apt-get update && sudo apt-get install stockfish";
      } else if (fs.existsSync("/etc/redhat-release")) {
        return "sudo yum install stockfish";
      } else if (fs.existsSync("/etc/arch-release")) {
        return "sudo pacman -S stockfish";
      } else if (fs.existsSync("/etc/fedora-release")) {
        return "sudo dnf install stockfish";
      }
    } catch {}
    return "Check your distribution's package manager (apt, yum, pacman, etc.)";
  }

  async promptInstall() {
    const isInstalled = await this.checkStockfishInstalled();

    if (isInstalled) {
      console.log(chalk.green("✓ Stockfish is already installed!"));
      return true;
    }

    const instructions = this.getInstallInstructions();

    console.log(
      boxen(
        chalk.yellow.bold("📦 Stockfish Not Found\n\n") +
          chalk.white(
            `To play offline chess, you need to install Stockfish.\n\n`
          ) +
          chalk.cyan.bold(`Platform: ${instructions.name}\n\n`) +
          chalk.white("Installation Options:\n\n") +
          (instructions.installCommand
            ? chalk.green("Automatic:\n") +
              chalk.gray(instructions.installCommand) +
              "\n\n"
            : "") +
          chalk.green("Manual:\n") +
          chalk.gray(instructions.manual) +
          "\n\n" +
          chalk.dim(instructions.notes),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "yellow",
          title: "Installation Required",
          titleAlignment: "center",
        }
      )
    );

    if (instructions.installCommand && this.platform !== "win32") {
      const { autoInstall } = await inquirer.prompt([
        {
          type: "confirm",
          name: "autoInstall",
          message: "Would you like to try automatic installation?",
          default: true,
        },
      ]);

      if (autoInstall) {
        return await this.attemptAutoInstall(instructions);
      }
    }

    // Fallback: offer to open download page
    const { openBrowser } = await inquirer.prompt([
      {
        type: "confirm",
        name: "openBrowser",
        message: "Would you like to open the download page in your browser?",
        default: true,
      },
    ]);

    if (openBrowser) {
      const open = (await import("open")).default;
      await open("https://stockfishchess.org/download/");
    }

    console.log(
      chalk.yellow(
        "\n📝 After installing Stockfish, restart the Chess Arena app."
      )
    );
    return false;
  }

  async attemptAutoInstall(instructions) {
    console.log(chalk.yellow("\n🔧 Attempting automatic installation..."));

    try {
      // Check if package manager is available first
      if (instructions.checkCommand) {
        try {
          await execAsync(instructions.checkCommand);
        } catch {
          console.log(
            chalk.red(`❌ ${instructions.packageManager} not found.`)
          );

          if (this.platform === "darwin") {
            console.log(chalk.yellow("Installing Homebrew first..."));
            console.log(chalk.gray(instructions.installManagerCommand));
            return false;
          }
        }
      }

      console.log(chalk.cyan("📦 Installing Stockfish..."));
      console.log(chalk.gray(`Running: ${instructions.installCommand}`));

      const { stdout, stderr } = await execAsync(instructions.installCommand);

      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes("Warning")) console.error(stderr);

      // Verify installation was successful
      const isNowInstalled = await this.checkStockfishInstalled();

      if (isNowInstalled) {
        console.log(chalk.green.bold("\n✓ Stockfish installed successfully!"));
        return true;
      } else {
        console.log(
          chalk.red("\n❌ Installation completed but Stockfish not found.")
        );
        console.log(
          chalk.yellow(
            "You may need to restart your terminal or add Stockfish to PATH."
          )
        );
        return false;
      }
    } catch (error) {
      console.log(chalk.red("\n❌ Automatic installation failed."));
      console.log(chalk.gray(error.message));
      console.log(chalk.yellow("\nPlease try manual installation:"));
      console.log(chalk.gray(instructions.manual));
      return false;
    }
  }

  // Public method to check and prompt for installation if needed
  async verifyAndPrompt() {
    const isInstalled = await this.checkStockfishInstalled();

    if (isInstalled) {
      return true;
    }

    console.log(chalk.yellow("\n⚠️  Stockfish is required for offline play."));
    return await this.promptInstall();
  }
}

export default StockfishInstaller;

// Allow running as standalone script for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new StockfishInstaller();
  installer.verifyAndPrompt().then((installed) => {
    process.exit(installed ? 0 : 1);
  });
}
