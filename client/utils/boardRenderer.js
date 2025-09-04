import chalk from "chalk";
import boxen from "boxen";

class BoardRenderer {
  constructor(themeManager) {
    this.themeManager = themeManager;
    this.highlightedSquares = new Set();
    this.selectedSquare = null;
  }

  setSelectedSquare(square, legalMoves = []) {
    this.selectedSquare = square;
    this.highlightedSquares.clear();

    legalMoves.forEach((move) => {
      if (move.from === square) {
        this.highlightedSquares.add(move.to);
      }
    });
  }

  clearSelection() {
    this.selectedSquare = null;
    this.highlightedSquares.clear();
  }

  isHighlighted(square) {
    return this.highlightedSquares.has(square);
  }

  isSelected(square) {
    return this.selectedSquare === square;
  }

  getSquareBackground(isLightSquare, square) {
    const baseStyle = this.themeManager.getSquareStyle(isLightSquare);

    if (this.isSelected(square)) {
      return isLightSquare ? chalk.bgYellow.black : chalk.bgYellow.gray;
    }

    if (this.isHighlighted(square)) {
      return isLightSquare ? chalk.bgGreen.black : chalk.bgGreen.white;
    }

    return baseStyle;
  }

  renderBoard(chess, playerColor, options = {}) {
    const board = chess.board();
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks =
      playerColor === "white"
        ? [8, 7, 6, 5, 4, 3, 2, 1]
        : [1, 2, 3, 4, 5, 6, 7, 8];
    const displayFiles = playerColor === "white" ? files : [...files].reverse();

    if (options.clear) {
      console.clear();
    }

    console.log(
      "     " + displayFiles.map((f) => chalk.bold.gray(f)).join("       ")
    );

    ranks.forEach((rank) => {
      const row = board[8 - rank];
      const displayRow = playerColor === "white" ? row : [...row].reverse();

      for (let line = 0; line < 3; line++) {
        let rowDisplay = "";

        if (line === 1) {
          rowDisplay += chalk.bold.gray(rank) + " ";
        } else {
          rowDisplay += "  ";
        }

        displayRow.forEach((piece, displayIndex) => {
          const actualFileIndex =
            playerColor === "white" ? displayIndex : 7 - displayIndex;

          const file = files[actualFileIndex];
          const square = `${file}${rank}`;
          const isLightSquare = (rank + actualFileIndex) % 2 === 0;

          const squareBg = this.getSquareBackground(isLightSquare, square);

          let pieceDisplay = "        ";

          if (line === 1 && piece) {
            const symbol = this.themeManager.getPieceSymbol(piece);
            const pieceColor = this.themeManager.getPieceColor(
              piece.color === "w"
            );

            if (this.isSelected(square)) {
              pieceDisplay = "  [" + pieceColor(symbol) + "]   ";
            } else {
              pieceDisplay = "   " + pieceColor(symbol) + "    ";
            }
          }

          if (line === 1 && !piece && this.isHighlighted(square)) {
            pieceDisplay = "   •    ";
          }

          rowDisplay += squareBg(pieceDisplay);
        });

        if (line === 1) {
          rowDisplay += " " + chalk.bold.gray(rank);
        }

        console.log(rowDisplay);
      }
    });

    console.log(
      "     " + displayFiles.map((f) => chalk.bold.gray(f)).join("       ")
    );
    console.log();

    if (this.selectedSquare) {
      console.log(
        chalk.cyan(`\n  Selected: ${this.selectedSquare.toUpperCase()}`) +
          chalk.gray(` (${this.highlightedSquares.size} legal moves)`)
      );
    }
  }

  displayStatus(chess, playerColor, isPlayerTurn, additionalInfo = {}) {
    const lines = [];

    if (chess.inCheck()) {
      lines.push(
        chalk.redBright.bold("⚠️  CHECK! Your king is under attack!\n")
      );
    }

    const currentTurn = chess.turn() === "w" ? "White" : "Black";
    const turnColor = chess.turn() === "w" ? chalk.white : chalk.hex("#2C2C2C");

    lines.push(
      `${chalk.bold("Current Turn:")} ${turnColor.bold(
        `${currentTurn} ${chess.turn() === "w" ? "♔" : "♚"}`
      )}`
    );

    const yourSymbol = playerColor === "white" ? "♔" : "♚";
    lines.push(
      `${chalk.bold("You are:")} ${chalk.cyan.bold(
        `${playerColor.toUpperCase()} ${yourSymbol}`
      )}`
    );

    if (additionalInfo.opponent) {
      lines.push(`${chalk.bold("Opponent:")} ${additionalInfo.opponent}`);
    }

    const statusMsg = isPlayerTurn
      ? chalk.greenBright.bold("YOUR TURN!")
      : chalk.yellowBright("Waiting for opponent...");
    lines.push(`${chalk.bold("Status:")} ${statusMsg}`);

    if (this.selectedSquare) {
      lines.push(
        `${chalk.bold("Mode:")} ${chalk.magenta(
          "Piece Selected - Choose destination"
        )}`
      );
    }

    console.log(
      boxen(lines.join("\n"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: this.themeManager.getBorderColor(),
        title: "Game Status",
        titleAlignment: "center",
      })
    );
  }
}

export default BoardRenderer;
