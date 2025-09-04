import { spawn } from "child_process";
import chalk from "chalk";

class StockfishEngine {
  constructor() {
    this.engine = null;
    this.isReady = false;
    this.currentPosition = "startpos";
    this.moveHistory = [];
    this.onMoveCallback = null;
    this.difficulty = "medium";

    this.difficultySettings = {
      easy: {
        skill: 1,
        depth: 5,
        moveTime: 1000,
        elo: 800,
        description: "Beginner level - Makes occasional mistakes",
      },
      medium: {
        skill: 10,
        depth: 10,
        moveTime: 2000,
        elo: 1500,
        description: "Intermediate level - Balanced gameplay",
      },
      hard: {
        skill: 20,
        depth: 15,
        moveTime: 3000,
        elo: 2500,
        description: "Expert level - Very challenging",
      },
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      try {
        const stockfishBinaries = [
          "stockfish",
          "stockfish.exe",
          "/usr/games/stockfish",
          "/usr/local/bin/stockfish",
          "/opt/homebrew/bin/stockfish",
        ];

        let engineStarted = false;

        for (const binary of stockfishBinaries) {
          if (engineStarted) break;

          try {
            this.engine = spawn(binary, [], {
              stdio: ["pipe", "pipe", "pipe"],
            });

            engineStarted = true;
            console.log(chalk.green(`✓ Stockfish engine found: ${binary}`));
          } catch (err) {
            continue;
          }
        }

        if (!engineStarted) {
          throw new Error(
            "Stockfish not found. Please install Stockfish first."
          );
        }

        this.engine.stdout.on("data", (data) => {
          const output = data.toString();

          if (output.includes("uciok")) {
            this.isReady = true;
            resolve();
          }

          if (output.includes("bestmove")) {
            this.handleBestMove(output);
          }
        });

        this.engine.stderr.on("data", (data) => {
          console.error(chalk.red("Stockfish error:", data.toString()));
        });

        this.engine.on("error", (error) => {
          reject(new Error(`Failed to start Stockfish: ${error.message}`));
        });

        this.engine.on("close", (code) => {
          console.log(
            chalk.yellow(`Stockfish engine closed with code ${code}`)
          );
        });

        this.sendCommand("uci");

        setTimeout(() => {
          this.applyDifficultySettings();
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  setDifficulty(level) {
    if (!this.difficultySettings[level]) {
      throw new Error(`Invalid difficulty level: ${level}`);
    }
    this.difficulty = level;
    this.applyDifficultySettings();
  }

  applyDifficultySettings() {
    if (!this.engine) return;

    const settings = this.difficultySettings[this.difficulty];

    this.sendCommand(`setoption name Skill Level value ${settings.skill}`);

    if (this.difficulty === "easy") {
      this.sendCommand("setoption name UCI_LimitStrength value true");
      this.sendCommand(`setoption name UCI_Elo value ${settings.elo}`);
    } else {
      this.sendCommand("setoption name UCI_LimitStrength value false");
    }

    this.sendCommand("setoption name Hash value 128");
  }

  sendCommand(command) {
    if (this.engine && this.engine.stdin) {
      this.engine.stdin.write(command + "\n");
    }
  }

  handleBestMove(output) {
    const match = output.match(/bestmove\s(\S+)/);
    if (match && this.onMoveCallback) {
      const move = match[1];
      this.onMoveCallback(this.parseUCIMove(move));
    }
  }

  parseUCIMove(uciMove) {
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

    return { from, to, promotion };
  }

  async makeMove(fen) {
    return new Promise((resolve) => {
      this.onMoveCallback = resolve;

      this.sendCommand(`position fen ${fen}`);

      const settings = this.difficultySettings[this.difficulty];
      this.sendCommand(
        `go depth ${settings.depth} movetime ${settings.moveTime}`
      );
    });
  }

  newGame() {
    this.sendCommand("ucinewgame");
    this.sendCommand("position startpos");
    this.moveHistory = [];
  }

  quit() {
    if (this.engine) {
      this.sendCommand("quit");
      this.engine.kill();
      this.engine = null;
    }
  }

  isAvailable() {
    return this.engine !== null && this.isReady;
  }

  getDifficultyInfo() {
    return this.difficultySettings[this.difficulty];
  }

  getAllDifficulties() {
    return Object.entries(this.difficultySettings).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: key,
      description: value.description,
      elo: value.elo,
    }));
  }
}

export default StockfishEngine;
