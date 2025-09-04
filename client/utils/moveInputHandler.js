import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";

class MoveInputHandler {
  constructor(boardRenderer, themeManager) {
    this.boardRenderer = boardRenderer;
    this.themeManager = themeManager;
    this.selectionMode = false;
  }

  async promptMove(chess, playerColor) {
    const moves = chess.moves({ verbose: true });

    if (!this.selectionMode) {
      console.log(
        chalk.gray(
          "\n  💡 Tip: Enter a square (e.g., 'e2') to select a piece and see its legal moves"
        )
      );
    }

    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: this.selectionMode
          ? `Select destination for ${this.boardRenderer.selectedSquare} (or 'cancel'):`
          : "Your move (e2-e4), square (e2), or command (help/hint/quit):",
        validate: (value) => {
          const lowerValue = value.toLowerCase();

          if (
            ["help", "hint", "quit", "cancel", "clear"].includes(lowerValue)
          ) {
            return true;
          }

          if (this.selectionMode) {
            if (this.isValidSquare(value)) {
              const from = this.boardRenderer.selectedSquare;
              const to = value.toLowerCase();
              const move = moves.find((m) => m.from === from && m.to === to);
              if (move) {
                return true;
              }
              return "Not a legal move for the selected piece";
            }
            return "Invalid square notation (use format like 'e4')";
          }

          if (this.isValidSquare(value)) {
            const square = value.toLowerCase();
            const piece = chess.get(square);

            if (!piece) {
              return "No piece on that square";
            }

            if (piece.color !== chess.turn()) {
              return "You can only move your own pieces";
            }

            const pieceMoves = moves.filter((m) => m.from === square);
            if (pieceMoves.length === 0) {
              return "This piece has no legal moves";
            }

            return true;
          }

          if (value.includes("-")) {
            const parts = value.split("-");
            if (parts.length !== 2) {
              return "Invalid format. Use: from-to (e.g., e2-e4)";
            }

            const [from, to] = parts;
            const move = moves.find((m) => m.from === from && m.to === to);

            if (!move) {
              return "Illegal move. Type 'help' to see legal moves.";
            }

            return true;
          }

          return "Invalid input. Enter a move (e2-e4), square (e2), or command (help/quit)";
        },
      },
    ]);

    return this.handleInput(input, chess, playerColor, moves);
  }

  async handleInput(input, chess, playerColor, moves) {
    const lowerInput = input.toLowerCase();

    if (lowerInput === "cancel" && this.selectionMode) {
      this.exitSelectionMode();
      return { command: "continue" };
    }

    if (lowerInput === "clear") {
      this.exitSelectionMode();
      return { command: "clear" };
    }

    if (lowerInput === "help") {
      this.showHelp(moves, chess);
      return { command: "continue" };
    }

    if (lowerInput === "hint") {
      return { command: "hint" };
    }

    if (lowerInput === "quit") {
      return { command: "quit" };
    }

    if (this.selectionMode) {
      const from = this.boardRenderer.selectedSquare;
      const to = lowerInput;
      const move = moves.find((m) => m.from === from && m.to === to);

      if (move) {
        this.exitSelectionMode();
        return {
          type: "move",
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          move: move,
        };
      }
    }

    if (this.isValidSquare(input)) {
      const square = lowerInput;
      const piece = chess.get(square);

      if (piece && piece.color === chess.turn()) {
        this.enterSelectionMode(square, moves, chess);
        return { command: "continue" };
      }
    }

    if (input.includes("-")) {
      const [from, to] = input.split("-");
      const move = moves.find((m) => m.from === from && m.to === to);

      if (move) {
        this.exitSelectionMode();
        return {
          type: "move",
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          move: move,
        };
      }
    }

    return { command: "continue" };
  }

  enterSelectionMode(square, moves, chess) {
    this.selectionMode = true;
    const pieceMoves = moves.filter((m) => m.from === square);
    const piece = chess.get(square);

    this.boardRenderer.setSelectedSquare(square, pieceMoves);

    console.log(
      chalk.cyan.bold(
        `\n✓ Selected ${this.getPieceName(piece)} on ${square.toUpperCase()}`
      )
    );
    console.log(chalk.gray(`  ${pieceMoves.length} legal moves available`));

    const destinations = pieceMoves.map((m) => {
      const targetPiece = chess.get(m.to);
      if (targetPiece) {
        return `${m.to}(capture)`;
      }
      return m.to;
    });

    console.log(chalk.gray(`  Destinations: ${destinations.join(", ")}`));
  }

  exitSelectionMode() {
    this.selectionMode = false;
    this.boardRenderer.clearSelection();
  }

  isValidSquare(str) {
    if (!str || str.length !== 2) return false;
    const file = str[0].toLowerCase();
    const rank = str[1];
    return "abcdefgh".includes(file) && "12345678".includes(rank);
  }

  getPieceName(piece) {
    const names = {
      p: "Pawn",
      n: "Knight",
      b: "Bishop",
      r: "Rook",
      q: "Queen",
      k: "King",
    };
    return names[piece.type] || "Piece";
  }

  showHelp(moves, chess) {
    const movesByPiece = {};

    moves.forEach((move) => {
      const piece = chess.get(move.from);
      const key = `${piece.type}-${move.from}`;
      if (!movesByPiece[key]) {
        movesByPiece[key] = {
          piece: piece,
          moves: [],
        };
      }
      movesByPiece[key].moves.push(move);
    });

    const helpLines = [];
    helpLines.push(chalk.bold.cyan("Available Moves:\n"));

    Object.keys(movesByPiece).forEach((key) => {
      const { piece, moves: pieceMoves } = movesByPiece[key];
      const [type, from] = key.split("-");
      const pieceSymbol = this.themeManager.getPieceSymbol(piece);

      const moveNotations = pieceMoves.map((m) => {
        const targetPiece = chess.get(m.to);
        if (targetPiece) {
          return chalk.red(`${m.from}-${m.to}×`);
        }
        return `${m.from}-${m.to}`;
      });

      helpLines.push(`${pieceSymbol} ${from}: ${moveNotations.join(", ")}`);
    });

    helpLines.push(chalk.gray("\n× = capture"));
    helpLines.push(
      chalk.gray("Type a square (e.g., 'e2') to select and highlight moves")
    );

    console.log(
      boxen(helpLines.join("\n"), {
        padding: 1,
        margin: 1,
        borderStyle: "single",
        borderColor: this.themeManager.getBorderColor(),
        title: "Help",
        titleAlignment: "center",
      })
    );
  }
}

export default MoveInputHandler;
