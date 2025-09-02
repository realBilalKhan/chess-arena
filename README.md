# Chess Arena

<p align="center">
  <img src="https://github.com/realBilalKhan/chess-arena/workflows/Deploy%20to%20Nest/badge.svg" alt="Deploy Status">
</p>

## Command Line Options

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `chess-arena`            | Start the game with default settings         |
| `chess-arena -l`         | List all available themes with descriptions  |
| `chess-arena -p`         | Preview all themes with sample boards        |
| `chess-arena -t <theme>` | Set board theme (see available themes below) |
| `chess-arena -s <url>`   | Set custom server URL                        |
| `chess-arena -h`         | Show comprehensive help message              |
| `chess-arena -c`         | Show current saved configuration             |
| `chess-arena -r`         | Reset all settings to defaults               |

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
npm start           # Start the game
npm run dev         # Start with file watching
npm run themes      # List available themes
npm run preview     # Preview all themes
```

## Config File Location

- Linux/Mac: `~/.chess-arena/config.json`
- Windows: `C:\Users\YourName\.chess-arena\config.json`
