import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";

const CONFIG_DIR = path.join(os.homedir(), ".chess-arena");
const GAMES_DIR = path.join(CONFIG_DIR, "saved_games");

export class PGNExporter {
  constructor() {
    this.gamesDirectory = GAMES_DIR;
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.gamesDirectory)) {
      fs.mkdirSync(this.gamesDirectory, { recursive: true });
    }
  }

  generateGameMetadata(gameInfo = {}) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, ".");
    const timeStr = now.toTimeString().split(" ")[0];

    return {
      Event: gameInfo.event || "Chess Arena Game",
      Site: gameInfo.site || "Chess Arena CLI",
      Date: dateStr,
      Round: gameInfo.round || "1",
      White: gameInfo.white || "Player",
      Black: gameInfo.black || (gameInfo.isOffline ? "Stockfish" : "Opponent"),
      Result: gameInfo.result || "*",
      Time: timeStr,
      TimeControl: gameInfo.timeControl || "-",
      Mode: gameInfo.mode || (gameInfo.isOffline ? "Computer" : "Online"),
    };
  }

  exportGame(chess, gameInfo = {}) {
    try {
      const metadata = this.generateGameMetadata(gameInfo);

      Object.entries(metadata).forEach(([key, value]) => {
        chess.header(key, value);
      });

      const pgnContent = chess.pgn({
        maxWidth: 80,
        newline: "\n",
      });

      const timestamp =
        new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
        "_" +
        new Date().toTimeString().split(" ")[0].replace(/:/g, "-");

      const opponent = gameInfo.isOffline ? "vs-Stockfish" : "vs-Online";
      const filename = `chess-game_${opponent}_${timestamp}.pgn`;
      const filepath = path.join(this.gamesDirectory, filename);

      fs.writeFileSync(filepath, pgnContent, "utf8");

      return {
        success: true,
        filename,
        filepath,
        pgnContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getGameResult(chess, playerColor, isOffline = false) {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      if (isOffline) {
        const playerWon = winner.toLowerCase() === playerColor;
        return playerWon ? "1-0" : "0-1";
      } else {
        return winner === "White" ? "1-0" : "0-1";
      }
    } else if (
      chess.isDraw() ||
      chess.isStalemate() ||
      chess.isThreefoldRepetition() ||
      chess.isInsufficientMaterial()
    ) {
      return "1/2-1/2";
    }
    return "*";
  }

  listSavedGames() {
    try {
      const files = fs
        .readdirSync(this.gamesDirectory)
        .filter((file) => file.endsWith(".pgn"))
        .map((file) => {
          const filepath = path.join(this.gamesDirectory, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            filepath,
            created: stats.birthtime,
            size: stats.size,
          };
        })
        .sort((a, b) => b.created - a.created);

      return files;
    } catch (error) {
      return [];
    }
  }

  loadGame(filename) {
    try {
      const filepath = path.join(this.gamesDirectory, filename);
      const pgnContent = fs.readFileSync(filepath, "utf8");
      return {
        success: true,
        content: pgnContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  deleteGame(filename) {
    try {
      const filepath = path.join(this.gamesDirectory, filename);
      fs.unlinkSync(filepath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  displayGameInfo(result) {
    if (result.success) {
      console.log(chalk.green("\n✓ Game exported successfully!"));
      console.log(chalk.cyan(`📁 Saved as: ${result.filename}`));
      console.log(chalk.gray(`📍 Location: ${result.filepath}`));

      const lines = result.pgnContent.split("\n");
      const headerLines = lines.filter((line) => line.startsWith("["));
      const moveLines = lines.filter(
        (line) => !line.startsWith("[") && line.trim()
      );

      console.log(chalk.yellow("\n📋 Game Summary:"));
      headerLines.slice(0, 6).forEach((line) => {
        console.log(chalk.gray(`  ${line}`));
      });

      if (moveLines.length > 0) {
        const moves = moveLines.join(" ").substring(0, 100);
        console.log(
          chalk.gray(`\n  Moves: ${moves}${moves.length >= 100 ? "..." : ""}`)
        );
      }
    } else {
      console.log(chalk.red(`\n❌ Export failed: ${result.error}`));
    }
  }
}

export default PGNExporter;
