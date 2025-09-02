import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";
import clear from "clear";
import { ThemeManager } from "../themes/index.js";

export async function selectThemeInteractively(currentThemeManager = null) {
  const themeManager = currentThemeManager || new ThemeManager();

  while (true) {
    clear();
    console.log(chalk.yellow.bold("🎨 Theme Selection\n"));

    const currentTheme = themeManager.getCurrentTheme();
    console.log(
      boxen(
        `${chalk.bold("Current Theme:")} ${chalk.cyan(
          currentTheme.name
        )}\n${chalk.gray(currentTheme.description)}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: currentTheme.borderColor || "cyan",
        }
      )
    );

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Select a theme", value: "select" },
          { name: "Preview all themes", value: "preview" },
          { name: "Continue with current theme", value: "continue" },
          { name: "Back to main menu", value: "back" },
        ],
      },
    ]);

    if (action === "back") {
      return null;
    }

    if (action === "continue") {
      return { themeName: null, themeManager };
    }

    if (action === "preview") {
      await previewAllThemes(themeManager);
      continue;
    }

    if (action === "select") {
      const result = await selectTheme(themeManager);
      if (result) {
        return { themeName: result.themeName, themeManager };
      }
    }
  }
}

async function selectTheme(themeManager) {
  const { themeName } = await inquirer.prompt([
    {
      type: "list",
      name: "themeName",
      message: "Choose your theme:",
      choices: themeManager.getThemeList(),
      pageSize: 10,
    },
  ]);

  themeManager.setTheme(themeName);

  clear();
  themeManager.previewTheme();

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Use this theme?",
      default: true,
    },
  ]);

  if (confirm) {
    console.log(
      chalk.green(`✓ Theme '${themeManager.getCurrentTheme().name}' selected!`)
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { themeName, themeManager };
  }

  return null;
}

async function previewAllThemes(themeManager) {
  const themes = themeManager.getThemeNames();
  let currentIndex = 0;

  while (true) {
    clear();

    const currentThemeName = themes[currentIndex];
    themeManager.setTheme(currentThemeName);

    console.log(
      chalk.yellow.bold(
        `🎨 Theme Preview (${currentIndex + 1}/${themes.length})\n`
      )
    );
    themeManager.previewTheme();

    console.log(
      boxen(
        `${chalk.bold("Navigation:")}\n` +
          `${chalk.cyan("→ n")} Next theme\n` +
          `${chalk.cyan("← p")} Previous theme\n` +
          `${chalk.green("✓ s")} Select this theme\n` +
          `${chalk.red("✗ q")} Back to menu`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "blue",
        }
      )
    );

    const { action } = await inquirer.prompt([
      {
        type: "input",
        name: "action",
        message: "Action (n/p/s/q):",
        validate: (input) => {
          const valid = [
            "n",
            "p",
            "s",
            "q",
            "next",
            "prev",
            "previous",
            "select",
            "quit",
          ];
          return (
            valid.includes(input.toLowerCase()) || "Please enter n, p, s, or q"
          );
        },
      },
    ]);

    const cmd = action.toLowerCase();

    if (cmd === "q" || cmd === "quit") {
      break;
    }

    if (cmd === "s" || cmd === "select") {
      console.log(
        chalk.green(
          `✓ Theme '${themeManager.getCurrentTheme().name}' selected!`
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { themeName: themes[currentIndex], themeManager };
    }

    if (cmd === "n" || cmd === "next") {
      currentIndex = (currentIndex + 1) % themes.length;
    }

    if (cmd === "p" || cmd === "prev" || cmd === "previous") {
      currentIndex = (currentIndex - 1 + themes.length) % themes.length;
    }
  }

  return null;
}
