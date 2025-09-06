<h1 align="center">Chess Arena</h1>

<p align="center">
  <img src="https://github.com/realBilalKhan/chess-arena/workflows/Deploy%20to%20Nest/badge.svg" alt="Deploy Status">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js Version">
  <img src="https://img.shields.io/npm/v/chess-arena?style=flat&logo=npm&logoColor=white&color=cb3837" alt="npm Version">
</p>

## Quick Start

```bash
# Install the game
npm install -g chess-arena

# Start playing
chess-arena
```

## For Offline Play (vs Stockfish AI)

To play offline against the computer, you need to install the Stockfish chess engine.

### Easy Installation (Recommended)

Chess Arena includes an installation helper:

```bash
# Run the built-in installer
install-stockfish
```

### Manual Installation

If you prefer to install Stockfish manually, follow the official instructions at [Stockfish Installation Guide](https://stockfishchess.org/download/).

### Verify Installation

```bash
stockfish --version
```

## Command Line Options

| Command                         | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `chess-arena`                   | Start the game with default settings         |
| `chess-arena -l`                | List all available themes with descriptions  |
| `chess-arena -p`                | Preview all themes with sample boards        |
| `chess-arena -t <theme>`        | Set board theme (see available themes below) |
| `chess-arena -s <url>`          | Set custom server URL                        |
| `chess-arena -h`                | Show comprehensive help message              |
| `chess-arena -c`                | Show current saved configuration             |
| `chess-arena -r`                | Reset all settings to defaults               |
| `chess-arena --sound <on\|off>` | Enable or disable sound effects              |
| `install-stockfish`             | Install Stockfish for offline play           |

## Creating Custom Themes

Add new themes to `themes/index.js`:

```javascript
newTheme: {
  name: "Theme Name",
  description: "Theme description",
  lightSquare: "#hex-color",
  darkSquare: "#hex-color",
  whitePieces: "#hex-color",
  blackPieces: "#hex-color",
  borderColor: "chalk-color",
  pieces: {
    white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
    black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
  }
}
```

## NPM Scripts

```bash
npm start               # Start the game
npm run dev            # Start with file watching
npm run themes         # List available themes
npm run preview        # Preview all themes
npm run install-stockfish  # Install Stockfish engine
```

## Config File Location

- Linux/Mac: `~/.chess-arena/config.json`
- Windows: `C:\Users\YourName\.chess-arena\config.json`
