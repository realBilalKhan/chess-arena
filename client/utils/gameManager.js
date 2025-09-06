import chalk from "chalk";
import inquirer from "inquirer";

export class GameManager {
  constructor(pgnExporter) {
    this.pgnExporter = pgnExporter;
  }

  async manageSavedGames() {
    while (true) {
      const games = this.pgnExporter.listSavedGames();

      if (games.length === 0) {
        console.log(chalk.yellow("\n📂 No saved games found."));
        console.log(
          chalk.gray("Games are automatically saved when you finish playing.")
        );

        await inquirer.prompt([
          {
            type: "input",
            name: "continue",
            message: "Press Enter to continue...",
          },
        ]);
        return;
      }

      const gameChoices = games.map((game) => ({
        name: `${game.filename} (${game.created.toLocaleDateString()})`,
        value: game.filename,
      }));

      gameChoices.push({ name: "← Back to main menu", value: "back" });

      const { selectedGame } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedGame",
          message: `📁 Saved Games (${games.length} total):`,
          choices: gameChoices,
          pageSize: 10,
        },
      ]);

      if (selectedGame === "back") {
        return;
      }

      const continueManaging = await this.handleGameAction(selectedGame);
      if (!continueManaging) {
        return;
      }
    }
  }

  async handleGameAction(selectedGame) {
    const { gameAction } = await inquirer.prompt([
      {
        type: "list",
        name: "gameAction",
        message: `What would you like to do with ${selectedGame}?`,
        choices: [
          "👀 View game content",
          "📋 Copy to clipboard",
          "🗑️ Delete game",
          "← Back to games list",
        ],
      },
    ]);

    switch (gameAction) {
      case "👀 View game content":
        const loadResult = this.pgnExporter.loadGame(selectedGame);
        if (loadResult.success) {
          console.log(chalk.cyan(`\n📋 Content of ${selectedGame}:`));
          console.log(chalk.gray("─".repeat(60)));
          console.log(loadResult.content);
          console.log(chalk.gray("─".repeat(60)));
        } else {
          console.log(chalk.red(`❌ Error loading game: ${loadResult.error}`));
        }

        await inquirer.prompt([
          {
            type: "input",
            name: "continue",
            message: "Press Enter to continue...",
          },
        ]);
        return true;

      case "📋 Copy to clipboard":
        const copyResult = this.pgnExporter.loadGame(selectedGame);
        if (copyResult.success) {
          try {
            const { exec } = await import("child_process");
            const util = await import("util");
            const execPromise = util.promisify(exec);

            let command;
            if (process.platform === "darwin") {
              command = "pbcopy";
            } else if (process.platform === "win32") {
              command = "clip";
            } else {
              command = "xclip -selection clipboard";
            }

            await execPromise(
              `echo '${copyResult.content.replace(/'/g, "'\\''")}' | ${command}`
            );
            console.log(chalk.green(`\n✓ Game content copied to clipboard!\n`));
          } catch (error) {
            console.log(
              chalk.yellow("\n⚠️ Could not copy to clipboard automatically")
            );
            console.log(chalk.cyan("📋 Game content (please copy manually):"));
            console.log(chalk.gray("─".repeat(60)));
            console.log(copyResult.content);
            console.log(chalk.gray("─".repeat(60)));
          }
        } else {
          console.log(chalk.red(`❌ Error loading game: ${copyResult.error}`));
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
        return true;

      case "🗑️ Delete game":
        const { confirmDelete } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmDelete",
            message: chalk.red(
              `Are you sure you want to delete ${selectedGame}?`
            ),
            default: false,
          },
        ]);

        if (confirmDelete) {
          const deleteResult = this.pgnExporter.deleteGame(selectedGame);
          if (deleteResult.success) {
            console.log(chalk.green(`✓ Deleted ${selectedGame}`));
          } else {
            console.log(
              chalk.red(`❌ Error deleting game: ${deleteResult.error}`)
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return true;

      case "← Back to games list":
        return true;
      default:
        return true;
    }
  }
}
