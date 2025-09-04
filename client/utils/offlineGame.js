import { Chess } from "chess.js";
import chalk from "chalk";
import inquirer from "inquirer";
import clear from "clear";
import boxen from "boxen";
import StockfishEngine from "../engines/stockfish.js";

class OfflineGame {
  constructor(themeManager) {
    this.chess = new Chess();
    this.themeManager = themeManager;
    this.stockfish = new StockfishEngine();
    this.playerColor = "white";
    this.isPlayerTurn = true;
    this.moveCount = 0;
    this.gameStartTime = null;
    this.thinking = false;
  }

  async initialize() {
    try {
      console.log(chalk.yellow("🔧 Initializing Stockfish engine..."));
      await this.stockfish.init();
      console.log(chalk.green("✓ Stockfish engine ready!"));
      return true;
    } catch (error) {
      console.log(
        boxen(
          chalk.red.bold("⚠️  Stockfish Not Found\n\n") +
            chalk.white("To play offline, you need to install Stockfish:\n\n") +
            chalk.cyan("• macOS: ") +
            chalk.gray("brew install stockfish\n") +
            chalk.cyan("• Ubuntu/Debian: ") +
            chalk.gray("sudo apt-get install stockfish\n") +
            chalk.cyan("• Windows: ") +
            chalk.gray("Download from stockfishchess.org\n") +
            chalk.cyan("• Arch Linux: ") +
            chalk.gray("sudo pacman -S stockfish"),
          {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "red",
          }
        )
      );
      return false;
    }
  }

  async setupGame() {
    clear();

    console.log(
      boxen(
        chalk.bold.cyan("🤖 Play vs Stockfish\n") +
          chalk.gray("Challenge yourself against the AI"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: this.themeManager.getBorderColor(),
        }
      )
    );

    const difficulties = this.stockfish.getAllDifficulties();
    const { difficulty } = await inquirer.prompt([
      {
        type: "list",
        name: "difficulty",
        message: "Select difficulty level:",
        choices: difficulties.map((d) => ({
          name: `${d.name} - ${d.description} (ELO ~${d.elo})`,
          value: d.value,
        })),
      },
    ]);

    this.stockfish.setDifficulty(difficulty);

    const { color } = await inquirer.prompt([
      {
        type: "list",
        name: "color",
        message: "Choose your color:",
        choices: [
          { name: "♔ White - Play first", value: "white" },
          { name: "♚ Black - Play second", value: "black" },
        ],
      },
    ]);

    this.playerColor = color;
    this.isPlayerTurn = color === "white";

    this.stockfish.newGame();
    this.gameStartTime = Date.now();

    console.log(chalk.green("\n🎮 Game started!"));
    console.log(
      chalk.cyan(
        `You are playing as ${color === "white" ? "WHITE ♔" : "BLACK ♚"}`
      )
    );
    console.log(
      chalk.yellow(
        `Difficulty: ${difficulty.toUpperCase()} (${
          this.stockfish.getDifficultyInfo().description
        })`
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async playGame() {
    await this.setupGame();

    while (!this.chess.isGameOver()) {
      this.displayBoard();

      if (this.isPlayerTurn) {
        await this.playerMove();
      } else {
        await this.stockfishMove();
      }

      this.moveCount++;
      this.isPlayerTurn = !this.isPlayerTurn;
    }

    this.handleGameOver();
  }

  displayBoard() {
    clear();

    const board = this.chess.board();
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks =
      this.playerColor === "white"
        ? [8, 7, 6, 5, 4, 3, 2, 1]
        : [1, 2, 3, 4, 5, 6, 7, 8];
    const displayFiles =
      this.playerColor === "white" ? files : [...files].reverse();

    console.log(
      "     " + displayFiles.map((f) => chalk.bold.gray(f)).join("       ")
    );

    ranks.forEach((rank) => {
      const row = board[8 - rank];
      const displayRow =
        this.playerColor === "white" ? row : [...row].reverse();

      for (let line = 0; line < 3; line++) {
        let rowDisplay = "";

        if (line === 1) {
          rowDisplay += chalk.bold.gray(rank) + " ";
        } else {
          rowDisplay += "  ";
        }

        displayRow.forEach((piece, displayIndex) => {
          const actualFileIndex =
            this.playerColor === "white" ? displayIndex : 7 - displayIndex;
          const isLightSquare = (rank + actualFileIndex) % 2 === 0;
          const squareBg = this.themeManager.getSquareStyle(isLightSquare);

          let pieceDisplay = "        ";

          if (line === 1 && piece) {
            const symbol = this.themeManager.getPieceSymbol(piece);
            const pieceColor = this.themeManager.getPieceColor(
              piece.color === "w"
            );
            pieceDisplay = "   " + pieceColor(symbol) + "    ";
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

    this.displayGameStatus();
  }

  displayGameStatus() {
    const lines = [];

    if (this.chess.inCheck()) {
      lines.push(
        chalk.redBright.bold("⚠️  CHECK! Your king is under attack!\n")
      );
    }

    const currentTurn = this.chess.turn() === "w" ? "White" : "Black";
    const turnColor =
      this.chess.turn() === "w" ? chalk.white : chalk.hex("#2C2C2C");
    lines.push(
      `${chalk.bold("Current Turn:")} ${turnColor.bold(
        `${currentTurn} ${this.chess.turn() === "w" ? "♔" : "♚"}`
      )}`
    );

    const yourSymbol = this.playerColor === "white" ? "♔" : "♚";
    lines.push(
      `${chalk.bold("You are:")} ${chalk.cyan.bold(
        `${this.playerColor.toUpperCase()} ${yourSymbol}`
      )}`
    );

    lines.push(
      `${chalk.bold("Opponent:")} ${chalk.yellow.bold("Stockfish 🤖")} (${
        this.stockfish.difficulty
      })`
    );

    const statusMsg = this.isPlayerTurn
      ? chalk.greenBright.bold("YOUR TURN!")
      : this.thinking
      ? chalk.yellowBright("Stockfish is thinking... 🤔")
      : chalk.yellowBright("Stockfish's turn");
    lines.push(`${chalk.bold("Status:")} ${statusMsg}`);

    if (this.gameStartTime) {
      const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      lines.push(
        `${chalk.bold("Duration:")} ${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`
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

    const history = this.chess.history();
    if (history.length > 0) {
      const lastFiveMoves = history.slice(-5);
      console.log(
        chalk.gray(
          `\n  Recent moves: ${lastFiveMoves.join(", ")} (Move ${
            history.length
          })`
        )
      );
    }

    this.displayCapturedPieces();
  }

  displayCapturedPieces() {
    const history = this.chess.history({ verbose: true });
    const capturedWhite = [];
    const capturedBlack = [];

    history.forEach((move) => {
      if (move.captured) {
        const capturedPiece = {
          type: move.captured,
          color: move.color === "w" ? "black" : "white",
        };

        if (capturedPiece.color === "white") {
          capturedWhite.push(this.themeManager.getPieceSymbol(capturedPiece));
        } else {
          capturedBlack.push(this.themeManager.getPieceSymbol(capturedPiece));
        }
      }
    });

    if (capturedWhite.length > 0 || capturedBlack.length > 0) {
      console.log(chalk.gray("\n  Captured pieces:"));
      if (capturedWhite.length > 0) {
        console.log("  " + chalk.white("White: ") + capturedWhite.join(" "));
      }
      if (capturedBlack.length > 0) {
        console.log(
          "  " + chalk.hex("#2C2C2C")("Black: ") + capturedBlack.join(" ")
        );
      }
    }
  }

  async playerMove() {
    const moves = this.chess.moves({ verbose: true });

    const { moveInput } = await inquirer.prompt([
      {
        type: "input",
        name: "moveInput",
        message: 'Your move (e.g. e2-e4) | "help", "hint", "quit":',
        validate: (input) => {
          const lowerInput = input.toLowerCase();
          if (["help", "quit", "hint"].includes(lowerInput)) return true;

          const parts = input.split("-");
          if (parts.length !== 2)
            return "Invalid format. Use: from-to (e.g., e2-e4)";

          const [from, to] = parts;
          const move = moves.find((m) => m.from === from && m.to === to);

          if (!move) {
            return 'Illegal move. Type "help" to see legal moves.';
          }

          return true;
        },
      },
    ]);

    const lowerInput = moveInput.toLowerCase();

    if (lowerInput === "help") {
      this.showLegalMoves(moves);
      return this.playerMove();
    }

    if (lowerInput === "hint") {
      await this.showHint();
      return this.playerMove();
    }

    if (lowerInput === "quit") {
      const { confirmQuit } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmQuit",
          message: chalk.red("Are you sure you want to quit?"),
          default: false,
        },
      ]);

      if (confirmQuit) {
        this.stockfish.quit();
        console.log(chalk.red("\n👋 Game abandoned. See you next time!\n"));
        process.exit(0);
      } else {
        return this.playerMove();
      }
    }

    const [from, to] = moveInput.split("-");
    const move = moves.find((m) => m.from === from && m.to === to);

    let promotion = undefined;
    if (move.promotion) {
      const { piece } = await inquirer.prompt([
        {
          type: "list",
          name: "piece",
          message: chalk.bold.cyan("Choose your promotion piece:"),
          choices: [
            { name: "♕ Queen", value: "q" },
            { name: "♖ Rook", value: "r" },
            { name: "♗ Bishop", value: "b" },
            { name: "♘ Knight", value: "n" },
          ],
        },
      ]);
      promotion = piece;
    }

    this.chess.move({ from, to, promotion });
    console.log(chalk.green(`\n✓ Move executed: ${from} → ${to}`));
  }

  async stockfishMove() {
    this.thinking = true;
    this.displayBoard();

    console.log(chalk.yellow("\n🤔 Stockfish is analyzing the position..."));

    if (this.stockfish.difficulty === "easy") {
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 1000)
      );
    }

    const fen = this.chess.fen();
    const move = await this.stockfish.makeMove(fen);

    this.thinking = false;

    if (move) {
      try {
        this.chess.move(move);
        console.log(
          chalk.yellow(`\n⚡ Stockfish moved: ${move.from} → ${move.to}`)
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(chalk.red("Invalid move from Stockfish:", error));
      }
    }
  }

  async showHint() {
    console.log(chalk.cyan("\n💡 Getting hint from Stockfish..."));

    const fen = this.chess.fen();
    const suggestedMove = await this.stockfish.makeMove(fen);

    if (suggestedMove) {
      console.log(
        boxen(
          chalk.cyan.bold("💡 Hint\n") +
            chalk.white(
              `Consider moving: ${chalk.yellow.bold(
                `${suggestedMove.from} → ${suggestedMove.to}`
              )}`
            ),
          {
            padding: 1,
            margin: 1,
            borderStyle: "single",
            borderColor: "cyan",
          }
        )
      );
    }
  }

  showLegalMoves(moves) {
    const movesByPiece = {};
    moves.forEach((move) => {
      const piece = this.chess.get(move.from);
      const key = `${piece.type}-${move.from}`;
      if (!movesByPiece[key]) {
        movesByPiece[key] = [];
      }
      movesByPiece[key].push(`${move.from}-${move.to}`);
    });

    const movesList = Object.keys(movesByPiece)
      .map((key) => {
        const [type, from] = key.split("-");
        const pieceSymbol = this.themeManager.getPieceSymbol({
          type,
          color: this.chess.turn() === "w" ? "w" : "b",
        });
        const movesStr = movesByPiece[key].join(", ");
        return `${pieceSymbol} ${from}: ${movesStr}`;
      })
      .join("\n");

    console.log(
      boxen(movesList, {
        padding: 1,
        margin: 1,
        borderStyle: "single",
        borderColor: this.themeManager.getBorderColor(),
        title: "Legal Moves",
        titleAlignment: "center",
      })
    );
  }

  handleGameOver() {
    const moves = this.chess.history().length;
    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    let title = "Game Over";
    let message = "";
    let borderColor = this.themeManager.getBorderColor();

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "Black" : "White";
      const isPlayerWinner = winner.toLowerCase() === this.playerColor;

      if (isPlayerWinner) {
        title = "🏆 Victory!";
        borderColor = "green";
        message = [
          chalk.green.bold("You defeated Stockfish!"),
          "",
          chalk.white("♔ ♕ ♖ ♗ ♘ ♙"),
        ].join("\n");
      } else {
        title = "💔 Defeat";
        borderColor = "red";
        message = [
          chalk.red.bold("Stockfish wins by checkmate."),
          "",
          chalk.gray("♚ ♛ ♜ ♝ ♞ ♟"),
        ].join("\n");
      }
    } else if (this.chess.isDraw()) {
      title = "🤝 Draw";
      borderColor = "cyan";
      message = chalk.cyan("The game ended in a draw!");
    } else if (this.chess.isStalemate()) {
      title = "⚖️ Stalemate";
      borderColor = "cyan";
      message = chalk.cyan("No legal moves - game is a draw!");
    }

    message +=
      "\n\n" +
      chalk.gray("Game Statistics:") +
      "\n" +
      chalk.gray(`• Total moves: ${moves}`) +
      "\n" +
      chalk.gray(
        `• Duration: ${minutes}:${seconds.toString().padStart(2, "0")}`
      ) +
      "\n" +
      chalk.gray(`• Difficulty: ${this.stockfish.difficulty}`);

    console.log(
      boxen(message, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor,
        title,
        titleAlignment: "center",
      })
    );

    this.stockfish.quit();
  }

  async cleanup() {
    if (this.stockfish) {
      this.stockfish.quit();
    }
  }
}

export default OfflineGame;
