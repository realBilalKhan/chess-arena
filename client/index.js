#! /usr/bin/env node

import { io } from "socket.io-client";
import { Chess } from "chess.js";
import chalk from "chalk";
import inquirer from "inquirer";
import figlet from "figlet";
import clear from "clear";
import boxen from "boxen";

class ChessArena {
  constructor() {
    this.chess = new Chess();
    this.socket = null;
    this.roomCode = null;
    this.playerColor = null;
    this.isMyTurn = false;
    this.serverUrl =
      process.env.CHESS_SERVER_URL || "http://bilalkhan.hackclub.app:3456";
  }

  async start() {
    clear();
    console.log(
      chalk.yellow(figlet.textSync("Chess Arena", { horizontalLayout: "full" }))
    );

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: ["Create a new game", "Join a game", "Exit"],
      },
    ]);

    if (action === "Exit") {
      process.exit(0);
    }

    this.connectToServer();

    if (action === "Create a new game") {
      await this.createGame();
    } else {
      await this.joinGame();
    }
  }

  connectToServer() {
    this.socket = io(this.serverUrl, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log(chalk.green("✓ Connected to server"));
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
          borderColor: "cyan",
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
      this.chess.move(move);
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
    clear();

    const board = this.chess.board();
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks =
      this.playerColor === "white"
        ? [8, 7, 6, 5, 4, 3, 2, 1]
        : [1, 2, 3, 4, 5, 6, 7, 8];
    const displayFiles =
      this.playerColor === "white" ? files : [...files].reverse();

    console.log("     ╔" + "════╤════╤════╤════╤════╤════╤════╤════" + "╗");

    console.log(
      "     ║  " +
        displayFiles
          .map((f) => chalk.bold.magenta(f.toUpperCase()))
          .join("  │  ") +
        "  ║"
    );
    console.log("     ╟" + "────┼────┼────┼────┼────┼────┼────┼────" + "╢");

    ranks.forEach((rank, rankIndex) => {
      const row = board[8 - rank];
      let rowDisplay = "  " + chalk.bold.magenta(rank) + "  ║";

      row.forEach((square, fileIndex) => {
        const file = this.playerColor === "white" ? fileIndex : 7 - fileIndex;
        const piece = row[file];

        const isLightSquare = (rank + file) % 2 === 0;
        const squareBg = isLightSquare
          ? chalk.bgHex("#eeeed2")
          : chalk.bgHex("#769656");

        let pieceDisplay = "    ";
        if (piece) {
          const symbol = this.getPieceSymbol(piece);
          if (piece.color === "white") {
            pieceDisplay = " " + chalk.bold.white(symbol) + "  ";
          } else {
            pieceDisplay = " " + chalk.bold.hex("#2C2C2C")(symbol) + "  ";
          }
        }

        rowDisplay += squareBg(pieceDisplay);

        if (fileIndex < 7) {
          rowDisplay += "│";
        }
      });

      rowDisplay += "║ " + chalk.bold.magenta(rank);
      console.log(rowDisplay);

      if (rankIndex < 7) {
        console.log("     ╟" + "────┼────┼────┼────┼────┼────┼────┼────" + "╢");
      }
    });

    console.log("     ╟" + "────┼────┼────┼────┼────┼────┼────┼────" + "╢");
    console.log(
      "     ║  " +
        displayFiles
          .map((f) => chalk.bold.magenta(f.toUpperCase()))
          .join("  │  ") +
        "  ║"
    );
    console.log("     ╚" + "════╧════╧════╧════╧════╧════╧════╧════" + "╝");
    console.log();

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

    const statusMsg = this.isMyTurn
      ? chalk.greenBright.bold("YOUR TURN!")
      : chalk.yellowBright("Waiting for opponent...");
    lines.push(`${chalk.bold("Status:")} ${statusMsg}`);

    console.log(
      boxen(lines.join("\n"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: "Status",
        titleAlignment: "center",
      })
    );

    const moveCount = this.chess.history().length;
    if (moveCount > 0) {
      const lastMove = this.chess.history()[moveCount - 1];
      console.log(chalk.gray(`\n  Last move: ${lastMove} (Move ${moveCount})`));
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
          capturedWhite.push(this.getPieceSymbol(capturedPiece));
        } else {
          capturedBlack.push(this.getPieceSymbol(capturedPiece));
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

  getPieceSymbol(piece) {
    const symbols = {
      white: {
        k: "♔",
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
        p: "♙",
      },
      black: {
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟",
      },
    };
    const colorKey = piece.color === "w" ? "white" : "black";
    return symbols[colorKey][piece.type] || piece.type.toUpperCase();
  }

  async playGame() {
    this.displayBoard();

    if (this.isMyTurn) {
      await this.promptMove();
    } else {
      console.log(chalk.gray("\n⏳ Waiting for opponent's move..."));
    }
  }

  async promptMove() {
    const moves = this.chess.moves({ verbose: true });
    const moveStrings = moves.map((m) => `${m.from}-${m.to}`);

    const { moveInput } = await inquirer.prompt([
      {
        type: "input",
        name: "moveInput",
        message:
          'Enter your move (e.g. e2-e4), or type "help" for moves / "quit" to exit:',
        validate: (input) => {
          if (input.toLowerCase() === "help") return true;
          if (input.toLowerCase() === "quit") return true;

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

    if (moveInput.toLowerCase() === "help") {
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
          const pieceSymbol = this.getPieceSymbol({
            type,
            color: this.chess.turn() === "w" ? "white" : "black",
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
          borderColor: "cyan",
          title: "Legal Moves",
          titleAlignment: "center",
        })
      );

      return this.promptMove();
    }

    if (moveInput.toLowerCase() === "quit") {
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
      } else {
        return this.promptMove();
      }
    }

    const [from, to] = moveInput.split("-");
    const move = moves.find((m) => m.from === from && m.to === to);

    let promotion = undefined;
    if (move.promotion) {
      console.log(chalk.yellow("\n♟ Pawn promotion!"));
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

    const moveObj = { from, to, promotion };
    this.chess.move(moveObj);
    this.socket.emit("move", { roomCode: this.roomCode, move: moveObj });
    this.isMyTurn = false;

    console.log(chalk.green(`\n✓ Move executed: ${from} → ${to}`));

    this.displayBoard();

    if (this.chess.isGameOver()) {
      this.handleGameOver();
    } else {
      console.log(chalk.gray("\n⏳ Waiting for opponent's move..."));
    }
  }

  handleGameOver() {
    const moves = this.chess.history().length;
    const duration = Math.floor(moves / 2);

    let title = "Game Over";
    let message = "";
    let borderColor = "yellow";

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "Black" : "White";
      const isWinner = winner.toLowerCase() === this.playerColor;

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
    } else if (this.chess.isDraw()) {
      title = "🤝 Draw";
      borderColor = "cyan";
      message = [
        chalk.cyan("The game ended in a draw!"),
        "",
        chalk.white("Neither player wins"),
      ].join("\n");
    } else if (this.chess.isStalemate()) {
      title = "⚖️ Stalemate";
      borderColor = "cyan";
      message = [
        chalk.cyan("No legal moves - game is a draw!"),
        "",
        chalk.white("An honorable end"),
      ].join("\n");
    } else if (this.chess.isThreefoldRepetition()) {
      title = "🔄 Threefold Repetition";
      borderColor = "cyan";
      message = chalk.cyan("Position repeated 3 times - draw!");
    } else if (this.chess.isInsufficientMaterial()) {
      title = "⚠️ Insufficient Material";
      borderColor = "cyan";
      message = chalk.cyan("Not enough pieces to checkmate - draw!");
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
      if (this.socket) {
        this.socket.disconnect();
      }
      this.start();
    } else {
      console.log(chalk.yellow("\nThanks for playing Terminal Chess!"));
      process.exit(0);
    }
  }
}

const game = new ChessArena();
game.start().catch(console.error);
