import { Chess } from "chess.js";
import chalk from "chalk";
import inquirer from "inquirer";
import clear from "clear";
import boxen from "boxen";
import StockfishEngine from "../engines/stockfish.js";
import BoardRenderer from "./boardRenderer.js";
import MoveInputHandler from "./moveInputHandler.js";

class OfflineGame {
  constructor(themeManager) {
    this.chess = new Chess();
    this.themeManager = themeManager;
    this.stockfish = new StockfishEngine();
    this.boardRenderer = new BoardRenderer(themeManager);
    this.moveInputHandler = new MoveInputHandler(
      this.boardRenderer,
      themeManager
    );
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
    this.boardRenderer.renderBoard(this.chess, this.playerColor, {
      clear: true,
    });

    this.boardRenderer.displayStatus(
      this.chess,
      this.playerColor,
      this.isPlayerTurn,
      {
        opponent:
          chalk.yellow.bold("Stockfish 🤖") + ` (${this.stockfish.difficulty})`,
      }
    );

    if (this.gameStartTime) {
      const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      console.log(
        chalk.gray(
          `  Game time: ${minutes}:${seconds.toString().padStart(2, "0")}`
        )
      );
    }

    const history = this.chess.history();
    if (history.length > 0) {
      const lastFiveMoves = history.slice(-5);
      console.log(
        chalk.gray(
          `  Recent moves: ${lastFiveMoves.join(", ")} (Move ${history.length})`
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
    const result = await this.moveInputHandler.promptMove(
      this.chess,
      this.playerColor
    );

    switch (result.command) {
      case "continue":
        this.displayBoard();
        return this.playerMove();

      case "clear":
        this.displayBoard();
        return this.playerMove();

      case "hint":
        await this.showHint();
        return this.playerMove();

      case "quit":
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
        }
        return this.playerMove();
    }

    if (result.type === "move") {
      let promotion = result.promotion;
      if (promotion) {
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

      this.chess.move({
        from: result.from,
        to: result.to,
        promotion,
      });

      console.log(
        chalk.green(`\n✓ Move executed: ${result.from} → ${result.to}`)
      );
    }
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
