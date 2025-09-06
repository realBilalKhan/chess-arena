#! /usr/bin/env node

import { io } from "socket.io-client";
import { Chess } from "chess.js";
import chalk from "chalk";
import inquirer from "inquirer";
import figlet from "figlet";
import clear from "clear";
import boxen from "boxen";
import { ThemeManager } from "./themes/index.js";
import { ConfigManager } from "./config/config.js";
import {
  parseCliArgs,
  showHelp,
  listThemes,
  validateTheme,
} from "./utils/cliArgs.js";
import { selectThemeInteractively } from "./utils/themeSelector.js";
import OfflineGame from "./utils/offlineGame.js";
import BoardRenderer from "./utils/boardRenderer.js";
import MoveInputHandler from "./utils/moveInputHandler.js";
import SoundManager from "./utils/soundManager.js";
import PGNExporter from "./utils/pgnExporter.js";
import OpeningDetector from "./utils/openingDetector.js";

class ChessArena {
  constructor() {
    this.chess = new Chess();
    this.socket = null;
    this.roomCode = null;
    this.playerColor = null;
    this.isMyTurn = false;
    this.pgnExporter = new PGNExporter();
    this.configManager = new ConfigManager();
    this.themeManager = new ThemeManager();
    this.soundManager = new SoundManager(this.configManager);
    this.openingDetector = new OpeningDetector();

    const savedTheme = this.configManager.getTheme();
    if (savedTheme && savedTheme !== "classic") {
      this.themeManager.setTheme(savedTheme);
    }

    this.handleCliArgs();
    this.boardRenderer = new BoardRenderer(this.themeManager);
    this.moveInputHandler = new MoveInputHandler(
      this.boardRenderer,
      this.themeManager
    );
  }

  handleCliArgs() {
    const args = parseCliArgs();

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    if (args.showConfig) {
      this.showCurrentConfig();
      process.exit(0);
    }

    if (args.resetConfig) {
      this.resetConfig();
      process.exit(0);
    }

    if (args.listThemes) {
      listThemes();
      process.exit(0);
    }

    if (args.previewThemes) {
      this.previewAllThemes();
      process.exit(0);
    }

    if (args.theme) {
      if (!validateTheme(args.theme)) {
        process.exit(1);
      }
      this.themeManager.setTheme(args.theme);
      this.configManager.setTheme(args.theme);
      console.log(
        chalk.green(
          `🎨 Theme permanently set to: ${
            this.themeManager.getCurrentTheme().name
          }`
        )
      );
    }

    if (args.serverUrl) {
      this.configManager.setServerUrl(args.serverUrl);
      console.log(
        chalk.green(`🌐 Server URL permanently set to: ${args.serverUrl}`)
      );
    }

    if (args.sound) {
      this.soundManager.setEnabled(args.sound === "on");
      console.log(
        chalk.green(`🔊 Sound ${args.sound === "on" ? "enabled" : "disabled"}`)
      );
    }

    if (args.muteSound) {
      this.soundManager.setEnabled(false);
      console.log(chalk.gray("🔇 Sound muted"));
    }
  }

  showCurrentConfig() {
    const config = this.configManager.getConfig();
    const stats = this.configManager.getConfigStats();

    console.log(chalk.yellow.bold("\n🔧 Current Configuration\n"));

    console.log(`${chalk.bold("Theme:")} ${chalk.cyan(config.theme)}`);
    console.log(`${chalk.bold("Server URL:")} ${chalk.cyan(config.serverUrl)}`);
    console.log(
      `${chalk.bold("Sound:")} ${chalk.cyan(
        config.soundEnabled ? "Enabled" : "Disabled"
      )}`
    );
    console.log(
      `${chalk.bold("Config File:")} ${chalk.gray(
        this.configManager.getConfigPath()
      )}`
    );

    if (stats.exists) {
      console.log(
        `${chalk.bold("Last Updated:")} ${chalk.gray(
          stats.lastUpdated || "Unknown"
        )}`
      );
    } else {
      console.log(chalk.gray("Using default settings (no config file found)"));
    }

    console.log(`\n${chalk.gray("Use --reset-config to restore defaults")}`);
  }

  resetConfig() {
    console.log(chalk.yellow("🔄 Resetting configuration to defaults..."));

    const success = this.configManager.resetToDefaults();

    if (success) {
      console.log(chalk.green("✓ Configuration reset successfully!"));
      console.log(chalk.gray("Theme: classic"));
      console.log(chalk.gray("Server: http://bilalkhan.hackclub.app:3456"));
    } else {
      console.log(chalk.red("❌ Failed to reset configuration"));
    }
  }

  previewAllThemes() {
    const themeNames = this.themeManager.getThemeNames();
    console.log(chalk.yellow.bold("🎨 All Theme Previews\n"));

    themeNames.forEach((themeName) => {
      this.themeManager.setTheme(themeName);
      this.themeManager.previewTheme();
      console.log("\n" + "─".repeat(50) + "\n");
    });
  }

  async start() {
    clear();
    console.log(
      chalk.yellow(figlet.textSync("Chess Arena", { horizontalLayout: "full" }))
    );

    const currentTheme = this.themeManager.getCurrentTheme();
    console.log(
      boxen(
        `${chalk.bold("Current Theme:")} ${chalk.cyan(currentTheme.name)}\n` +
          `${chalk.gray(currentTheme.description)}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: currentTheme.borderColor || "cyan",
        }
      )
    );

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          "🌐 Play Online with a Friend",
          "🤖 Play Offline vs Stockfish",
          "🎨 Change theme",
          `🔊 Sound (${this.soundManager.isEnabled() ? "ON" : "OFF"})`,
          "📁 Manage saved games",
          "Exit",
        ],
      },
    ]);

    if (action.startsWith("🔊 Sound")) {
      const enabled = this.soundManager.toggle();
      console.log(
        chalk.green(`\n🔊 Sound ${enabled ? "enabled" : "disabled"}`)
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.start();
    }

    if (action === "Exit") {
      process.exit(0);
    }

    if (action === "🎨 Change theme") {
      const result = await selectThemeInteractively(this.themeManager);
      if (result && result.themeName) {
        this.themeManager.setTheme(result.themeName);
        this.configManager.setTheme(result.themeName);
        console.log(
          chalk.green(
            `\n🎨 Theme changed to: ${this.themeManager.getCurrentTheme().name}`
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      return this.start();
    }

    if (action === "📁 Manage saved games") {
      await this.manageSavedGames();
      return this.start();
    }

    if (action === "🤖 Play Offline vs Stockfish") {
      await this.startOfflineGame();
      return;
    }

    const { onlineAction } = await inquirer.prompt([
      {
        type: "list",
        name: "onlineAction",
        message: "Online Game Options:",
        choices: ["Create a new game", "Join a game", "Back"],
      },
    ]);

    if (onlineAction === "Back") {
      return this.start();
    }

    await this.connectToServer();

    if (onlineAction === "Create a new game") {
      await this.createGame();
    } else {
      await this.joinGame();
    }
  }

  async manageSavedGames() {
    while (true) {
      const games = this.pgnExporter.listSavedGames();

      if (games.length === 0) {
        console.log(chalk.yellow("\n📂 No saved games found."));
        console.log(
          chalk.gray("Games are automatically saved when you finish playing.")
        );

        await inquirer.prompt([
          {
            type: "input",
            name: "continue",
            message: "Press Enter to continue...",
          },
        ]);
        return;
      }

      const gameChoices = games.map((game) => ({
        name: `${game.filename} (${game.created.toLocaleDateString()})`,
        value: game.filename,
      }));

      gameChoices.push({ name: "← Back to main menu", value: "back" });

      const { selectedGame } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedGame",
          message: `📁 Saved Games (${games.length} total):`,
          choices: gameChoices,
          pageSize: 10,
        },
      ]);

      if (selectedGame === "back") {
        return;
      }

      const continueManaging = await this.handleGameAction(selectedGame);
      if (!continueManaging) {
        return;
      }
    }
  }

  async handleGameAction(selectedGame) {
    const { gameAction } = await inquirer.prompt([
      {
        type: "list",
        name: "gameAction",
        message: `What would you like to do with ${selectedGame}?`,
        choices: [
          "👀 View game content",
          "📋 Copy to clipboard",
          "🗑️ Delete game",
          "← Back to games list",
        ],
      },
    ]);

    switch (gameAction) {
      case "👀 View game content":
        const loadResult = this.pgnExporter.loadGame(selectedGame);
        if (loadResult.success) {
          console.log(chalk.cyan(`\n📋 Content of ${selectedGame}:`));
          console.log(chalk.gray("─".repeat(60)));
          console.log(loadResult.content);
          console.log(chalk.gray("─".repeat(60)));
        } else {
          console.log(chalk.red(`❌ Error loading game: ${loadResult.error}`));
        }

        await inquirer.prompt([
          {
            type: "input",
            name: "continue",
            message: "Press Enter to continue...",
          },
        ]);
        return true;

      case "📋 Copy to clipboard":
        const copyResult = this.pgnExporter.loadGame(selectedGame);
        if (copyResult.success) {
          console.log(chalk.cyan("\n📋 Game content (copy this):"));
          console.log(chalk.gray("─".repeat(60)));
          console.log(copyResult.content);
          console.log(chalk.gray("─".repeat(60)));
        } else {
          console.log(chalk.red(`❌ Error loading game: ${copyResult.error}`));
        }

        await inquirer.prompt([
          {
            type: "input",
            name: "continue",
            message: "Press Enter to continue...",
          },
        ]);
        return true;

      case "🗑️ Delete game":
        const { confirmDelete } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmDelete",
            message: chalk.red(
              `Are you sure you want to delete ${selectedGame}?`
            ),
            default: false,
          },
        ]);

        if (confirmDelete) {
          const deleteResult = this.pgnExporter.deleteGame(selectedGame);
          if (deleteResult.success) {
            console.log(chalk.green(`✓ Deleted ${selectedGame}`));
          } else {
            console.log(
              chalk.red(`❌ Error deleting game: ${deleteResult.error}`)
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return true;

      case "← Back to games list":
        return true;
      default:
        return true;
    }
  }

  async startOfflineGame() {
    const offlineGame = new OfflineGame(
      this.themeManager,
      this.configManager,
      this.pgnExporter
    );

    const initialized = await offlineGame.initialize();
    if (!initialized) {
      console.log(chalk.yellow("\n⏎ Press Enter to return to main menu..."));
      await inquirer.prompt([
        {
          type: "input",
          name: "continue",
          message: "",
        },
      ]);
      return this.start();
    }

    try {
      await offlineGame.playGame();
      await this.askPlayAgain();
    } catch (error) {
      console.error(chalk.red("Game error:", error.message));
      offlineGame.cleanup();
      await this.askPlayAgain();
    }
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      const serverUrl = this.configManager.getServerUrl();
      console.log(chalk.gray("🔄 Connecting to server..."));

      this.socket = io(serverUrl, {
        transports: ["websocket", "polling"],
      });

      const connectionTimeout = setTimeout(() => {
        this.socket.disconnect();
        console.log(
          chalk.red(
            "❌ Connection timeout. Please check your internet connection."
          )
        );
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket.once("connect", () => {
        clearTimeout(connectionTimeout);
        console.log(chalk.green("✓ Connected to server\n"));
        resolve();
      });

      this.socket.once("connect_error", (error) => {
        clearTimeout(connectionTimeout);
        console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
        reject(error);
      });

      this.socket.on("gameCreated", (data) => {
        this.roomCode = data.roomCode;
        this.playerColor = "white";
        console.log(chalk.green("\n🎮 Game created successfully!"));
        console.log(
          boxen(chalk.bold.yellow(`Room Code: ${data.roomCode}`), {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: this.themeManager.getBorderColor(),
          })
        );
        console.log(chalk.gray("📤 Share this code with your friend"));
        console.log(chalk.yellow("⏳ Waiting for opponent to join..."));
      });

      this.socket.on("gameJoined", (data) => {
        this.roomCode = data.roomCode;
        this.playerColor = "black";
        console.log(
          chalk.green(`\n✅ Successfully joined game: ${data.roomCode}`)
        );
        console.log(chalk.cyan("Preparing the board..."));
      });

      this.socket.on("gameStart", () => {
        console.log(
          chalk.green.bold("\n🎯 Opponent connected! Game starting...\n")
        );
        setTimeout(() => {
          console.log(
            chalk.cyanBright(
              `You are playing as ${chalk.bold(
                this.playerColor === "white" ? "WHITE ♔" : "BLACK ♚"
              )}`
            )
          );
          this.isMyTurn = this.playerColor === "white";
          setTimeout(() => {
            this.playGame();
          }, 1500);
        }, 1000);
      });

      this.socket.on("opponentMove", (move) => {
        const chessMove = this.chess.move(move);

        if (chessMove) {
          this.soundManager.playMoveSound(chessMove, this.chess);
        }

        this.isMyTurn = true;

        console.log(
          chalk.yellow(`\n⚡ Opponent moved: ${move.from} → ${move.to}`)
        );

        setTimeout(() => {
          this.displayBoard();

          if (this.chess.isGameOver()) {
            this.handleGameOver();
          } else {
            this.promptMove();
          }
        }, 1000);
      });

      this.socket.on("opponentDisconnected", () => {
        console.log(chalk.red.bold("\n📡 Connection Lost!"));
        console.log(chalk.red("Your opponent has disconnected from the game."));
        this.askPlayAgain();
      });

      this.socket.on("error", (error) => {
        console.log(chalk.red.bold("\n❌ ERROR"));
        console.log(chalk.red(`Details: ${error}`));
        this.askPlayAgain();
      });
    });
  }

  async createGame() {
    this.socket.emit("createGame");
  }

  async joinGame() {
    const { roomCode } = await inquirer.prompt([
      {
        type: "input",
        name: "roomCode",
        message: "Enter the room code:",
        validate: (input) => {
          return input.length === 6 ? true : "Room code must be 6 characters";
        },
      },
    ]);

    this.socket.emit("joinGame", roomCode.toUpperCase());
  }

  displayBoard() {
    this.boardRenderer.renderBoard(this.chess, this.playerColor, {
      clear: true,
    });
    ``;
    this.boardRenderer.displayStatus(
      this.chess,
      this.playerColor,
      this.isMyTurn,
      {
        opponent: this.roomCode
          ? `Online Player (Room: ${this.roomCode})`
          : null,
      }
    );

    const opening = this.openingDetector.detectOpening(this.chess);
    if (opening) {
      this.openingDetector.displayOpeningInfo(opening);
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

  async playGame() {
    this.soundManager.playGameStart();
    this.displayBoard();

    if (this.isMyTurn) {
      await this.promptMove();
    } else {
      console.log(chalk.gray("\n⏳ Waiting for opponent's move..."));
    }
  }

  async promptMove() {
    const result = await this.moveInputHandler.promptMove(
      this.chess,
      this.playerColor
    );

    switch (result.command) {
      case "continue":
        if (!result.skipRedraw) {
          this.displayBoard();
        }
        return this.promptMove();

      case "clear":
        this.displayBoard();
        return this.promptMove();

      case "hint":
        console.log(chalk.cyan("💡 Hint feature not available in online mode"));
        return this.promptMove();

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
          console.log(chalk.red("\n👋 Game abandoned. See you next time!\n"));
          process.exit(0);
        }
        return this.promptMove();
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

      const moveObj = {
        from: result.from,
        to: result.to,
        promotion,
      };

      try {
        const move = this.chess.move(moveObj);

        if (move) {
          this.soundManager.playMoveSound(move, this.chess);

          this.socket.emit("move", { roomCode: this.roomCode, move: moveObj });
          this.isMyTurn = false;

          console.log(
            chalk.green(`\n✓ Move executed: ${result.from} → ${result.to}`)
          );

          this.displayBoard();

          if (this.chess.isGameOver()) {
            this.handleGameOver();
          } else {
            console.log(chalk.gray("\n⏳ Waiting for opponent's move..."));
          }
        }
      } catch (error) {
        this.soundManager.playIllegalMove();
        console.log(
          chalk.red(`\n❌ Invalid move: ${result.from} → ${result.to}`)
        );
        console.log(chalk.yellow("Please try again."));
        return this.promptMove();
      }
    }
  }

  handleGameOver() {
    const moves = this.chess.history().length;
    const duration = Math.floor(moves / 2);

    let title = "Game Over";
    let message = "";
    let borderColor = this.themeManager.getBorderColor();
    let gameResult = "*";

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "Black" : "White";
      const isWinner = winner.toLowerCase() === this.playerColor;
      gameResult = winner === "White" ? "1-0" : "0-1";

      if (isWinner) {
        title = "🏆 Victory!";
        borderColor = "green";
        message = [
          chalk.green.bold("You won by checkmate!"),
          "",
          chalk.white("♔ ♕ ♖ ♗ ♘ ♙"),
        ].join("\n");
      } else {
        title = "💔 Defeat";
        borderColor = "red";
        message = [
          chalk.red.bold("You lost by checkmate."),
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
      chalk.gray(`• Estimated duration: ${duration} turns`);

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

    const gameInfo = {
      event: "Chess Arena Online Game",
      white: this.playerColor === "white" ? "Player" : "Opponent",
      black: this.playerColor === "black" ? "Player" : "Opponent",
      result: gameResult,
      isOffline: false,
      mode: "Online",
    };

    const exportResult = this.pgnExporter.exportGame(this.chess, gameInfo);
    this.pgnExporter.displayGameInfo(exportResult);

    this.askPlayAgain();
  }

  async askPlayAgain() {
    const { playAgain } = await inquirer.prompt([
      {
        type: "confirm",
        name: "playAgain",
        message: "Would you like to play again?",
        default: true,
      },
    ]);

    if (playAgain) {
      this.chess = new Chess();
      this.roomCode = null;
      this.playerColor = null;
      this.isMyTurn = false;
      this.openingDetector.reset(); // ADD THIS LINE
      if (this.socket) {
        this.socket.disconnect();
      }
      this.start();
    } else {
      console.log(chalk.yellow("\nThanks for playing Chess Arena!"));
      process.exit(0);
    }
  }
}

const game = new ChessArena();
game.start().catch(console.error);
