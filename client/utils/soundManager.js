import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SoundManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.enabled = this.configManager.getConfig().soundEnabled ?? true;
    this.soundsPath = join(__dirname, "..", "sounds");

    this.sounds = {
      move: "move-self.mp3",
      capture: "capture.mp3",
      castle: "castle.mp3",
      check: "move-check.mp3",
      checkmate: "game-end.mp3",
      draw: "game-draw.mp3",
      promotion: "promote.mp3",
      start: "game-start.mp3",
      illegal: "illegal.mp3",
    };

    this.player = this.detectPlayer();
  }

  detectPlayer() {
    const platform = process.platform;

    if (platform === "darwin") {
      return { command: "afplay", args: [] };
    } else if (platform === "win32") {
      return {
        command: "powershell",
        args: ["-c", "(New-Object Media.SoundPlayer"],
      };
    } else {
      const players = [
        { command: "aplay", args: [] },
        { command: "paplay", args: [] },
        { command: "play", args: ["-q"] },
        { command: "mpg123", args: ["-q"] },
        {
          command: "ffplay",
          args: ["-nodisp", "-autoexit", "-loglevel", "quiet"],
        },
      ];

      for (const player of players) {
        if (this.commandExists(player.command)) {
          return player;
        }
      }

      console.warn("No audio player found. Sound will be disabled.");
      return null;
    }
  }

  commandExists(command) {
    try {
      spawn("which", [command]);
      return true;
    } catch {
      return false;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    this.configManager.updateConfig({ soundEnabled: this.enabled });
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.configManager.updateConfig({ soundEnabled: enabled });
  }

  isEnabled() {
    return this.enabled;
  }

  playSound(soundType) {
    if (!this.enabled || !this.player) return;

    const soundFile = this.sounds[soundType];
    if (!soundFile) return;

    const soundPath = join(this.soundsPath, soundFile);

    if (!fs.existsSync(soundPath)) {
      return;
    }

    try {
      if (process.platform === "win32") {
        spawn(
          "powershell",
          [
            "-c",
            `(New-Object System.Media.SoundPlayer '${soundPath}').PlaySync()`,
          ],
          {
            detached: true,
            stdio: "ignore",
          }
        );
      } else {
        const args = [...this.player.args, soundPath];
        spawn(this.player.command, args, {
          detached: true,
          stdio: "ignore",
        });
      }
    } catch (error) {}
  }

  playMoveSound(move, chess) {
    if (!this.enabled) return;

    if (chess.isCheckmate()) {
      this.playSound("checkmate");
    } else if (chess.isCheck()) {
      this.playSound("check");
    } else if (chess.isDraw() || chess.isStalemate()) {
      this.playSound("draw");
    } else if (move.flags && move.flags.includes("p")) {
      this.playSound("promotion");
    } else if (
      move.flags &&
      (move.flags.includes("k") || move.flags.includes("q"))
    ) {
      this.playSound("castle");
    } else if (move.captured) {
      this.playSound("capture");
    } else {
      this.playSound("move");
    }
  }

  playGameStart() {
    this.playSound("start");
  }

  playIllegalMove() {
    this.playSound("illegal");
  }
}

export default SoundManager;
