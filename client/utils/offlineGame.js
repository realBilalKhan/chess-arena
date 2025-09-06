import { Chess } from "chess.js";
import chalk from "chalk";
import inquirer from "inquirer";
import clear from "clear";
import boxen from "boxen";
import StockfishEngine from "../engines/stockfish.js";
import BoardRenderer from "./boardRenderer.js";
import MoveInputHandler from "./moveInputHandler.js";
import SoundManager from "./soundManager.js";
import OpeningDetector from "./openingDetector.js";

class OfflineGame {
  constructor(themeManager, configManager, pgnExporter) {
    this.chess = new Chess();
    this.themeManager = themeManager;
    this.configManager = configManager;
    this.pgnExporter = pgnExporter;
    this.stockfish = new StockfishEngine();
    this.boardRenderer = new BoardRenderer(themeManager);
    this.moveInputHandler = new MoveInputHandler(
      this.boardRenderer,
      themeManager
    );
    this.soundManager = new SoundManager(configManager);
    this.openingDetector = new OpeningDetector();
    this.playerColor = "white";
    this.isPlayerTurn = true;
    this.moveCount = 0;
    this.gameStartTime = null;
    this.thinking = false;

    this.moveEvaluations = [];
    this.enableEvaluation = true;
    this.lastPositionEval = null;
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

    const { evaluation } = await inquirer.prompt([
      {
        type: "confirm",
        name: "evaluation",
        message:
          "Enable move evaluation? (Shows if moves are excellent, mistakes, blunders)",
        default: true,
      },
    ]);

    this.enableEvaluation = evaluation;
    this.playerColor = color;
    this.isPlayerTurn = color === "white";

    this.stockfish.newGame();
    this.gameStartTime = Date.now();

    if (this.enableEvaluation) {
      console.log(chalk.gray("📊 Analyzing starting position..."));
      this.lastPositionEval = await this.stockfish.evaluatePosition(
        this.chess.fen()
      );
    }

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

    if (this.enableEvaluation) {
      console.log(chalk.gray("📊 Move evaluation: ENABLED"));
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async playGame() {
    await this.setupGame();

    this.soundManager.playGameStart();

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

    const opening = this.openingDetector.detectOpening(this.chess);
    if (opening) {
      this.openingDetector.displayOpeningInfo(opening);
    }

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

    this.displayRecentEvaluations();
    this.displayCapturedPieces();
  }

  displayRecentEvaluations() {
    if (!this.enableEvaluation || this.moveEvaluations.length === 0) return;

    const recentEvals = this.moveEvaluations.slice(-3);

    console.log(chalk.gray("\n  📊 Move Analysis:"));
    recentEvals.forEach((evaluation, index) => {
      const moveNumber =
        this.moveEvaluations.length - recentEvals.length + index + 1;
      const color = evaluation.color || chalk.gray;
      console.log(
        `    ${moveNumber}. ${evaluation.move} ${evaluation.symbol} ${color(
          evaluation.description
        )} ${evaluation.centipawns > 0 ? `(-${evaluation.centipawns}cp)` : ""}`
      );
    });
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

  async evaluateMove(move, isPlayerMove = true) {
    if (!this.enableEvaluation) return null;

    try {
      const currentEval = await this.stockfish.evaluatePosition(
        this.chess.fen()
      );

      if (this.lastPositionEval && currentEval) {
        const evaluation = this.stockfish.evaluateMoveQuality(
          this.lastPositionEval,
          currentEval,
          isPlayerMove
        );

        this.moveEvaluations.push({
          move: move,
          ...evaluation,
        });

        this.lastPositionEval = currentEval;

        return evaluation;
      }
    } catch (error) {
      console.error(chalk.red("Error evaluating move:", error));
    }

    return null;
  }

  async playerMove() {
    const result = await this.moveInputHandler.promptMove(
      this.chess,
      this.playerColor
    );

    switch (result.command) {
      case "continue":
        if (!result.skipRedraw) {
          this.displayBoard();
        }
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

      try {
        const chessMove = this.chess.move({
          from: result.from,
          to: result.to,
          promotion,
        });

        if (chessMove) {
          this.soundManager.playMoveSound(chessMove, this.chess);

          console.log(
            chalk.green(`\n✓ Move executed: ${result.from} → ${result.to}`)
          );

          if (this.enableEvaluation) {
            console.log(chalk.gray("📊 Analyzing move..."));
            const evaluation = await this.evaluateMove(chessMove.san, true);

            if (evaluation) {
              console.log(
                `${evaluation.symbol} ${evaluation.color(
                  evaluation.description
                )}` +
                  (evaluation.centipawns > 0
                    ? ` (-${evaluation.centipawns}cp)`
                    : "")
              );

              if (evaluation.quality === "blunder") {
                this.soundManager.playSound("blunder");
              } else if (evaluation.quality === "excellent") {
                this.soundManager.playSound("excellent");
              }
            }
          }
        }
      } catch (error) {
        this.soundManager.playIllegalMove();
        console.log(
          chalk.red(`\n❌ Invalid move: ${result.from} → ${result.to}`)
        );
        console.log(chalk.yellow("Please try again."));
        return this.playerMove();
      }
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
        const chessMove = this.chess.move(move);

        if (chessMove) {
          this.soundManager.playMoveSound(chessMove, this.chess);

          console.log(
            chalk.yellow(`\n⚡ Stockfish moved: ${move.from} → ${move.to}`)
          );

          if (this.enableEvaluation) {
            const evaluation = await this.evaluateMove(chessMove.san, false);

            if (evaluation) {
              console.log(
                chalk.gray(
                  `📊 ${evaluation.symbol} ${evaluation.description}` +
                    (evaluation.centipawns > 0
                      ? ` (-${evaluation.centipawns}cp)`
                      : "")
                )
              );
            }
          }
        }

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

  displayGameSummary() {
    if (!this.enableEvaluation || this.moveEvaluations.length === 0) return;

    console.log(
      boxen(
        chalk.bold.cyan("📊 Game Analysis Summary\n") +
          this.generateMoveQualityStats(),
        {
          padding: 1,
          margin: 1,
          borderStyle: "single",
          borderColor: "cyan",
        }
      )
    );
  }

  generateMoveQualityStats() {
    const playerMoves = this.moveEvaluations.filter((_, index) =>
      this.playerColor === "white" ? index % 2 === 0 : index % 2 === 1
    );

    const stockfishMoves = this.moveEvaluations.filter((_, index) =>
      this.playerColor === "white" ? index % 2 === 1 : index % 2 === 0
    );

    const getStats = (moves) => {
      const qualities = moves.reduce((acc, move) => {
        acc[move.quality] = (acc[move.quality] || 0) + 1;
        return acc;
      }, {});

      return qualities;
    };

    const playerStats = getStats(playerMoves);
    const stockfishStats = getStats(stockfishMoves);

    let summary = chalk.white("Your moves:\n");
    Object.entries(playerStats).forEach(([quality, count]) => {
      summary += `  ${this.stockfish.getQualitySymbol(
        quality
      )} ${quality}: ${count}\n`;
    });

    summary += chalk.gray("\nStockfish moves:\n");
    Object.entries(stockfishStats).forEach(([quality, count]) => {
      summary += `  ${this.stockfish.getQualitySymbol(
        quality
      )} ${quality}: ${count}\n`;
    });

    return summary;
  }

  handleGameOver() {
    const moves = this.chess.history().length;
    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    let title = "Game Over";
    let message = "";
    let borderColor = this.themeManager.getBorderColor();
    let gameResult = "*";

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "Black" : "White";
      const isPlayerWinner = winner.toLowerCase() === this.playerColor;
      gameResult = winner === "White" ? "1-0" : "0-1";

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
    } else if (
      this.chess.isDraw() ||
      this.chess.isStalemate() ||
      this.chess.isThreefoldRepetition() ||
      this.chess.isInsufficientMaterial()
    ) {
      gameResult = "1/2-1/2";
      this.soundManager.playSound("draw");

      if (this.chess.isStalemate()) {
        title = "⚖️ Stalemate";
        message = chalk.cyan("No legal moves - game is a draw!");
      } else if (this.chess.isThreefoldRepetition()) {
        title = "🔄 Threefold Repetition";
        message = chalk.cyan("Position repeated 3 times - draw!");
      } else if (this.chess.isInsufficientMaterial()) {
        title = "⚠️ Insufficient Material";
        message = chalk.cyan("Not enough pieces to checkmate - draw!");
      } else {
        title = "🤝 Draw";
        message = chalk.cyan("The game ended in a draw!");
      }
      borderColor = "cyan";
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

    this.displayGameSummary();

    const gameInfo = {
      event: "Chess Arena vs Stockfish",
      white: this.playerColor === "white" ? "Player" : "Stockfish",
      black: this.playerColor === "black" ? "Player" : "Stockfish",
      result: gameResult,
      isOffline: true,
      mode: "Computer",
      timeControl: "-",
    };

    const exportResult = this.pgnExporter.exportGame(this.chess, gameInfo);
    this.pgnExporter.displayGameInfo(exportResult);

    this.stockfish.quit();
  }

  async cleanup() {
    if (this.stockfish) {
      this.stockfish.quit();
    }
  }
}

export default OfflineGame;
