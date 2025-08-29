#!/usr/bin/env node

import { Chess } from "chess.js";
import chalk from "chalk";
import inquirer from "inquirer";
import clear from "clear";
import figlet from "figlet";

class MiniChess {
  constructor() {
    this.chess = new Chess();
  }

  async start() {
    clear();
    console.log(
      chalk.yellow(figlet.textSync("Chess Arena", { horizontalLayout: "full" }))
    );

    this.displayBoard();
    await this.playGame();
  }

  displayBoard() {
    clear();
    console.log(chalk.yellow("\n♔ Chess Arena ♔\n"));

    const board = this.chess.board();
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    console.log("   " + files.join("  "));
    console.log("  " + "─".repeat(25));

    ranks.forEach((rank, i) => {
      const row = board[i];
      let rowDisplay = rank + " │";

      row.forEach((square) => {
        if (square) {
          const symbol = this.getPieceSymbol(square);
          rowDisplay +=
            square.color === "w" ? chalk.white(symbol) : chalk.gray(symbol);
        } else {
          rowDisplay += " ";
        }
        rowDisplay += " ";
      });

      console.log(rowDisplay + "│");
    });

    console.log("  " + "─".repeat(25));
  }

  getPieceSymbol(piece) {
    const symbols = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };
    return symbols[piece.type] || piece.type.toUpperCase();
  }

  async playGame() {
    while (!this.chess.isGameOver()) {
      await this.promptMove();
      this.displayBoard();
    }
    console.log(chalk.green("\nGame Over!"));
  }

  async promptMove() {
    const moves = this.chess.moves({ verbose: true });
    const moveStrings = moves.map((m) => `${m.from}-${m.to}`);

    const { moveInput } = await inquirer.prompt([
      {
        type: "input",
        name: "moveInput",
        message: 'Enter move (e.g., e2-e4) or "help":',
        validate: (input) => {
          if (input.toLowerCase() === "help") return true;

          const [from, to] = input.split("-");
          const move = moves.find((m) => m.from === from && m.to === to);
          return move ? true : 'Illegal move. Type "help" to see legal moves.';
        },
      },
    ]);

    if (moveInput.toLowerCase() === "help") {
      console.log("\nLegal moves:");
      moveStrings.forEach((m) => console.log("  " + m));
      return this.promptMove();
    }

    const [from, to] = moveInput.split("-");
    this.chess.move({ from, to });
  }
}

new MiniChess().start();
