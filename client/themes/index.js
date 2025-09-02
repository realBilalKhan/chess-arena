import chalk from "chalk";

export const THEMES = {
  classic: {
    name: "Classic",
    description: "Traditional brown and cream chess board",
    lightSquare: "#f0d9b5",
    darkSquare: "#b58863",
    whitePieces: "white",
    blackPieces: "black",
    borderColor: "cyan",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  ocean: {
    name: "Ocean Depths",
    description: "Deep blue waters with aqua highlights",
    lightSquare: "#4a9eff",
    darkSquare: "#1e3a8a",
    whitePieces: "#f0f9ff",
    blackPieces: "#0f172a",
    borderColor: "blue",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  forest: {
    name: "Enchanted Forest",
    description: "Earth tones with forest greens",
    lightSquare: "#86efac",
    darkSquare: "#166534",
    whitePieces: "#f7fee7",
    blackPieces: "#14532d",
    borderColor: "green",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  sunset: {
    name: "Golden Sunset",
    description: "Warm oranges and deep reds",
    lightSquare: "#fed7aa",
    darkSquare: "#c2410c",
    whitePieces: "#fffbeb",
    blackPieces: "#431407",
    borderColor: "magenta",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  neon: {
    name: "Neon Nights",
    description: "Cyberpunk vibes with electric colors",
    lightSquare: "#a855f7",
    darkSquare: "#581c87",
    whitePieces: "#fdf4ff",
    blackPieces: "#3b0764",
    borderColor: "magenta",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  monochrome: {
    name: "Monochrome",
    description: "Pure black and white elegance",
    lightSquare: "#ffffff",
    darkSquare: "#000000",
    whitePieces: "#000000",
    blackPieces: "#ffffff",
    borderColor: "white",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  royal: {
    name: "Royal Purple",
    description: "Majestic purples fit for royalty",
    lightSquare: "#e9d5ff",
    darkSquare: "#7c3aed",
    whitePieces: "#faf5ff",
    blackPieces: "#4c1d95",
    borderColor: "magenta",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },

  sakura: {
    name: "Cherry Blossom",
    description: "Soft pinks inspired by Japanese sakura",
    lightSquare: "#fce7f3",
    darkSquare: "#be185d",
    whitePieces: "#fdf2f8",
    blackPieces: "#831843",
    borderColor: "magenta",
    pieces: {
      white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
      black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
    },
  },
};

export class ThemeManager {
  constructor() {
    this.currentTheme = THEMES.classic;
  }

  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.currentTheme = THEMES[themeName];
      return true;
    }
    return false;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeNames() {
    return Object.keys(THEMES);
  }

  getThemeList() {
    return Object.entries(THEMES).map(([key, theme]) => ({
      name: `${theme.name} - ${theme.description}`,
      value: key,
    }));
  }

  getPieceSymbol(piece) {
    const colorKey = piece.color === "w" ? "white" : "black";
    return (
      this.currentTheme.pieces[colorKey][piece.type] || piece.type.toUpperCase()
    );
  }

  getSquareStyle(isLight) {
    const color = isLight
      ? this.currentTheme.lightSquare
      : this.currentTheme.darkSquare;
    return chalk.bgHex(color);
  }

  getPieceColor(isWhite) {
    return isWhite
      ? chalk.hex(this.currentTheme.whitePieces)
      : chalk.hex(this.currentTheme.blackPieces);
  }

  getBorderColor() {
    return this.currentTheme.borderColor;
  }

  previewTheme(chess = null) {
    const theme = this.currentTheme;
    console.log(chalk.bold.underline(`\n${theme.name} Theme Preview:`));
    console.log(chalk.gray(theme.description));

    const files = ["e", "f", "g", "h"];
    console.log("     " + files.map((f) => chalk.bold.gray(f)).join("       "));

    for (let rank = 4; rank >= 1; rank--) {
      for (let line = 0; line < 3; line++) {
        let rowDisplay = "";

        if (line === 1) {
          rowDisplay += chalk.bold.gray(rank) + " ";
        } else {
          rowDisplay += "  ";
        }

        files.forEach((file, fileIndex) => {
          const isLightSquare = (rank + fileIndex) % 2 === 0;
          const squareBg = this.getSquareStyle(isLightSquare);

          let pieceDisplay = "        ";

          if (line === 1) {
            let piece = null;
            if (rank === 4 && file === "e") piece = { type: "k", color: "w" };
            else if (rank === 4 && file === "f")
              piece = { type: "q", color: "b" };
            else if (rank === 3 && file === "g")
              piece = { type: "n", color: "w" };
            else if (rank === 2 && file === "h")
              piece = { type: "p", color: "b" };

            if (piece) {
              const symbol = this.getPieceSymbol(piece);
              const pieceColor = this.getPieceColor(piece.color === "w");
              pieceDisplay = "   " + pieceColor(symbol) + "    ";
            }
          }

          rowDisplay += squareBg(pieceDisplay);
        });

        if (line === 1) {
          rowDisplay += " " + chalk.bold.gray(rank);
        }

        console.log(rowDisplay);
      }
    }

    console.log("     " + files.map((f) => chalk.bold.gray(f)).join("       "));
    console.log();
  }
}
