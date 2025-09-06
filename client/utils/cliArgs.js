import { THEMES } from "../themes/index.js";

export function parseCliArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {
    theme: null,
    help: false,
    listThemes: false,
    previewThemes: false,
    serverUrl: null,
    resetConfig: false,
    showConfig: false,
    sound: null,
    muteSound: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--theme":
      case "-t":
        if (i + 1 < args.length) {
          parsedArgs.theme = args[++i];
        }
        break;

      case "--help":
      case "-h":
        parsedArgs.help = true;
        break;

      case "--list-themes":
      case "-l":
        parsedArgs.listThemes = true;
        break;

      case "--preview-themes":
      case "-p":
        parsedArgs.previewThemes = true;
        break;

      case "--server":
      case "-s":
        if (i + 1 < args.length) {
          parsedArgs.serverUrl = args[++i];
        }
        break;

      case "--reset-config":
      case "-r":
        parsedArgs.resetConfig = true;
        break;

      case "--show-config":
      case "-c":
        parsedArgs.showConfig = true;
        break;

      case "--sound":
        if (i + 1 < args.length) {
          const value = args[++i].toLowerCase();
          if (value === "on" || value === "off") {
            parsedArgs.sound = value;
          }
        }
        break;

      case "--mute":
      case "-m":
        parsedArgs.muteSound = true;
        break;
    }
  }

  return parsedArgs;
}

export function showHelp() {
  console.log(`
Chess Arena - Command Line Options

Usage: node chess-arena.js [options]

Options:
  -t, --theme <name>     Set the board theme (default: classic)
  -l, --list-themes      List all available themes
  -p, --preview-themes   Preview all available themes
  -s, --server <url>     Set custom server URL
  -c, --show-config      Show current configuration
  -r, --reset-config     Reset configuration to defaults
  --sound <on|off>       Enable or disable sound effects
  -m, --mute            Start with sound muted
  -h, --help            Show this help message

Available Themes:
${Object.entries(THEMES)
  .map(
    ([key, theme]) => `  ${key.padEnd(12)} ${theme.name} - ${theme.description}`
  )
  .join("\n")}

Examples:
  node chess-arena.js --theme ocean
  node chess-arena.js -t neon --mute
  node chess-arena.js --sound off
  node chess-arena.js --preview-themes
  node chess-arena.js --list-themes
`);
}

export function listThemes() {
  console.log("\nAvailable Themes:\n");
  Object.entries(THEMES).forEach(([key, theme]) => {
    console.log(`  ${key.padEnd(12)} - ${theme.name}`);
    console.log(`  ${" ".repeat(12)}   ${theme.description}\n`);
  });
}

export function validateTheme(themeName) {
  if (!themeName) return true;

  if (!THEMES[themeName]) {
    console.error(`Error: Theme '${themeName}' not found.`);
    console.error(`Available themes: ${Object.keys(THEMES).join(", ")}`);
    return false;
  }

  return true;
}
