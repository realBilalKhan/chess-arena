import { spawn } from "child_process";
import chalk from "chalk";

class StockfishEngine {
  constructor() {
    this.engine = null;
    this.isReady = false;
    this.currentPosition = "startpos";
    this.moveHistory = [];
    this.onMoveCallback = null;
    this.onEvaluationCallback = null;
    this.difficulty = "medium";
    this.evaluationDepth = 12;

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

          if (output.includes("info depth") && this.onEvaluationCallback) {
            this.handleEvaluation(output);
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

  handleEvaluation(output) {
    const lines = output.split("\n");
    let bestEvaluation = null;
    let bestDepth = 0;

    for (const line of lines) {
      if (line.includes("info depth")) {
        const depthMatch = line.match(/depth (\d+)/);
        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);

        if (depthMatch && scoreMatch) {
          const depth = parseInt(depthMatch[1]);
          const scoreType = scoreMatch[1];
          const scoreValue = parseInt(scoreMatch[2]);

          if (depth >= bestDepth) {
            bestDepth = depth;
            bestEvaluation = {
              type: scoreType,
              value: scoreValue,
              depth: depth,
            };
          }
        }
      }
    }

    if (
      bestEvaluation &&
      this.onEvaluationCallback &&
      bestDepth >= this.evaluationDepth
    ) {
      this.onEvaluationCallback(bestEvaluation);
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

  async evaluatePosition(fen) {
    return new Promise((resolve) => {
      this.onEvaluationCallback = resolve;

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${this.evaluationDepth}`);

      setTimeout(() => {
        this.onEvaluationCallback = null;
        resolve(null);
      }, 3000);
    });
  }

  evaluateMoveQuality(beforeEval, afterEval, isPlayerMove = true) {
    if (!beforeEval || !afterEval) {
      return {
        quality: "unknown",
        description: "Unable to evaluate",
        centipawns: 0,
      };
    }

    let beforeCp = this.evaluationToCentipawns(beforeEval, isPlayerMove);
    let afterCp = this.evaluationToCentipawns(afterEval, !isPlayerMove);

    const difference = afterCp - beforeCp;

    let quality, description, color;

    if (difference >= 100) {
      quality = "excellent";
      description = "Excellent move!";
      color = chalk.green.bold;
    } else if (difference >= 50) {
      quality = "good";
      description = "Good move";
      color = chalk.green;
    } else if (difference >= -50) {
      quality = "ok";
      description = "Decent move";
      color = chalk.cyan;
    } else if (difference >= -100) {
      quality = "inaccuracy";
      description = "Inaccuracy";
      color = chalk.yellow;
    } else if (difference >= -300) {
      quality = "mistake";
      description = "Mistake";
      color = chalk.magenta;
    } else {
      quality = "blunder";
      description = "Blunder!";
      color = chalk.red.bold;
    }

    return {
      quality,
      description,
      centipawns: Math.abs(difference),
      color,
      symbol: this.getQualitySymbol(quality),
    };
  }

  evaluationToCentipawns(evaluation, fromWhitePerspective = true) {
    if (evaluation.type === "mate") {
      const mateValue = evaluation.value > 0 ? 10000 : -10000;
      return fromWhitePerspective ? mateValue : -mateValue;
    } else {
      return fromWhitePerspective ? evaluation.value : -evaluation.value;
    }
  }

  getQualitySymbol(quality) {
    const symbols = {
      excellent: "‼️",
      good: "❗",
      ok: "✓",
      inaccuracy: "⁉️",
      mistake: "❓",
      blunder: "⁇",
    };
    return symbols[quality] || "?";
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
