<h1 align="center">Chess Arena</h1>

<p align="center">
  <i>Play chess anywhere from your terminal, with friends online or offline with Stockfish</i>
</p>

<p align="center">
  <img src="https://github.com/realBilalKhan/chess-arena/workflows/Deploy%20to%20Nest/badge.svg" alt="Deploy Status">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js Version">
  <a href="https://www.npmjs.com/package/chess-arena">
    <img src="https://img.shields.io/npm/v/chess-arena?style=flat&logo=npm&logoColor=white&color=cb3837" alt="npm Version">
  </a>
  <a href="https://github.com/realBilalKhan/chess-arena/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
  </a>
</p>

<p align="center">
  <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/d47a9babc6366c626cd1f6afe64a86729e1e3294_asd_20250929_194314_b368be.jpg" alt="Demo Screenshot">
</p>

## Table of Contents

- [Quick Start](#quick-start)
- [For Offline Play (vs Stockfish AI)](#for-offline-play-vs-stockfish-ai)
  - [Easy Installation (Recommended)](#easy-installation-recommended)
  - [Manual Installation](#manual-installation)
  - [Verify Installation](#verify-installation)
- [Command Line Options](#command-line-options)
- [Creating Custom Themes](#creating-custom-themes)
- [NPM Scripts](#npm-scripts)
- [Server Configuration](#server-configuration)
- [Troubleshooting](#troubleshooting)
- [Data Storage Location](#data-storage-location)

## Quick Start

```bash
# Install the game globally
npm install -g chess-arena

# Start playing
chess-arena
```

**Alternative:** If the `chess-arena` command isn't recognized, use `npx chess-arena` instead.

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
| `chess-arena -t <theme>`        | Set board theme                              |
| `chess-arena -s <url>`          | Set custom server URL (e.g., localhost:3000) |
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
npm run server         # Start the multiplayer server
npm run server:dev     # Start server in development mode
```

## Server Configuration

Chess Arena's online multiplayer is powered by a server hosted on [Hack Club's Nest](https://hackclub.com/nest), connecting by default to `http://chess.bilalkhan.hackclub.app:3456`.

**Switch to Local Server**:

```bash
# Start local server
npm run server

# Configure client to use localhost
chess-arena -s http://localhost:3000

# Or for development mode
npm run server:dev
chess-arena -s http://localhost:3000
```

**Switch Back to Deployed Server**:

```bash
chess-arena -s http://chess.bilalkhan.hackclub.app:3456
```

**Check Current Server**:

```bash
chess-arena -c
```

## Troubleshooting

### Command Not Recognized

If you get the error `'chess-arena' is not recognized as an internal or external command` (Windows) or `command not found: chess-arena` (Mac/Linux):

**Quick Fix:**

```bash
npx chess-arena
```

**Why this happens:** This is a PATH configuration issue. Your system isn't configured to find globally installed npm packages. This is more common on Windows but can occur on Mac/Linux too.

**Permanent Fix (Optional):**

1. Find npm's global directory:
   ```bash
   npm config get prefix
   ```
2. Add that path to your system PATH:
   - **Windows:** Environment Variables in System Properties
   - **Mac/Linux:** Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`
3. Restart your terminal

**Bottom line:** `npx chess-arena` works perfectly and is a valid way to run the application!

## Data Storage Location

Chess Arena stores all user data in a single directory:

- Linux/Mac: `~/.chess-arena/`
- Windows: `C:\Users\YourName\.chess-arena\`

This includes:

- `config.json` - Settings and preferences
- `saved_games/` - Automatically exported PGN files from completed games
